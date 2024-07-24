import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { deindent, typedCapitalize } from "@stackframe/stack-shared/dist/utils/strings";

export const GET = createSmartRouteHandler({
  metadata: {
    summary: "/api/v1",
    description: "Returns a human-readable message with some useful information about the API.",
    tags: [],
  },
  request: yupObject({
    auth: yupObject({
      type: adaptSchema,
      user: adaptSchema,
      project: adaptSchema,
    }).nullable(),
    query: yupObject({
      // No query parameters
      // empty object means that it will fail if query parameters are given regardless
    }),
    method: yupString().oneOf(["GET"]).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["text"]).required(),
    body: yupString().required().meta({ openapiField: { exampleValue: "Welcome to the Stack API endpoint! Please refer to the documentation at https://docs.stack-auth.com/\n\nAuthentication: None" } }),
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
