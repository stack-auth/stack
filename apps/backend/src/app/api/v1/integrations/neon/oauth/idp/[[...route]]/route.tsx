import { handleApiRequest } from "@/route-handlers/smart-route-handler";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { createNodeHttpServerDuplex } from "@stackframe/stack-shared/dist/utils/node-http";
import { NextRequest, NextResponse } from "next/server";
import { createOidcProvider } from "./idp";

const apiBaseUrl = new URL(getEnvVariable("STACK_BASE_URL"));
const pathPrefix = "/api/v1/integrations/neon/oauth/idp";
const idpBaseUrl = new URL(pathPrefix, apiBaseUrl);
const oidcCallbackPromise = (async () => {
  const oidc = await createOidcProvider({
    id: "stack-preconfigured-idp:integrations/neon",
    baseUrl: idpBaseUrl.toString(),
  });
  return oidc.callback();
})();

const handler = handleApiRequest(async (req: NextRequest) => {
  const newUrl = req.url.replace(pathPrefix, "");
  if (newUrl === req.url) {
    throw new StackAssertionError("No path prefix found in request URL. Is the pathPrefix correct?", { newUrl, url: req.url, pathPrefix });
  }
  const newHeaders = new Headers(req.headers);
  const incomingBody = new Uint8Array(await req.arrayBuffer());
  console.log("BBBBBBBB", incomingBody, new TextDecoder().decode(incomingBody));
  const [incomingMessage, serverResponse] = await createNodeHttpServerDuplex({
    method: req.method,
    originalUrl: new URL(req.url),
    url: new URL(newUrl),
    headers: newHeaders,
    body: incomingBody,
  });

  await (await oidcCallbackPromise)(incomingMessage, serverResponse);

  const body = new Uint8Array(serverResponse.bodyChunks.flatMap(chunk => [...chunk]));

  return new NextResponse(body, {
    headers: Object.entries(serverResponse.getHeaders()).filter(([k, v]) => v) as any,
    status: serverResponse.statusCode,
    statusText: serverResponse.statusMessage,
  });
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
