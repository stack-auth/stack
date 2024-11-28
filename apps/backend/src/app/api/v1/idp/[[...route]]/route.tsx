import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { createNodeHttpServerDuplex } from "@stackframe/stack-shared/dist/utils/node-http";
import { NextRequest, NextResponse } from "next/server";
import { createOidcProvider } from "./idp";

const baseUrl = new URL(getEnvVariable("STACK_BASE_URL"));
const pathPrefix = "/api/v1/idp";
const oidc = createOidcProvider(new URL(pathPrefix, baseUrl).toString());
const oidcCallback = oidc.callback();

async function handler(req: NextRequest) {
  const newUrl = req.url.replace(pathPrefix, "");
  const newHeaders = new Headers(req.headers);
  const [incomingMessage, serverResponse] = await createNodeHttpServerDuplex({
    method: req.method,
    originalUrl: new URL(req.url),
    url: new URL(newUrl),
    headers: newHeaders,
    body: new Uint8Array(await req.arrayBuffer()),
  });

  await oidcCallback(incomingMessage, serverResponse);

  const body = new Uint8Array(serverResponse.bodyChunks.flatMap(chunk => [...chunk]));

  return new NextResponse(body, {
    headers: Object.entries(serverResponse.getHeaders()).filter(([k, v]) => v) as any,
    status: serverResponse.statusCode,
    statusText: serverResponse.statusMessage,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
