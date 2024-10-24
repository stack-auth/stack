import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { KnownErrors  } from "@stackframe/stack-shared";
import { PublicKeyCredentialRequestOptionsJSON } from "@stackframe/stack-shared/dist/utils/passkey";
import { adaptSchema, clientOrHigherAuthTypeSchema, yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { passkeySignInVerificationCodeHandler } from "../sign-in/verification-code-handler";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Initialize passkey authentication",
    description: "Create a challenge for passkey authentication",
    tags: ["Passkey"],
    hidden: true,
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).required()
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupObject({
      optionsJSON: yupMixed().required(),
      code: yupString().required(),
    }).required(),
  }),
  async handler({ auth: { project }}) {

    if (!project.config.passkey_enabled) {
      throw new KnownErrors.PasskeyAuthenticationNotEnabled();
    }

    const SIGN_IN_TIMEOUT_MS = 60000;

    const optionsJSON: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
      rpID: "localhost", // HACK: will be overridden in the frontend to be the actual domain, this is a temporary solution until we have a primary authentication domain
      userVerification: "preferred",
      allowCredentials: [],
      timeout: SIGN_IN_TIMEOUT_MS,
    });


    const {code} = await passkeySignInVerificationCodeHandler.createCode({
      project,
      method: {},
      expiresInMs: SIGN_IN_TIMEOUT_MS + 5000,
      data: {
        challenge: optionsJSON.challenge
      },
      callbackUrl: undefined
    });


    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        optionsJSON,
        code,
      },
    };
  },
});
