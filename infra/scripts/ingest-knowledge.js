import fs from "fs";
import path from "path";
import { connectMongo, disconnectMongo, createLogger, env, ROOT_DIR } from "../../shared/index.js";
import { KnowledgeChunk } from "../../services/ai-service/src/models/KnowledgeChunk.js";
import { createEmbedder } from "../../services/ai-service/src/llm/embeddings.js";

const log = createLogger("ingest");

/** Splits long sections so each chunk stays inside a useful retrieval window. */
function chunkText(text, maxChars = 1200) {
  if (text.length <= maxChars) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function main() {
  const filePath = path.join(ROOT_DIR, "knowledge-base", "schemes.json");

  if (!fs.existsSync(filePath)) {
    log.error(`Not found: ${filePath}`);
    process.exit(1);
  }

  const schemes = JSON.parse(fs.readFileSync(filePath, "utf8"));
  log.info(`Loaded ${schemes.length} schemes`);

  await connectMongo(env.mongo.db.ai, log);

  const removed = await KnowledgeChunk.deleteMany({});
  log.info(`Cleared ${removed.deletedCount} existing chunks`);

  // Flatten schemes -> sections -> chunks
  const pending = [];
  for (const scheme of schemes) {
    for (const section of scheme.sections) {
      for (const piece of chunkText(section.content)) {
        pending.push({
          schemeId: scheme.schemeId,
          schemeName: scheme.schemeName,
          department: scheme.department,
          section: section.section,
          // Prefix gives the embedding scheme-level context it would otherwise lack
          content: `${scheme.schemeName} — ${section.section}: ${piece}`,
          metadata: scheme.metadata,
        });
      }
    }
  }

  log.info(`Prepared ${pending.length} chunks. Embedding at ${env.ai.dims} dimensions...`);

  const embedder = createEmbedder(log);
  let done = 0;

  for (const chunk of pending) {
    try {
      chunk.embedding = await embedder.embedDocument(chunk.content);
      await KnowledgeChunk.create(chunk);
      done++;
      log.info(`[${done}/${pending.length}] ${chunk.schemeName} / ${chunk.section}`);
      await new Promise((r) => setTimeout(r, 150));   // respect free-tier rate limits
    } catch (err) {
      log.error({ err: err.message, scheme: chunk.schemeName }, "Failed to embed chunk");
    }
  }

  const total = await KnowledgeChunk.countDocuments();
  log.info(`Ingestion complete. ${total} chunks stored in ${env.mongo.db.ai}.knowledgechunks`);

  await disconnectMongo();
  process.exit(0);
}

main().catch((err) => {
  log.error({ err: err.message }, "Ingestion failed");
  process.exit(1);
});
