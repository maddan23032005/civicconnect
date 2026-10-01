import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { Unauthorized, Forbidden } from "./errors.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiry,
    issuer: "civicconnect",
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry,
    issuer: "civicconnect",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret, { issuer: "civicconnect" });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, { issuer: "civicconnect" });
}

function extract(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function requireAuth(req, _res, next) {
  const token = extract(req);
  if (!token) return next(Unauthorized("Authentication token missing"));
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return next(Unauthorized("Session expired, please log in again"));
    next(Unauthorized("Invalid authentication token"));
  }
}

export function optionalAuth(req, _res, next) {
  const token = extract(req);
  if (token) {
    try { req.user = verifyAccessToken(token); } catch { /* ignore */ }
  }
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(Unauthorized("Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(Forbidden(`This action requires one of: ${roles.join(", ")}`));
    }
    next();
  };
}

export const ROLES = { CITIZEN: "citizen", OFFICER: "officer", ADMIN: "admin" };
