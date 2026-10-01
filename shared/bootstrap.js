import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { nanoid } from "nanoid";
import { env } from "./env.js";
import { createLogger } from "./logger.js";
import { createMetrics } from "./metrics.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { breakerStates } from "./circuitBreaker.js";
import { cache } from "./cache.js";

export function createService(name) {
  const log = createLogger(name);
  const metrics = createMetrics(name);
  const app = express();

  // Trust only the local NGINX/gateway hop — trusting all proxies would let
  // anyone spoof X-Forwarded-For and bypass IP-based rate limiting.
  app.set("trust proxy", "loopback");
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.id = req.headers["x-request-id"] || nanoid(12);
    res.setHeader("x-request-id", req.id);
    next();
  });

  app.use(metrics.middleware);

  app.use((req, _res, next) => {
    if (req.path !== "/health" && req.path !== "/metrics") {
      log.debug({ requestId: req.id }, `${req.method} ${req.originalUrl}`);
    }
    next();
  });

  const startedAt = Date.now();

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      service: name,
      status: "healthy",
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      cache: cache.stats(),
      circuits: breakerStates(),
    });
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", metrics.registry.contentType);
    res.end(await metrics.registry.metrics());
  });

  function listen(port, onReady) {
    app.use(notFoundHandler);
    app.use(errorHandler(log));

    const server = app.listen(port, async () => {
      log.info(`${name} listening on http://localhost:${port}`);
      if (onReady) await onReady();
    });

    const shutdown = (signal) => async () => {
      log.info(`${signal} received, shutting down`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", shutdown("SIGTERM"));
    process.on("SIGINT", shutdown("SIGINT"));
    process.on("unhandledRejection", (reason) => log.error({ reason }, "Unhandled rejection"));

    return server;
  }

  return { app, log, metrics, listen, env };
}
