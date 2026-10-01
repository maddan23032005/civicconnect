import { createService, connectMongo, createProducer, env } from "../../../shared/index.js";
import { profileRoutes } from "./routes/profileRoutes.js";

const { app, log, metrics, listen } = createService("profile-service");
const producer = createProducer("profile-service", log, metrics);

app.use("/api/profile", profileRoutes({ log, producer }));

listen(env.ports.profile, async () => {
  await connectMongo(env.mongo.db.profile, log);
  await producer.connect();
  log.info("Profile service ready");
});
