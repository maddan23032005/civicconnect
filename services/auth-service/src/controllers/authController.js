import bcrypt from "bcryptjs";
import {
  asyncHandler, BadRequest, Unauthorized, Conflict, NotFound,
  TOPICS, env,
} from "../../../../shared/index.js";
import { User } from "../models/User.js";
import { issueOtp, verifyOtp } from "../services/otpService.js";
import { issueTokenPair, rotateRefreshToken, revokeAllForUser } from "../services/tokenService.js";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export function makeAuthController({ log, producer }) {
  return {
    sendOtp: asyncHandler(async (req, res) => {
      const { mobile, purpose = "register" } = req.body;

      if (purpose === "register") {
        const existing = await User.findOne({ mobile });
        if (existing) throw Conflict("This mobile number is already registered. Please log in instead.");
      }

      const code = await issueOtp(mobile, purpose, log);

      res.json({
        success: true,
        message: `OTP sent to ${mobile}`,
        expiresInSeconds: 300,
        ...(env.isDev ? { devOtp: code } : {}),
      });
    }),

    register: asyncHandler(async (req, res) => {
      const { mobile, otp, password, fullName, email } = req.body;

      const check = await verifyOtp(mobile, "register", otp);
      if (!check.ok) throw BadRequest(check.reason);

      const existing = await User.findOne({ mobile });
      if (existing) throw Conflict("This mobile number is already registered");

      const user = await User.create({
        mobile,
        email,
        fullName,
        passwordHash: await bcrypt.hash(password, 12),
        isVerified: true,
      });

      const tokens = await issueTokenPair(user, req.headers["user-agent"]);

      await producer.publish(TOPICS.auditLog, {
        event: "user.registered",
        userId: user._id.toString(),
        mobile: user.mobile,
      }, user._id.toString());

      log.info({ userId: user._id.toString() }, "New citizen registered");

      res.status(201).json({ success: true, user: user.toSafeJSON(), ...tokens });
    }),

    login: asyncHandler(async (req, res) => {
      const { mobile, password } = req.body;

      const user = await User.findOne({ mobile });
      if (!user) throw Unauthorized("No account found with that mobile number");
      if (!user.isActive) throw Unauthorized("This account has been deactivated");

      if (user.isLocked()) {
        const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
        throw Unauthorized(`Account locked due to failed attempts. Try again in ${mins} minute(s).`);
      }

      const valid = await bcrypt.compare(password, user.passwordHash);

      if (!valid) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= MAX_FAILED) {
          user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
          user.failedAttempts = 0;
          log.warn({ mobile }, "Account locked after repeated failures");
        }
        await user.save();
        throw Unauthorized("Incorrect password");
      }

      user.failedAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date();
      await user.save();

      const tokens = await issueTokenPair(user, req.headers["user-agent"]);

      res.json({ success: true, user: user.toSafeJSON(), ...tokens });
    }),

    refresh: asyncHandler(async (req, res) => {
      const { refreshToken } = req.body;
      if (!refreshToken) throw BadRequest("Refresh token is required");

      let decoded;
      try {
        ({ decoded } = await rotateRefreshToken(refreshToken, req.headers["user-agent"]));
      } catch {
        throw Unauthorized("Session expired, please log in again");
      }

      const user = await User.findById(decoded.sub);
      if (!user || !user.isActive) throw Unauthorized("Account no longer active");

      const tokens = await issueTokenPair(user, req.headers["user-agent"]);
      res.json({ success: true, ...tokens });
    }),

    logout: asyncHandler(async (req, res) => {
      await revokeAllForUser(req.user.sub);
      res.json({ success: true, message: "Logged out on all devices" });
    }),

    me: asyncHandler(async (req, res) => {
      const user = await User.findById(req.user.sub);
      if (!user) throw NotFound("Account not found");
      res.json({ success: true, user: user.toSafeJSON() });
    }),
  };
}
