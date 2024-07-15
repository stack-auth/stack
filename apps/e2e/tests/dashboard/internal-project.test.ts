import crypto from "crypto";
import request from "supertest";
import { describe, expect } from "vitest";
import { STACK_DASHBOARD_BASE_URL, STACK_INTERNAL_PROJECT_CLIENT_KEY, STACK_INTERNAL_PROJECT_ID, test } from "../helpers";

const AUTH_HEADER = {
  "x-stack-project-id": STACK_INTERNAL_PROJECT_ID,
  "x-stack-publishable-client-key": STACK_INTERNAL_PROJECT_CLIENT_KEY,
};

const JSON_HEADER = {
  "content-type": "application/json"
};

function randomString() {
  return crypto.randomBytes(16).toString("hex");
}

async function signUpWithEmailPassword() {
  const email = randomString() + "@stack-test.example.com";
  const password = randomString();
  const response = await request(STACK_DASHBOARD_BASE_URL).post("/api/v1/auth/signup").set(AUTH_HEADER).set(JSON_HEADER).send({
    email,
    password,
    emailVerificationRedirectUrl: 'https://localhost:3000/verify-email',
  });

  return { email, password, response };
}

async function signInWithEmailPassword(email: string, password: string) {
  const response = await request(STACK_DASHBOARD_BASE_URL).post("/api/v1/auth/signin").set(AUTH_HEADER).set(JSON_HEADER).send({
    email,
    password,
  });

  return { email, password, response };
}

describe("Various internal project tests", () => {
  test("Main Page", async () => {
    const response = await request(STACK_DASHBOARD_BASE_URL).get("/");
    expect(response.status).toBe(307);
  });

  test("API root (no authentication)", async () => {
    const response = await request(STACK_DASHBOARD_BASE_URL).get("/api/v1");
    expect(response.status).toBe(200);
    expect(response.text).contains("Stack API");
    expect(response.text).contains("Authentication: None");
  });

  test("Credential sign up", async () => {
    const { response } = await signUpWithEmailPassword();
    expect(response.status).toBe(200);
  });

  test("Credential sign in", async () => {
    const { email, password } = await signUpWithEmailPassword();
    const { response } = await signInWithEmailPassword(email, password);

    expect(response.status).toBe(200);
  });

  test("No current user without authentication", async () => {
    const response = await request(STACK_DASHBOARD_BASE_URL).get("/api/v1/current-user").set(AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toBe(null);
  });

  test("Get current user", async () => {
    const { email, password, response } = await signUpWithEmailPassword();
    await signInWithEmailPassword(email, password);

    const response2 = await request(STACK_DASHBOARD_BASE_URL)
      .get("/api/v1/current-user")
      .set({
        ...AUTH_HEADER,
        'authorization': 'StackSession ' + response.body.accessToken,
      });
    expect(response2.status).toBe(200);
    expect(response2.body.primaryEmail).toBe(email);
  });

  test("Can't get current user with invalid token", async () => {
    const response = await request(STACK_DASHBOARD_BASE_URL)
      .get("/api/v1/current-user")
      .set({
        ...AUTH_HEADER,
        'authorization': 'StackSession invalid-token',
      });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  test("Update current user's display name", async () => {
    const { email, password, response } = await signUpWithEmailPassword();
    await signInWithEmailPassword(email, password);

    const response2 = await request(STACK_DASHBOARD_BASE_URL)
      .put("/api/v1/current-user")
      .set({
        ...AUTH_HEADER,
        'authorization': 'StackSession ' + response.body.accessToken,
      })
      .set(JSON_HEADER)
      .send({
        displayName: "New display name",
      });
    expect(response2.status).toBe(200);
    expect(response2.body.displayName).toBe("New display name");
  });

  test("Can't update current user's primary e-mail with client keys", async () => {
    const { email, password, response } = await signUpWithEmailPassword();
    await signInWithEmailPassword(email, password);

    const response2 = await request(STACK_DASHBOARD_BASE_URL)
      .put("/api/v1/current-user")
      .set({
        ...AUTH_HEADER,
        'authorization': 'StackSession ' + response.body.accessToken,
      })
      .set(JSON_HEADER)
      .send({
        primaryEmail: "thismailshouldntupdate@stack-test.example.com",
      });
    expect(response2.status).toBe(200);
    expect(response2.body.primaryEmail).toBe(email);
  });

  test("Can't update non-existing user's display name", async () => {
    const response = await request(STACK_DASHBOARD_BASE_URL)
      .put("/api/v1/current-user")
      .set(AUTH_HEADER)
      .set(JSON_HEADER)
      .send({
        displayName: "New username",
      });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  test("API root (signed in)", async () => {
    const { email, password, response } = await signUpWithEmailPassword();
    await signInWithEmailPassword(email, password);

    const response2 = await request(STACK_DASHBOARD_BASE_URL).get("/api/v1").set({
      ...AUTH_HEADER,
      'x-stack-request-type': 'client',
      'authorization': 'StackSession ' + response.body.accessToken,
    });
    expect(response2.status).toBe(200);
    expect(response2.text).contains("Stack API");
    expect(response2.text).contains("Authentication: Client");
    expect(response2.text).contains("Project: " + STACK_INTERNAL_PROJECT_ID);
    expect(response2.text).contains("User: " + email);
  });
});
