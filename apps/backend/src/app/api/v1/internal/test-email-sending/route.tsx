import { isSecureEmailPort, sendEmail } from "@/lib/emails";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { apiKeysCreateOutputSchema } from "@stackframe/stack-shared/dist/interface/crud/api-keys";
import * as schemaFields from "@stackframe/stack-shared/dist/schema-fields";
import { adaptSchema, adminAuthTypeSchema, emailSchema, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export const POST = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    auth: yupObject({
      type: adminAuthTypeSchema,
      project: adaptSchema.defined(),
    }).defined(),
    body: yupObject({
      recipient_email: emailSchema.defined(),
      email_config: yupObject({
        host: schemaFields.emailHostSchema.defined(),
        port: schemaFields.emailPortSchema.defined(),
        username: schemaFields.emailUsernameSchema.defined(),
        password: schemaFields.emailPasswordSchema.defined(),
        sender_name: schemaFields.emailSenderNameSchema.defined(),
        sender_email: schemaFields.emailSenderEmailSchema.defined(),
      }).defined(),
    }).defined(),
    method: yupString().oneOf(["POST"]).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: apiKeysCreateOutputSchema.defined(),
  }),
  handler: async ({ auth, body }) => {
    await sendEmail({
      emailConfig: {
        type: 'standard',
        host: body.email_config.host,
        port: body.email_config.port,
        username: body.email_config.username,
        password: body.email_config.password,
        senderEmail: body.email_config.sender_email,
        senderName: body.email_config.sender_name,
        secure: isSecureEmailPort(body.email_config.port),
      },
      to: body.recipient_email,
      subject: "Test Email from Stack Auth",
      text: "This is a test email from Stack Auth. If you successfully received this email, your email server configuration is working correctly.",
    });

    return {
      statusCode: 200,
      bodyType: 'json',
      body: {},
    };
  },
});
