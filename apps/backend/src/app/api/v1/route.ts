import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deindent, typedCapitalize } from "@stackframe/stack-shared/dist/utils/strings";
import * as yup from "yup";
import { adaptSchema } from "@stackframe/stack-shared/dist/schema-fields";

export const GET = createSmartRouteHandler({
  request: yup.object({
    auth: yup.object({
      type: adaptSchema,
      user: adaptSchema,
      project: adaptSchema,
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
          Project: ${req.auth.project.id}
          User: ${req.auth.user ? req.auth.user.primary_email ?? req.auth.user.id : "None"}
        `}
      `,
    };
  },
});
