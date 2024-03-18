import { smartRouteHandler } from "@/lib/route-handlers";
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
    throw 123;
    return {
      statusCode: 200,
      bodyType: "text",
      body: "Welcome to the Stack API endpoint! Please refer to the documentation at https://docs.stackframe.co.",
    };
  },
});
