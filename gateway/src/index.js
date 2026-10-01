import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import axios from "axios";
import {
  createService, env, requireAuth, TooMany, asyncHandler,
} from "../../shared/index.js";
import { routes, isPublic } from "./routeTable.js";

const PORT = +(process.env.GATEWAY_PORT || env.ports.gateway);
const { app, log, listen } = createService(`gateway-${PORT}`);

/* ---------- rate limiting ---------- */
const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(TooMany("Too many requests, please slow down")),
});

const aiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(TooMany("AI request limit reached, try again shortly")),
});

app.use("/api/ai", aiLimiter);
app.use("/api", generalLimiter);

/* ---------- auth guard ---------- */
app.use("/api", (req, res, next) => {
  const fullPath = req.baseUrl + req.path;
  if (isPublic(fullPath)) return next();
  return requireAuth(req, res, next);
});

/* ---------- aggregated system health (for the dashboard) ---------- */
app.get("/api/system/health", asyncHandler(async (_req, res) => {
  const checks = await Promise.all(
    routes.map(async (r) => {
      const started = Date.now();
      try {
        const { data } = await axios.get(`${r.target}/health`, { timeout: 3000 });
        return {
          service: r.service,
          status: "up",
          latencyMs: Date.now() - started,
          uptimeSeconds: data.uptimeSeconds,
        };
      } catch {
        return { service: r.service, status: "down", latencyMs: Date.now() - started };
      }
    })
  );

  res.json({
    success: true,
    gateway: { instance: `gateway-${PORT}`, status: "up" },
    services: checks,
    summary: {
      total: checks.length,
      up: checks.filter((c) => c.status === "up").length,
      down: checks.filter((c) => c.status === "down").length,
    },
    timestamp: new Date().toISOString(),
  });
}));

/* ---------- proxy to microservices ---------- */
for (const route of routes) {
  app.use(
    route.prefix,
    createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      pathRewrite: (path) => route.prefix + path,
      timeout: 20000,
      proxyTimeout: 20000,
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.setHeader("x-request-id", req.id || "");
          proxyReq.setHeader("x-gateway-instance", String(PORT));
          if (req.user) {
            proxyReq.setHeader("x-user-id", req.user.sub || "");
            proxyReq.setHeader("x-user-role", req.user.role || "");
          }

          // express.json() already consumed the stream — replay it downstream.
          // Multipart bodies are never parsed by express.json(), so they stream
          // through untouched and must not be rewritten here.
          const isMultipart = (req.headers["content-type"] || "").includes("multipart/form-data");

          if (!isMultipart && req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader("Content-Type", "application/json");
            proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            proxyReq.end();
          }
        },
        error: (err, req, res) => {
          log.error({ service: route.service, err: err.message }, "Upstream unreachable");
          if (!res.headersSent) {
            res.writeHead(503, { "Content-Type": "application/json" });
          }
          res.end(JSON.stringify({
            success: false,
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: `${route.service} is temporarily unavailable. Other services are unaffected.`,
            },
            requestId: req.id,
          }));
        },
      },
    })
  );
}

listen(PORT, () => {
  log.info(`Gateway instance ${PORT} routing ${routes.length} services`);
});
