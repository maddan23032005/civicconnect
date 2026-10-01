import { createService, createProducer, env } from "../../../shared/index.js";
import { initSchema, pgHealth } from "./db/pool.js";
import { paymentRoutes } from "./routes/paymentRoutes.js";

const { app, log, metrics, listen } = createService("payment-service");
const producer = createProducer("payment-service", log, metrics);

app.use("/api/payments", paymentRoutes({ log, producer }));

app.get("/db-health", async (_req, res) => {
  try {
    res.json({ success: true, postgres: await pgHealth() });
  } catch (err) {
    res.status(503).json({ success: false, error: err.message });
  }
});

listen(env.ports.payment, async () => {
  await initSchema(log);
  await producer.connect();
  log.info("Payment service ready — Postgres (ACID) for financial records");
});
