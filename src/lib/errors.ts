export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, message);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(500, message);
  }
}

export class CloudinaryError extends AppError {
  constructor(message: string) {
    super(500, `Cloudinary error: ${message}`);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, `Database error: ${message}`);
  }
}

/**
 * Handle Prisma errors and convert to AppError
 */
export function handlePrismaError(error: any): AppError {
  if (error.code === "P2002") {
    return new ConflictError("A record with this value already exists");
  }
  
  if (error.code === "P2025") {
    return new NotFoundError("Record not found");
  }
  
  if (error.code === "P2003") {
    return new ValidationError("Foreign key constraint failed");
  }
  
  if (error.code === "P2014") {
    return new ValidationError("Required relation is missing");
  }
  
  return new DatabaseError(error.message || "Unknown database error");
}

/**
 * Format error for API response
 */
export function formatError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }
  
  return {
    message: "An unknown error occurred",
    statusCode: 500,
  };
}