export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const BadRequest   = (m, d) => new AppError(m || "Bad request", 400, "BAD_REQUEST", d);
export const Unauthorized = (m)    => new AppError(m || "Unauthorized", 401, "UNAUTHORIZED");
export const Forbidden    = (m)    => new AppError(m || "Forbidden", 403, "FORBIDDEN");
export const NotFound     = (m)    => new AppError(m || "Not found", 404, "NOT_FOUND");
export const Conflict     = (m)    => new AppError(m || "Conflict", 409, "CONFLICT");
export const TooMany      = (m)    => new AppError(m || "Too many requests", 429, "RATE_LIMITED");
export const Unavailable  = (m)    => new AppError(m || "Service unavailable", 503, "UNAVAILABLE");

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

export function errorHandler(log) {
  return (err, req, res, _next) => {
    const status = err.statusCode || 500;
    const code = err.code || "INTERNAL_ERROR";

    if (status >= 500) {
      log.error({ err, requestId: req.id, path: req.originalUrl }, err.message);
    } else {
      log.warn({ requestId: req.id, path: req.originalUrl, code }, err.message);
    }

    res.status(status).json({
      success: false,
      error: {
        code,
        message: status >= 500 ? "Something went wrong on our side" : err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      requestId: req.id,
    });
  };
}
