import { createClient } from "@supabase/supabase-js";
import { env } from "../../../../shared/index.js";

// Supabase keys must be valid JWTs (start with eyJ). If they don't, they are dummy keys.
const isDummyKey = !env.supabase.serviceKey.startsWith("eyJ");

const supabase = isDummyKey ? null : createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: { persistSession: false },
});

const BUCKET = env.supabase.bucket;

// In-memory mock store for testing when valid Supabase keys are absent
const mockStore = new Map();

export function createStorage(log) {
  return {
    async upload({ userId, buffer, mimeType, originalName }) {
      const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      if (isDummyKey) {
        log.warn("Using dummy Supabase keys. Storing document in memory mock.");
        mockStore.set(path, buffer);
        return path;
      }

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mimeType, upsert: false });

      if (error) {
        log.error({ err: error.message }, "Supabase upload failed");
        throw new Error(`Upload failed: ${error.message}`);
      }

      log.info({ path, size: buffer.length }, "Document stored");
      return path;
    },

    /** Time-limited URL — the bucket is private, so this is the only way to read a file. */
    async signedUrl(path, expiresInSeconds = 300) {
      if (isDummyKey) {
        return `https://mock-supabase.local/storage/v1/object/sign/${BUCKET}/${path}?token=dummy-token`;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, expiresInSeconds);

      if (error) {
        log.error({ err: error.message }, "Signed URL generation failed");
        throw new Error("Could not generate a download link");
      }
      return data.signedUrl;
    },

    async download(path) {
      if (isDummyKey) {
        const buffer = mockStore.get(path);
        if (!buffer) throw new Error("File not found in mock store");
        return buffer;
      }

      const { data, error } = await supabase.storage.from(BUCKET).download(path);
      if (error) throw new Error(`Download failed: ${error.message}`);
      return Buffer.from(await data.arrayBuffer());
    },

    async remove(path) {
      if (isDummyKey) {
        mockStore.delete(path);
        return;
      }

      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) log.warn({ err: error.message }, "Storage delete failed");
    },
  };
}
