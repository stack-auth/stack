import { smartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deindent, typedCapitalize } from "@stackframe/stack-shared/dist/utils/strings";
import * as yup from "yup";

export const GET = smartRouteHandler({
  request: yup.object({
    auth: yup.object({
      type: yup.mixed(),
      user: yup.mixed(),
      project: yup.mixed(),
    }).nullable(),
    method: yup.string().oneOf(["GET"]).required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    bodyType: yup.string().oneOf(["text"]).required(),
    body: yup.string().required(),
  }),
  handler: async (req) => {
    return {
      statusCode: 200,
      bodyType: "text",
      body: deindent`
        Welcome to the Stack API endpoint! Please refer to the documentation at https://docs.stack-auth.com.

        Authentication: ${!req.auth ? "None" : deindent` ${typedCapitalize(req.auth.type)}
          Project: ${req.auth.project ? req.auth.project.id : "None"}
          User: ${req.auth.user ? req.auth.user.primaryEmail ?? req.auth.user.id : "None"}
        `}
      `,
    };
  },
});
