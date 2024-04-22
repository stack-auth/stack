import { afterAll, beforeAll, describe, expect, test } from "vitest";
import request from "supertest";
import { BASE_URL, INTERNAL_PROJECT_CLIENT_KEY, INTERNAL_PROJECT_ID, afterAllFn, beforeAllFn } from "./helpers";

function randomString() {
  return Math.random().toString(36);
}

describe("Basic", () => {
  beforeAll(beforeAllFn);
  afterAll(afterAllFn);

  test("Main page", async () => {
    const response = await request(BASE_URL).get("/");
    expect(response.status).toBe(307);
  });

  test("Test API", async () => {
    const response = await request(BASE_URL).get("/api/v1/test");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  test("Credential Sign Up", async () => {
    const response = await request(BASE_URL).post(
      "/api/v1/auth/signup"
    ).set({
      "x-stack-project-id": INTERNAL_PROJECT_ID,
      "x-stack-publishable-client-key": INTERNAL_PROJECT_CLIENT_KEY,
    }).set(
      "content-type", "application/json"
    ).send({
      email: randomString() + "@example.com",
      password: randomString(),
      emailVerificationRedirectUrl: 'https://localhost:3000/verify-email',
    });
    expect(response.status).toBe(200);
  });
});