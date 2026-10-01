import { createService, connectMongo, createConsumer, TOPICS, env } from "../../../shared/index.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { createEventHandler } from "./consumers/eventConsumer.js";

const { app, log, metrics, listen } = createService("notification-service");

app.use("/api/notifications", notificationRoutes());

listen(env.ports.notification, async () => {
  await connectMongo(env.mongo.db.notification, log);

  const consumer = createConsumer("notification-service", "civic-notifications", log, metrics);
  await consumer.start(
    [
      TOPICS.grievanceCreated,
      TOPICS.grievanceUpdated,
      TOPICS.paymentCompleted,
      TOPICS.documentUploaded,
    ],
    createEventHandler(log)
  );

  log.info("Notification service ready and consuming events");
});
