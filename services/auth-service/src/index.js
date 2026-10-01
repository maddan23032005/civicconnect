import { createService, connectMongo, createProducer, env } from "../../../shared/index.js";
import { authRoutes } from "./routes/authRoutes.js";

const { app, log, metrics, listen } = createService("auth-service");
const producer = createProducer("auth-service", log, metrics);

app.use("/api/auth", authRoutes({ log, producer }));

listen(env.ports.auth, async () => {
  await connectMongo(env.mongo.db.auth, log);
  await producer.connect();
  log.info("Auth service ready");
});
