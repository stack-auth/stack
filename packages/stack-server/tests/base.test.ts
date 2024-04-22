import { afterAll, beforeAll, describe, expect, test } from "vitest";
import request from "supertest";
import { startServer, stopServer } from "../src/server";

const PORT = 12231;
const BASE_URL = `http://localhost:${PORT}`;

describe("Basic", () => {
  beforeAll(async () => {
    await startServer(PORT);
  });

  afterAll(async () => {
    await stopServer();
  });

  test("Main page", async () => {
    const response = await request(BASE_URL).get("/");
    expect(response.status).toBe(307);
  });

  test("Test API", async () => {
    const response = await request(BASE_URL).get("/api/v1/test");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});