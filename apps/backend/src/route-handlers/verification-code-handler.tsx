import * as yup from "yup";
import { SmartRouteHandler, createSmartRouteHandler } from "./smart-route-handler";
import { SmartResponse } from "./smart-response";
import { KnownErrors, ProjectJson } from "@stackframe/stack-shared";
import { prismaClient } from "@/prisma-client";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { SmartRequestAdaptSentinel } from "./smart-request";

type Method = {
  email?: string,
};

type VerificationCodeHandler<Data> = {
  sendCode<RedirectUrl extends string | URL | undefined>(options: {
    project: ProjectJson,
    method: Method,
    data: Data,
    redirectUrl?: RedirectUrl,
    expiresInMs?: number,
  }): Promise<{ code: string } & (
    RedirectUrl extends undefined ? {}
    : RedirectUrl extends string | URL ? { link: URL }
    : { link?: URL }
  )>,
  postHandler: SmartRouteHandler<any, any, any>,
};

/**
 * Make sure to always check that the method is the same as the one in the data.
 */
export function createVerificationCodeHandler<Data, Response extends SmartResponse>(options: {
  data: yup.Schema<Data>,
  response: yup.Schema<Response>,
  handler(project: ProjectJson, method: Method, data: Data): Promise<Response>,
}): VerificationCodeHandler<Data> {
  return {
    async sendCode({ project, method, data, redirectUrl, expiresInMs }) {
      if (!method.email) {
        throw new StackAssertionError("No method specified");
      }

      const validatedData = await options.data.validate(data, {
        strict: true,
      });
      
      if (redirectUrl !== undefined && !validateRedirectUrl(
        redirectUrl, 
        project.evaluatedConfig.domains,
        project.evaluatedConfig.allowLocalhost 
      )) {
        throw new KnownErrors.RedirectUrlNotWhitelisted();
      }

      const verificationCode = await prismaClient.verificationCode.create({
        data: {
          projectId: project.id,
          code: generateSecureRandomString(),
          redirectUrl: redirectUrl?.toString() ?? undefined,
          expiresAt: new Date(Date.now() + (expiresInMs ?? 1000 * 60 * 60 * 24 * 7)),  // default: expire after 7 days
          data: validatedData as any,
          email: method.email,
        }
      });

      let link;
      if (redirectUrl !== undefined) {
        link = new URL(redirectUrl);
        link.searchParams.set('code', verificationCode.code);
      }

      return {
        code: verificationCode.code,
        ...(link ? { link: link } : {}),
      } as any;
    },
    postHandler: createSmartRouteHandler({
      request: yup.object({
        auth: yup.object({
          project: yup.mixed<SmartRequestAdaptSentinel>().required(),
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
