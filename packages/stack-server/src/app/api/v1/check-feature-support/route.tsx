import { smartRouteHandler } from "@/route-handlers/smart-route-handler";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { deindent, typedCapitalize } from "@stackframe/stack-shared/dist/utils/strings";
import * as yup from "yup";

export const POST = smartRouteHandler({
  request: yup.object({
    auth: yup.object({
      type: yup.mixed(),
      user: yup.mixed(),
      project: yup.mixed(),
    }).nullable(),
    method: yup.string().oneOf(["POST"]).required(),
    body: yup.mixed(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    bodyType: yup.string().oneOf(["text"]).required(),
    body: yup.string().required(),
  }),
  handler: async (req) => {
    captureError("check-feature-support", new StackAssertionError(`${req.auth?.user?.primaryEmail || "User"} tried to check support of unsupported feature: ${JSON.stringify(req.body, null, 2)}`, { req }));
    return {
      statusCode: 200,
      bodyType: "text",
      body: deindent`
        ${req.body?.featureName ?? "This feature"} is not yet supported. Please reach out to Stack support for more information.
      `,
    };
  },
});
