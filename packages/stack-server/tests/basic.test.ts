import { afterAll, beforeAll, describe, expect, test } from "vitest";
import request from "supertest";
import { BASE_URL, INTERNAL_PROJECT_CLIENT_KEY, INTERNAL_PROJECT_ID, afterAllFn, beforeAllFn } from "./helpers";
import exp from "constants";

const AUTH_HEADER = {
  "x-stack-project-id": INTERNAL_PROJECT_ID,
  "x-stack-publishable-client-key": INTERNAL_PROJECT_CLIENT_KEY,
};

const JSON_HEADER = {
  "content-type": "application/json"
}

function randomString() {
  return Math.random().toString(36);
}

async function signUpWithEmailPassword() {
  const email = randomString() + "@example.com";
  const password = randomString();
  const response = await request(BASE_URL).post("/api/v1/auth/signup").set(AUTH_HEADER).set(JSON_HEADER).send({
    email,
    password,
    emailVerificationRedirectUrl: 'https://localhost:3000/verify-email',
  });

  return { email, password, response };
}

async function signInWithEmailPassword(email: string, password: string) {
  const response = await request(BASE_URL).post("/api/v1/auth/signin").set(AUTH_HEADER).set(JSON_HEADER).send({
    email,
    password,
  });

  return { email, password, response };
}

describe("Basic", () => {
  beforeAll(beforeAllFn);
  afterAll(afterAllFn);

  test("Main Page", async () => {
    const response = await request(BASE_URL).get("/");
    expect(response.status).toBe(307);
  });

  test("Test API", async () => {
    const response = await request(BASE_URL).get("/api/v1/test");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  test("Credential Sign Up", async () => {
    const { response } = await signUpWithEmailPassword();
    expect(response.status).toBe(200);
  });

  test("Credential Sign In", async () => {
    const { email, password } = await signUpWithEmailPassword();
    const { response } = await signInWithEmailPassword(email, password);

    expect(response.status).toBe(200);
  });

  test("Get Current User", async () => {
    const { email, password, response } = await signUpWithEmailPassword();
    await signInWithEmailPassword(email, password);

    const response2 = await request(BASE_URL).get("/api/v1/current-user").set({
      ...AUTH_HEADER,
      'authorization': 'StackSession ' + response.body.accessToken,
    });
    expect(response2.status).toBe(200);
    expect(response2.body.primaryEmail).toBe(email)
  });
});