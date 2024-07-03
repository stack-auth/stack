import * as yup from "yup";
import { SmartRouteHandler, createSmartRouteHandler } from "./smart-route-handler";
import { SmartResponse } from "./smart-response";
import { KnownErrors, ProjectJson } from "@stackframe/stack-shared";
import { prismaClient } from "@/prisma-client";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { adaptSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { VerificationCodeType } from "@prisma/client";

type Method = {
  email: string,
};

type CreateCodeOptions<Data, CallbackUrl extends string | URL = string | URL> = {
  project: ProjectJson,
  method: Method,
  expiresInMs?: number,
  data: Data,
  callbackUrl: CallbackUrl,
};

type CodeObject = {
  code: string,
  link: URL,
  expiresAt: Date,
};

type VerificationCodeHandler<Data, SendCodeExtraOptions extends {}> = {
  createCode<CallbackUrl extends string | URL>(options: CreateCodeOptions<Data, CallbackUrl>): Promise<CodeObject>,
  sendCode(options: CreateCodeOptions<Data>, sendOptions: SendCodeExtraOptions): Promise<void>,
  postHandler: SmartRouteHandler<any, any, any>,
};

/**
 * Make sure to always check that the method is the same as the one in the data.
 */
export function createVerificationCodeHandler<
  Data,
  Response extends SmartResponse,
  SendCodeExtraOptions extends {},
>(options: {
  type: VerificationCodeType,
  data: yup.AnySchema<Data>,
  response: yup.AnySchema<Response>,
  send: (
    codeObject: CodeObject,
    createOptions: CreateCodeOptions<Data>,
    sendOptions: SendCodeExtraOptions,
  ) => Promise<void>,
  handler(project: ProjectJson, method: Method, data: Data): Promise<Response>,
}): VerificationCodeHandler<Data, SendCodeExtraOptions> {
  return {
    async createCode({ project, method, data, callbackUrl, expiresInMs }) {
      if (!method.email) {
        throw new StackAssertionError("No method specified");
      }

      const validatedData = await options.data.validate(data, {
        strict: true,
      });
      
      if (!validateRedirectUrl(
        callbackUrl, 
        project.evaluatedConfig.domains,
        project.evaluatedConfig.allowLocalhost 
      )) {
        throw new KnownErrors.RedirectUrlNotWhitelisted();
      }

      const verificationCodePrisma = await prismaClient.verificationCode.create({
        data: {
          projectId: project.id,
          type: options.type,
          code: generateSecureRandomString(),
          redirectUrl: callbackUrl.toString(),
          expiresAt: new Date(Date.now() + (expiresInMs ?? 1000 * 60 * 60 * 24 * 7)),  // default: expire after 7 days
          data: validatedData as any,
          email: method.email,
        }
      });

      const link = new URL(callbackUrl);
      link.searchParams.set('code', verificationCodePrisma.code);

      return {
        code: verificationCodePrisma.code,
        link,
      } as any;
    },
    async sendCode(createOptions, sendOptions) {
      const codeObj = await this.createCode(createOptions);
      await options.send(codeObj, createOptions, sendOptions);
    },
    postHandler: createSmartRouteHandler({
      request: yup.object({
        auth: yup.object({
          project: adaptSchema.required(),
        }).required(),
        body: yup.object({
          code: yup.string().required(),
        }).required(),
      }),
      response: options.response,
      async handler({ body: { code }, auth }) {
        const verificationCode = await prismaClient.verificationCode.findUnique({
          where: {
            projectId_code: {
              projectId: auth.project.id,
              code,
            },
          },
        });

        if (!verificationCode) throw new KnownErrors.VerificationCodeNotFound();
        if (verificationCode.expiresAt < new Date()) throw new KnownErrors.VerificationCodeExpired();
        if (verificationCode.usedAt) throw new KnownErrors.VerificationCodeAlreadyUsed();

        const validatedData = await options.data.validate(verificationCode.data, {
          strict: true,
        });

        await prismaClient.verificationCode.update({
          where: {
            projectId_code: {
              projectId: auth.project.id,
              code,
            },
          },
          data: {
            usedAt: new Date(),
          },
        });

        return await options.handler(auth.project, { email: verificationCode.email }, validatedData as any);
      },
    }),
  };
}
