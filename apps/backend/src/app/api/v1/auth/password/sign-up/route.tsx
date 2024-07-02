import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, clientOrHigherAuthTypeSchema, emailVerificationCallbackUrlSchema, signInEmailSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { NextResponse } from "next/server";
import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createAuthTokens } from "@/lib/tokens";
import { getPasswordError } from "@stackframe/stack-shared/dist/helpers/password";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared";
import { usersCrudHandlers } from "../../../users/crud";
import { contactChannelVerificationCodeHandler } from "../../../contact-channels/verify/verification-code-handler";

export const POST = createSmartRouteHandler({
  request: yup.object({
    auth: yup.object({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).required(),
    body: yup.object({
      email: signInEmailSchema.required(),
      password: yup.string().required(),
      verification_callback_url: emailVerificationCallbackUrlSchema.required(),
    }).required(),
  }),
  response: yup.object({
    statusCode: yup.number().oneOf([200]).required(),
    bodyType: yup.string().oneOf(["json"]).required(),
    body: yup.object({
      access_token: yup.string().required(),
      refresh_token: yup.string().required(),
    }).required(),
  }),
  async handler({ auth: { project }, body: { email, password, verification_callback_url: verificationCallbackUrl } }, fullReq) { 
    if (!project.evaluatedConfig.credentialEnabled) {
      throw new StatusError(StatusError.Forbidden, "Credential authentication is not enabled");
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      throw passwordError;
    }
  
    // TODO: make this a transaction
    const users = await prismaClient.projectUser.findMany({
      where: {
        projectId: project.id,
        primaryEmail: email,
        authWithEmail: true,
      },
    });
  
    if (users.length > 0) {
      throw new KnownErrors.UserEmailAlreadyExists();
    }

    const createdUser = await usersCrudHandlers.adminCreate({
      project,
      data: {
        primary_email_auth_enabled: true,
        primary_email: email,
        primary_email_verified: false,
        password,
      },
    });
  
    await contactChannelVerificationCodeHandler.sendCode({
      project,
      data: {
        user_id: createdUser.id,
      },
      method: {
        email,
      },
      callbackUrl: verificationCallbackUrl,
    }, {
      user: createdUser,
    });
  
    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: createdUser.id,
    });
  
    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  },
});
