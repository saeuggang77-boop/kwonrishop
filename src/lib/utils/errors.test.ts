import { describe, it, expect } from "vitest";
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  errorToResponse,
} from "./errors";

describe("Error classes", () => {
  it("AppError has correct status code", () => {
    const err = new AppError("test", 400, "TEST");
    expect(err.message).toBe("test");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("TEST");
    expect(err.name).toBe("AppError");
  });

  it("UnauthorizedError defaults to 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("ForbiddenError defaults to 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it("NotFoundError defaults to 404", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it("ValidationError carries field errors", () => {
    const err = new ValidationError("잘못됨", { email: ["필수"] });
    expect(err.statusCode).toBe(400);
    expect(err.errors).toEqual({ email: ["필수"] });
  });

  it("ConflictError defaults to 409", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });

  it("RateLimitError defaults to 429", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
  });
});

describe("errorToResponse", () => {
  it("converts AppError to proper response", async () => {
    const err = new NotFoundError("매물 없음");
    const res = errorToResponse(err);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe("매물 없음");
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("converts ValidationError with field errors", async () => {
    const err = new ValidationError("검증 실패", { title: ["필수 입력"] });
    const res = errorToResponse(err);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.errors).toEqual({ title: ["필수 입력"] });
  });

  it("converts unknown errors to 500", async () => {
    const res = errorToResponse(new Error("unexpected"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("handles non-Error values", async () => {
    const res = errorToResponse("string error");
    expect(res.status).toBe(500);
  });
});
