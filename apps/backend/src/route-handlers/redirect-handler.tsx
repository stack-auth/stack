import "../polyfills";

import { NextRequest } from "next/server";
import * as yup from "yup";
import { createSmartRouteHandler } from "./smart-route-handler";
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";

export function redirectHandler(redirectPath: string, statusCode: 301 | 302 | 303 | 307 | 308 = 307): (req: NextRequest, options: any) => Promise<Response> {
  return createSmartRouteHandler({
    request: yupObject({
      url: yupString().defined(),
      method: yupString().oneOf(["GET"]).defined(),
    }),
    response: yupObject({
      statusCode: yupNumber().oneOf([statusCode]).defined(),
      headers: yupObject({
        location: yupArray(yupString().defined()),
      }),
      bodyType: yupString().oneOf(["text"]).defined(),
      body: yupString().defined(),
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
