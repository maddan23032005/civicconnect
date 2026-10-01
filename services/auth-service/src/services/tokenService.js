import crypto from "crypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../../../shared/index.js";
import { RefreshToken } from "../models/RefreshToken.js";

export async function issueTokenPair(user, userAgent = null) {
  const payload = {
    sub: user._id.toString(),
    mobile: user.mobile,
    role: user.role,
    name: user.fullName,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: payload.sub, jti: crypto.randomUUID() });

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent,
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(oldToken, userAgent = null) {
  const decoded = verifyRefreshToken(oldToken);

  const stored = await RefreshToken.findOne({ token: oldToken, revoked: false });
  if (!stored) throw new Error("Refresh token not recognised or already used");

  stored.revoked = true;
  await stored.save();

  return { decoded, userAgent };
}

export async function revokeAllForUser(userId) {
  await RefreshToken.updateMany({ userId, revoked: false }, { revoked: true });
}
