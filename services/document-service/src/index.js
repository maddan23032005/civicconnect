import { createService, connectMongo, createProducer, env } from "../../../shared/index.js";
import { documentRoutes } from "./routes/documentRoutes.js";
import { createStorage } from "./services/storageService.js";
import { createVerification } from "./services/verificationService.js";

const { app, log, metrics, listen } = createService("document-service");

const producer = createProducer("document-service", log, metrics);
const storage = createStorage(log);
const verification = createVerification(log);

app.use("/api/documents", documentRoutes({ log, producer, storage, verification }));

listen(env.ports.document, async () => {
  await connectMongo(env.mongo.db.document, log);
  await producer.connect();
  log.info(`Document service ready — bucket: ${env.supabase.bucket}`);
});
