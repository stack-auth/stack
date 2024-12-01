import { handleApiRequest } from "@/route-handlers/smart-route-handler";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { createNodeHttpServerDuplex } from "@stackframe/stack-shared/dist/utils/node-http";
import { NextRequest, NextResponse } from "next/server";
import { createOidcProvider } from "./idp";

export const dynamic = "force-dynamic";

const pathPrefix = "/api/v1/integrations/neon/oauth/idp";

// we want to initialize the OIDC provider lazily so it's not initiated at build time
let _oidcCallbackPromiseCache: Promise<any> | undefined;
function getOidcCallbackPromise() {
  if (!_oidcCallbackPromiseCache) {
    const apiBaseUrl = new URL(getEnvVariable("NEXT_PUBLIC_STACK_API_URL"));
    const idpBaseUrl = new URL(pathPrefix, apiBaseUrl);
    _oidcCallbackPromiseCache = (async () => {
      const oidc = await createOidcProvider({
        id: "stack-preconfigured-idp:integrations/neon",
        baseUrl: idpBaseUrl.toString(),
      });
      return oidc.callback();
    })();
  }
  return _oidcCallbackPromiseCache;
}

const handler = handleApiRequest(async (req: NextRequest) => {
  const newUrl = req.url.replace(pathPrefix, "");
  if (newUrl === req.url) {
    throw new StackAssertionError("No path prefix found in request URL. Is the pathPrefix correct?", { newUrl, url: req.url, pathPrefix });
  }
  const newHeaders = new Headers(req.headers);
  const incomingBody = new Uint8Array(await req.arrayBuffer());
  const [incomingMessage, serverResponse] = await createNodeHttpServerDuplex({
    method: req.method,
    originalUrl: new URL(req.url),
    url: new URL(newUrl),
    headers: newHeaders,
    body: incomingBody,
  });

  await (await getOidcCallbackPromise())(incomingMessage, serverResponse);

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
