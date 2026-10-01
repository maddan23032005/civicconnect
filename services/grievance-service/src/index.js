import { createService, connectMongo, createProducer, env } from "../../../shared/index.js";
import { grievanceRoutes } from "./routes/grievanceRoutes.js";
import { createTriage } from "./services/triageService.js";

const { app, log, metrics, listen } = createService("grievance-service");
const producer = createProducer("grievance-service", log, metrics);
const triage = createTriage(log);

app.use("/api/grievances", grievanceRoutes({ log, producer, triage }));

listen(env.ports.grievance, async () => {
  await connectMongo(env.mongo.db.grievance, log);
  await producer.connect();
  log.info("Grievance service ready");
});
