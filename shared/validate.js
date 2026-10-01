import { z } from "zod";
import { BadRequest } from "./errors.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join(".") || source,
        message: i.message,
      }));
      return next(BadRequest("Validation failed", details));
    }
    req[source] = result.data;
    next();
  };
}

export const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
export const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");
export const aadhaarSchema = z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export { z };
