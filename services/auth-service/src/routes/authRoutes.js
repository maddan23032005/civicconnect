import { Router } from "express";
import { validate, z, mobileSchema, otpSchema, requireAuth } from "../../../../shared/index.js";
import { makeAuthController } from "../controllers/authController.js";

export function authRoutes(deps) {
  const c = makeAuthController(deps);
  const r = Router();

  r.post("/send-otp",
    validate(z.object({
      mobile: mobileSchema,
      purpose: z.enum(["register", "reset"]).default("register"),
    })),
    c.sendOtp);

  r.post("/register",
    validate(z.object({
      mobile: mobileSchema,
      otp: otpSchema,
      password: z.string().min(8, "Password must be at least 8 characters"),
      fullName: z.string().min(2).max(80),
      email: z.string().email().optional(),
    })),
    c.register);

  r.post("/login",
    validate(z.object({
      mobile: mobileSchema,
      password: z.string().min(1, "Password is required"),
    })),
    c.login);

  r.post("/refresh", c.refresh);
  r.post("/logout", requireAuth, c.logout);
  r.get("/me", requireAuth, c.me);

  return r;
}
