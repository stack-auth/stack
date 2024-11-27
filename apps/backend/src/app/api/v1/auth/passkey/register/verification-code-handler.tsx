import { prismaClient } from "@/prisma-client";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { VerificationCodeType } from "@prisma/client";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { KnownErrors } from "@stackframe/stack-shared";
import { yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { captureError, StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { RegistrationResponseJSON } from "@stackframe/stack-shared/dist/utils/passkey";
import {decodeClientDataJSON} from "@simplewebauthn/server/helpers";

export const registerVerificationCodeHandler = createVerificationCodeHandler({
  metadata: {
    post: {
      summary: "Set a new passkey",
      description: "Sign in with a passkey",
      tags: ["Passkey"],
      hidden: true,
    }
  },
  type: VerificationCodeType.PASSKEY_REGISTRATION_CHALLENGE,
  requestBody: yupObject({
    credential: yupMixed<RegistrationResponseJSON>().defined(),
    code: yupString().defined(),
  }),
  data: yupObject({
    challenge: yupString().defined(),
    userHandle: yupString().defined(),
  }),
  method: yupObject({
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      user_handle: yupString().defined(),
    }),
  }),
  async send() {
    throw new StackAssertionError("send() called on a Passkey registration verification code handler");
  },
  async handler(project, _, {challenge}, {credential}, user) {
    if (!project.config.passkey_enabled) {
      throw new KnownErrors.PasskeyAuthenticationNotEnabled();
    }

    if (!user) {
      throw new StackAssertionError("User not found", {
        projectId: project.id,
      });
    }

    // HACK: we validate origin and rpid outside of simpleauth, this should be replaced once we have a primary authentication domain

    let expectedRPID = "";
    let expectedOrigin = "";
    const clientDataJSON = decodeClientDataJSON(credential.response.clientDataJSON);
    const { origin } = clientDataJSON;
    const localhostAllowed = project.config.allow_localhost;
    const parsedOrigin = new URL(origin);
    const isLocalhost = parsedOrigin.hostname === "localhost";

    if (!localhostAllowed && isLocalhost) {
      throw new KnownErrors.PasskeyAuthenticationFailed("Passkey registration failed because localhost is not allowed");
    }

    if (localhostAllowed && isLocalhost) {
      expectedRPID = parsedOrigin.hostname;
      expectedOrigin = origin;
    }

    if (!isLocalhost) {
      if (!project.config.domains.map(e => e.domain).includes(parsedOrigin.origin)) {
        throw new KnownErrors.PasskeyAuthenticationFailed("Passkey registration failed because the origin is not allowed");
      } else {
        expectedRPID = parsedOrigin.hostname;
        expectedOrigin = origin;
      }
    }


    let verification;
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
      expectedType: "webauthn.create",
      // we don't need user verification for most websites, in the future this might be an option. See https://simplewebauthn.dev/docs/advanced/passkeys#verifyregistrationresponse
      requireUserVerification: false,
    });


    if (!verification.verified || !verification.registrationInfo) {
      throw new KnownErrors.PasskeyRegistrationFailed("Passkey registration failed because the verification response is invalid");
    }

    const registrationInfo = verification.registrationInfo;

    await prismaClient.$transaction(async (tx) => {
      const authMethodConfig = await tx.passkeyAuthMethodConfig.findMany({
        where: {
          projectConfigId: project.config.id,
          authMethodConfig: {
            enabled: true,
          },
        },
      });

      if (authMethodConfig.length > 1) {
        throw new StackAssertionError("Project has multiple passkey auth method configs.", { projectId: project.id });
      }

      if (authMethodConfig.length === 0) {
        throw new StackAssertionError("Project has no passkey auth method config. This should never happen if passkey is enabled on the project.", { projectId: project.id });
      }

      const authMethods = await tx.passkeyAuthMethod.findMany({
        where: {
          projectId: project.id,
          projectUserId: user.id,
        },
      });

      if (authMethods.length > 1) {
        // We do not support multiple passkeys per user yet
        throw new StackAssertionError("User has multiple passkey auth methods.", {
          projectId: project.id,
          projectUserId: user.id,
        });
      }

      if (authMethods.length === 0) {
        // Create new passkey auth method
        await tx.authMethod.create({
          data: {
            projectId: project.id,
            projectUserId: user.id,
            projectConfigId: project.config.id,
            authMethodConfigId: authMethodConfig[0].authMethodConfigId,
            passkeyAuthMethod: {
              create: {
                publicKey: Buffer.from(registrationInfo.credential.publicKey).toString('base64url'),
                projectUserId: user.id,
                userHandle: registrationInfo.credential.id,
                credentialId: registrationInfo.credential.id,
                transports: registrationInfo.credential.transports,
                credentialDeviceType: registrationInfo.credentialDeviceType,
                counter: registrationInfo.credential.counter,
              }
            }
          }
        });
      } else {
        // Update existing passkey auth method
        await tx.passkeyAuthMethod.update({
          where: {
            projectId_projectUserId: {
              projectId: project.id,
              projectUserId: user.id,
            }
          },
          data: {
            publicKey: Buffer.from(registrationInfo.credential.publicKey).toString('base64url'),
            userHandle: registrationInfo.credential.id,
            credentialId: registrationInfo.credential.id,
            transports: registrationInfo.credential.transports,
            credentialDeviceType: registrationInfo.credentialDeviceType,
            counter: registrationInfo.credential.counter,
          }
        });
      }
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        user_handle: registrationInfo.credential.id,
      },
    };
  },
});
