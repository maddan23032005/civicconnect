import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export async function connectMongo(dbName, log) {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(env.mongo.uri, {
        dbName,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
      });
      log.info(`MongoDB connected -> ${dbName}`);

      mongoose.connection.on("disconnected", () => log.warn("MongoDB disconnected"));
      mongoose.connection.on("reconnected", () => log.info("MongoDB reconnected"));
      mongoose.connection.on("error", (e) => log.error({ err: e }, "MongoDB error"));

      return mongoose.connection;
    } catch (err) {
      const wait = attempt * 2000;
      log.error({ err: err.message }, `MongoDB connect failed (${attempt}/${maxAttempts}), retrying in ${wait}ms`);
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

export async function disconnectMongo() {
  await mongoose.connection.close();
}

export function mongoHealth() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return { status: states[mongoose.connection.readyState] || "unknown" };
}

export { mongoose };
