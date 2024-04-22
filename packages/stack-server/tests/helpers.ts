import { startServer, stopServer } from "../src/server";

const PORT = 12231;
export const BASE_URL = `http://localhost:${PORT}`;
export const INTERNAL_PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID
export const INTERNAL_PROJECT_CLIENT_KEY = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

export const beforeAllFn = async () => {
  await startServer(PORT);
}

export const afterAllFn = async () => {
  await stopServer();
}