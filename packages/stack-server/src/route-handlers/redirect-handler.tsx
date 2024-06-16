import "../polyfills";

import { NextRequest } from "next/server";
import * as yup from "yup";
import { createSmartRouteHandler } from "./smart-route-handler";

export function redirectHandler(redirectPath: string, statusCode: 301 | 302 | 303 | 307 | 308 = 307): (req: NextRequest, options: any) => Promise<Response> {
  return createSmartRouteHandler({
    request: yup.object({
      url: yup.string().required(),
      method: yup.string().oneOf(["GET"]).required(),
    }),
    response: yup.object({
      statusCode: yup.number().oneOf([statusCode]).required(),
      headers: yup.object().shape({
        location: yup.array(yup.string().required()),
      }),
      bodyType: yup.string().oneOf(["text"]).required(),
      body: yup.string().required(),
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
