import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

function req(key) {
  const v = process.env[key];
  if (!v || v.trim() === "") {
    console.error(`\n[FATAL] Missing required env var: ${key}`);
    console.error(`Check D:\\CivicConnect\\.env\n`);
    process.exit(1);
  }
  return v.trim();
}

function opt(key, fallback) {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : fallback;
}

export const ROOT_DIR = ROOT;

export const env = {
  NODE_ENV: opt("NODE_ENV", "development"),
  LOG_LEVEL: opt("LOG_LEVEL", "info"),
  isDev: opt("NODE_ENV", "development") !== "production",

  ports: {
    auth: +opt("AUTH_PORT", 5001),
    profile: +opt("PROFILE_PORT", 5002),
    document: +opt("DOCUMENT_PORT", 5003),
    payment: +opt("PAYMENT_PORT", 5004),
    grievance: +opt("GRIEVANCE_PORT", 5005),
    notification: +opt("NOTIFICATION_PORT", 5006),
    ai: +opt("AI_PORT", 5007),
    gateway: +opt("GATEWAY_PORT", 4000),
  },

  urls: {
    auth: opt("AUTH_URL", "http://localhost:5001"),
    profile: opt("PROFILE_URL", "http://localhost:5002"),
    document: opt("DOCUMENT_URL", "http://localhost:5003"),
    payment: opt("PAYMENT_URL", "http://localhost:5004"),
    grievance: opt("GRIEVANCE_URL", "http://localhost:5005"),
    notification: opt("NOTIFICATION_URL", "http://localhost:5006"),
    ai: opt("AI_URL", "http://localhost:5007"),
    public: opt("PUBLIC_URL", "http://localhost:8080"),
    frontend: opt("FRONTEND_URL", "http://localhost:5173"),
  },

  mongo: {
    uri: req("MONGO_URI"),
    db: {
      auth: opt("DB_AUTH", "civic_auth"),
      profile: opt("DB_PROFILE", "civic_profile"),
      document: opt("DB_DOCUMENT", "civic_document"),
      grievance: opt("DB_GRIEVANCE", "civic_grievance"),
      notification: opt("DB_NOTIFICATION", "civic_notification"),
      ai: opt("DB_AI", "civic_ai"),
    },
  },

  kafka: {
    broker: req("KAFKA_BROKER"),
    username: req("KAFKA_USERNAME"),
    password: req("KAFKA_PASSWORD"),
    mechanism: opt("KAFKA_MECHANISM", "scram-sha-256"),
    ssl: opt("KAFKA_SSL", "true") === "true",
    clientId: opt("KAFKA_CLIENT_ID", "civicconnect"),
    topics: {
      grievanceCreated: opt("TOPIC_GRIEVANCE_CREATED", "grievance.created"),
      grievanceUpdated: opt("TOPIC_GRIEVANCE_UPDATED", "grievance.updated"),
      paymentCompleted: opt("TOPIC_PAYMENT_COMPLETED", "payment.completed"),
      documentUploaded: opt("TOPIC_DOCUMENT_UPLOADED", "document.uploaded"),
      notificationSend: opt("TOPIC_NOTIFICATION_SEND", "notification.send"),
      auditLog: opt("TOPIC_AUDIT_LOG", "audit.log"),
    },
  },

  supabase: {
    url: opt("SUPABASE_URL", ""),
    anonKey: opt("SUPABASE_ANON_KEY", ""),
    serviceKey: opt("SUPABASE_SERVICE_KEY", ""),
    dbUrl: opt("SUPABASE_DB_URL", ""),
    bucket: opt("SUPABASE_BUCKET", "citizen-documents"),
  },

  ai: {
    geminiKey: opt("GEMINI_API_KEY", ""),
    groqKey: opt("GROQ_API_KEY", ""),
    chatModel: opt("GEMINI_CHAT_MODEL", "gemini-2.5-flash"),
    embedModel: opt("GEMINI_EMBED_MODEL", "gemini-embedding-001"),
    groqModel: opt("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile"),
    dims: +opt("EMBED_DIMENSIONS", 768),
    indexName: opt("VECTOR_INDEX_NAME", "civic_vector_index"),
    topK: +opt("RAG_TOP_K", 5),
    minScore: +opt("RAG_MIN_SCORE", 0.65),
  },

  razorpay: {
    keyId: opt("RAZORPAY_KEY_ID", ""),
    keySecret: opt("RAZORPAY_KEY_SECRET", ""),
  },

  jwt: {
    secret: req("JWT_SECRET"),
    refreshSecret: req("JWT_REFRESH_SECRET"),
    expiry: opt("JWT_EXPIRY", "15m"),
    refreshExpiry: opt("JWT_REFRESH_EXPIRY", "7d"),
  },

  rateLimit: {
    windowMs: +opt("RATE_LIMIT_WINDOW_MS", 60000),
    max: +opt("RATE_LIMIT_MAX", 100),
    aiMax: +opt("AI_RATE_LIMIT_MAX", 15),
  },
};
