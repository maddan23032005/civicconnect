import client from "prom-client";

export function createMetrics(service) {
  const registry = new client.Registry();
  registry.setDefaultLabels({ service });
  client.collectDefaultMetrics({ register: registry });

  const httpDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [registry],
  });

  const httpTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });

  const errorsTotal = new client.Counter({
    name: "app_errors_total",
    help: "Total application errors",
    labelNames: ["code"],
    registers: [registry],
  });

  const kafkaPublished = new client.Counter({
    name: "kafka_messages_published_total",
    help: "Kafka messages published",
    labelNames: ["topic"],
    registers: [registry],
  });

  const kafkaConsumed = new client.Counter({
    name: "kafka_messages_consumed_total",
    help: "Kafka messages consumed",
    labelNames: ["topic"],
    registers: [registry],
  });

  function middleware(req, res, next) {
    const end = httpDuration.startTimer();
    res.on("finish", () => {
      const route = req.route?.path || req.path || "unknown";
      const labels = { method: req.method, route, status: res.statusCode };
      end(labels);
      httpTotal.inc(labels);
      if (res.statusCode >= 400) errorsTotal.inc({ code: res.statusCode });
    });
    next();
  }

  return { registry, middleware, httpDuration, httpTotal, errorsTotal, kafkaPublished, kafkaConsumed };
}
