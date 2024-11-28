import { IncomingMessage, ServerResponse } from "http";
import { getRelativePart } from "./urls";

class ServerResponseWithBodyChunks extends ServerResponse {
  bodyChunks: Uint8Array[] = [];

  // note: we actually override this, even though it's private in the parent
  _send(data: string, encoding: BufferEncoding, callback?: (() => void) | null, byteLength?: number) {
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = "utf-8";
    }
    const encodedBuffer = new Uint8Array(Buffer.from(data, encoding));
    this.bodyChunks.push(encodedBuffer);
    callback?.();
  }
}

export async function createNodeHttpServerDuplex(options: {
  method: string,
  originalUrl?: URL,
  url: URL,
  headers: Headers,
  body: Uint8Array,
}): Promise<[IncomingMessage, ServerResponseWithBodyChunks]> {
  const incomingMessage = new IncomingMessage({} as any);
  incomingMessage.httpVersionMajor = 1;
  incomingMessage.httpVersionMinor = 1;
  incomingMessage.httpVersion = '1.1';
  incomingMessage.method = options.method;
  incomingMessage.url = getRelativePart(options.url);

  // Fact 1: Koa does not just blindly copy `incomingMessage.originalUrl` to construct `koaContext.originalUrl`; the
  // latter is always guaranteed to be a full URL, including host. It uses the `Host` header to get the host
  //
  // Fact 2: Koa may strip out the `Host` header depending on the sec-fetch-dest and sec-fetch-mode
  //
  // Due to fact 2, Koa might not know the origin, and the `koaContext.originalUrl` it builds is incorrect
  //
  // However, if `incomingMessage.originalUrl` already is a full URL, then Koa won't use the `Host` header and just
  // takes the value as-is. Hence, we keep the hostname, and don't call `getRelativePart` on it
  //
  // originalUrl is an extension that we add to incomingMessage specifically for Koa callbacks, so this is OK to do
  (incomingMessage as any).originalUrl = options.originalUrl?.toString();

  const rawHeaders = [...options.headers.entries()].flat();
  (incomingMessage as any)._addHeaderLines(rawHeaders, rawHeaders.length / 2);
  incomingMessage.push(options.body);
  incomingMessage.complete = true;

  const serverResponse = new ServerResponseWithBodyChunks(incomingMessage);

  return [incomingMessage, serverResponse];
}
