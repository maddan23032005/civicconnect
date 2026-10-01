import { createService, connectMongo, env } from "../../../shared/index.js";
import { createLlm } from "./llm/provider.js";
import { createEmbedder } from "./llm/embeddings.js";
import { createRetriever } from "./rag/retriever.js";
import { createRagPipeline } from "./rag/ragPipeline.js";
import { createTriageAgent } from "./agents/triageAgent.js";
import { createDocumentAgent } from "./agents/documentAgent.js";
import { aiRoutes } from "./routes/aiRoutes.js";

const { app, log, listen } = createService("ai-service");

const llm = createLlm(log);
const embedder = createEmbedder(log);
const retriever = createRetriever(embedder, log);
const rag = createRagPipeline({ llm, retriever, log });
const triageAgent = createTriageAgent({ llm, log });
const documentAgent = createDocumentAgent({ log });

app.use("/api/ai", aiRoutes({ rag, triageAgent, documentAgent, log }));

listen(env.ports.ai, async () => {
  await connectMongo(env.mongo.db.ai, log);
  log.info(`AI service ready — chat: ${env.ai.chatModel}, embed: ${env.ai.embedModel} @ ${env.ai.dims}d`);
});
