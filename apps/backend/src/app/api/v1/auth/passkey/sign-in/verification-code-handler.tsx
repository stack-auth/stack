import { createAuthTokens } from "@/lib/tokens";
import { prismaClient } from "@/prisma-client";
import { createVerificationCodeHandler } from "@/route-handlers/verification-code-handler";
import { VerificationCodeType } from "@prisma/client";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import {decodeClientDataJSON} from "@simplewebauthn/server/helpers";
import { KnownErrors } from "@stackframe/stack-shared";
import { signInResponseSchema, yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { captureError, StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { createMfaRequiredError } from "../../mfa/sign-in/verification-code-handler";
import { AuthenticationResponseJSON } from "@stackframe/stack-shared/dist/utils/passkey";

export const passkeySignInVerificationCodeHandler = createVerificationCodeHandler({
  metadata: {
    post: {
      summary: "Sign in with a passkey",
      description: "Sign in with a passkey",
      tags: ["Passkey"],
      hidden: true,
    }
  },
  type: VerificationCodeType.PASSKEY_AUTHENTICATION_CHALLENGE,
  requestBody: yupObject({
    authenticationResponse: yupMixed<AuthenticationResponseJSON>().required(),
    code: yupString().required(),
  }),
  data: yupObject({
    challenge: yupString().required()
  }),
  method: yupObject({}),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: signInResponseSchema.required(),
  }),
  async send() {
    throw new StackAssertionError("send() called on a Passkey sign in verification code handler");
  },
  async handler(project, _, {challenge}, {authenticationResponse}) {

    if (!project.config.passkey_enabled) {
      throw new KnownErrors.PasskeyAuthenticationNotEnabled();
    }


    const credentialId = authenticationResponse.id;


    // Get passkey from DB with userHandle
    const passkey = await prismaClient.passkeyAuthMethod.findFirst({
      where: {
        credentialId,
        projectId: project.id,
      },
      include: {
        projectUser: true,
      },
    });


    if (!passkey) {
      throw new KnownErrors.PasskeyAuthenticationFailed("Passkey not found");
    }

    // HACK: we validate origin and rpid outside of simpleauth, this should be replaced once we have a primary authentication domain
    let expectedRPID = "";
    let expectedOrigin = "";
    const clientDataJSON = decodeClientDataJSON(authenticationResponse.response.clientDataJSON);
    const { origin } = clientDataJSON;
    const localhostAllowed = project.config.allow_localhost;
    const parsedOrigin = new URL(origin);
    const isLocalhost = parsedOrigin.hostname === "localhost";

    if (!localhostAllowed && isLocalhost) {
      throw new KnownErrors.PasskeyAuthenticationFailed("Passkey authentication failed because localhost is not allowed");
    }

    if (localhostAllowed && isLocalhost) {
      expectedRPID = parsedOrigin.hostname;
      expectedOrigin = origin;
    }

    if (!isLocalhost) {
      if (!project.config.domains.map(e => e.domain).includes(parsedOrigin.origin)) {
        throw new KnownErrors.PasskeyAuthenticationFailed("Passkey authentication failed because the origin is not allowed");
      } else {
        expectedRPID = parsedOrigin.hostname;
        expectedOrigin = origin;
      }
    }

    let authVerify;
    try {
      authVerify = await verifyAuthenticationResponse({
        response: authenticationResponse,
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID,
        credential: {
          id: passkey.userHandle,
          publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64')),
          counter: passkey.counter,
        },
        requireUserVerification: false,
      });
    } catch (error) {
      captureError("Failed to verify passkey authentication response", error);
      throw new KnownErrors.PasskeyAuthenticationFailed("Failed to verify passkey authentication response");
    }


    if (!authVerify.verified) {
      throw new KnownErrors.PasskeyAuthenticationFailed("Failed to verify passkey authentication response");
    }
    const authenticationInfo = authVerify.authenticationInfo;

    // Update counter
    await prismaClient.passkeyAuthMethod.update({
      where: {
        projectId_projectUserId: {
          projectId: project.id,
          projectUserId: passkey.projectUserId,
        }
      },
      data: {
        counter: authenticationInfo.newCounter,
      },
    });

    const user = passkey.projectUser;

    if (user.requiresTotpMfa) {
      throw await createMfaRequiredError({
        project,
        isNewUser: false,
        userId: user.projectUserId,
      });
    }

    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: user.projectUserId,
      useLegacyGlobalJWT: project.config.legacy_global_jwt_signing,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        refresh_token: refreshToken,
        access_token: accessToken,
        is_new_user: false,
        user_id: user.projectUserId,
      },
    };
  },
});
