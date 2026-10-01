import { cache } from "../../../../shared/index.js";

const OTP_TTL_SECONDS = 300;   // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;

function generate() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(mobile, purpose, log) {
  const code = generate();
  await cache.set(`otp:${purpose}:${mobile}`, { code, attempts: 0 }, OTP_TTL_SECONDS);

  // Demo mode: OTP is logged and returned. Replace with an SMS gateway for production.
  log.info(`OTP for ${mobile} [${purpose}]: ${code}`);
  return code;
}

export async function verifyOtp(mobile, purpose, submitted) {
  const key = `otp:${purpose}:${mobile}`;
  const entry = await cache.get(key);

  if (!entry) return { ok: false, reason: "OTP expired or was never requested" };

  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    await cache.del(key);
    return { ok: false, reason: "Too many incorrect attempts, request a new OTP" };
  }

  if (entry.code !== submitted) {
    entry.attempts += 1;
    await cache.set(key, entry, OTP_TTL_SECONDS);
    return { ok: false, reason: `Incorrect OTP. ${MAX_VERIFY_ATTEMPTS - entry.attempts} attempts remaining` };
  }

  await cache.del(key);
  return { ok: true };
}
