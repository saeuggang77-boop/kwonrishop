export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "인증이 필요합니다.") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "접근 권한이 없습니다.") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "요청한 리소스를 찾을 수 없습니다.") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "입력값이 올바르지 않습니다.",
    public errors?: Record<string, string[]>
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "이미 존재하는 리소스입니다.") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.") {
    super(message, 429, "RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

/**
 * API 라우트에서 에러를 Response로 변환
 */
export function errorToResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          message: error.message,
          code: error.code,
          ...(error instanceof ValidationError && error.errors
            ? { errors: error.errors }
            : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  console.error("Unexpected error:", error);
  return Response.json(
    {
      error: {
        message: "서버 내부 오류가 발생했습니다.",
        code: "INTERNAL_SERVER_ERROR",
      },
    },
    { status: 500 }
  );
}
