import { NextRequest } from "next/server";
import { yupArray, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import "../polyfills";
import { createSmartRouteHandler } from "./smart-route-handler";

export function redirectHandler(
  redirectPath: string,
  statusCode: 301 | 302 | 303 | 307 | 308 = 307,
): (req: NextRequest, options: any) => Promise<Response> {
  return createSmartRouteHandler({
    request: yupObject({
      url: yupString().required(),
      method: yupString().oneOf(["GET"]).required(),
    }),
    response: yupObject({
      statusCode: yupNumber().oneOf([statusCode]).required(),
      headers: yupObject({
        location: yupArray(yupString().required()),
      }),
      bodyType: yupString().oneOf(["text"]).required(),
      body: yupString().required(),
    }),
    async handler(req) {
      const urlWithTrailingSlash = new URL(req.url);
      if (!urlWithTrailingSlash.pathname.endsWith("/")) {
        urlWithTrailingSlash.pathname += "/";
      }
      const newUrl = new URL(redirectPath, urlWithTrailingSlash);
      return {
        statusCode,
        headers: {
          location: [newUrl.toString()],
        },
        bodyType: "text",
        body: "Redirecting...",
      };
    },
  });
}
