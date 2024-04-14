import { smartRouteHandler } from "@/lib/route-handlers";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";

export const GET = smartRouteHandler({
  request: yup.object({
    method: yup.string().oneOf(["GET"]).required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    bodyType: yup.string().oneOf(["text"]).required(),
    body: yup.string().required(),
  }),
  handler: async (req) => {
    console.error("hiya");
    throw new StackAssertionError("This is a test error", {abc: "smth", def: new Error("This is an error"), map: new Map([["key", "value"]])});
  },
});
