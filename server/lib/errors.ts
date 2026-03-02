export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super(400, "Validation failed");
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "غير مصرح بالوصول") {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "ليس لديك صلاحية لهذا الإجراء") {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, `${entity} غير موجود`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number) {
    super(429, "طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.");
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Build a standardized JSON error response from an AppError or unknown error.
 * All responses include `{ success: false }` for consistent client parsing.
 */
export function errorResponse(error: unknown) {
  if (error instanceof ValidationError) {
    return Response.json(
      { success: false, error: error.message, errors: error.errors },
      { status: error.statusCode }
    );
  }

  if (error instanceof RateLimitError) {
    return Response.json(
      { success: false, error: error.message },
      {
        status: error.statusCode,
        headers: { "Retry-After": String(error.retryAfter) },
      }
    );
  }

  if (error instanceof AppError) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  // Unknown errors — never leak stack traces in production
  const message =
    process.env.NODE_ENV === "production"
      ? "حدث خطأ غير متوقع"
      : (error as Error)?.message ?? "Unknown error";

  return Response.json({ success: false, error: message }, { status: 500 });
}
