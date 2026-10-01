import { env } from "../../shared/index.js";

export const routes = [
  { prefix: "/api/auth",          target: env.urls.auth,         service: "auth-service" },
  { prefix: "/api/profile",       target: env.urls.profile,      service: "profile-service" },
  { prefix: "/api/documents",     target: env.urls.document,     service: "document-service" },
  { prefix: "/api/payments",      target: env.urls.payment,      service: "payment-service" },
  { prefix: "/api/grievances",    target: env.urls.grievance,    service: "grievance-service" },
  { prefix: "/api/notifications", target: env.urls.notification, service: "notification-service" },
  { prefix: "/api/ai",            target: env.urls.ai,           service: "ai-service" },
];

// Routes reachable without a token
export const publicRoutes = [
  /^\/api\/auth\/register$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/verify-otp$/,
  /^\/api\/auth\/send-otp$/,
  /^\/api\/auth\/refresh$/,
  /^\/api\/ai\/ask$/,
  /^\/api\/documents\/types$/,
  /^\/api\/payments\/fees$/,
  /^\/api\/system\/.*$/,
];

export function isPublic(path) {
  return publicRoutes.some((re) => re.test(path));
}
