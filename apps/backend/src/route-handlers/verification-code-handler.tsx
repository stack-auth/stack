import * as yup from "yup";
import { SmartRouteHandler, SmartRouteHandlerOverloadMetadata, createSmartRouteHandler } from "./smart-route-handler";
import { SmartResponse } from "./smart-response";
import { KnownErrors } from "@stackframe/stack-shared";
import { prismaClient } from "@/prisma-client";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { adaptSchema, yupBoolean, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { VerificationCodeType } from "@prisma/client";
import { SmartRequest } from "./smart-request";
import { DeepPartial } from "@stackframe/stack-shared/dist/utils/objects";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";

type Method = {
  email: string,
};

type CreateCodeOptions<Data, CallbackUrl extends string | URL = string | URL> = {
  project: ProjectsCrud["Admin"]["Read"],
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

type VerificationCodeHandler<Data, SendCodeExtraOptions extends {}, HasDetails extends boolean> = {
  createCode<CallbackUrl extends string | URL>(options: CreateCodeOptions<Data, CallbackUrl>): Promise<CodeObject>,
  sendCode(options: CreateCodeOptions<Data>, sendOptions: SendCodeExtraOptions): Promise<void>,
  postHandler: SmartRouteHandler<any, any, any>,
  checkHandler: SmartRouteHandler<any, any, any>,
  detailsHandler: HasDetails extends true ? SmartRouteHandler<any, any, any> : undefined,
};

/**
 * Make sure to always check that the method is the same as the one in the data.
 */
export function createVerificationCodeHandler<
  Data,
  RequestBody extends {} & DeepPartial<SmartRequest["body"]>,
  Response extends SmartResponse,
  DetailsResponse extends SmartResponse | undefined,
  UserRequired extends boolean,
  SendCodeExtraOptions extends {},
>(options: {
  metadata?: {
    post?: SmartRouteHandlerOverloadMetadata,
    check?: SmartRouteHandlerOverloadMetadata,
    details?: SmartRouteHandlerOverloadMetadata,
  },
  type: VerificationCodeType,
  data: yup.Schema<Data>,
  requestBody?: yup.ObjectSchema<RequestBody>,
  userRequired?: UserRequired,
  detailsResponse?: yup.Schema<DetailsResponse>,
  response: yup.Schema<Response>,
  send(
    codeObject: CodeObject,
    createOptions: CreateCodeOptions<Data>,
    sendOptions: SendCodeExtraOptions,
  ): Promise<void>,
  handler(
    project: ProjectsCrud["Admin"]["Read"],
    method: Method,
    data: Data,
    body: RequestBody,
    user: UserRequired extends true ? UsersCrud["Admin"]["Read"] : undefined
  ): Promise<Response>,
  details?: DetailsResponse extends SmartResponse ? ((
    project: ProjectsCrud["Admin"]["Read"],
    method: Method,
    data: Data,
    body: RequestBody,
    user: UserRequired extends true ? UsersCrud["Admin"]["Read"] : undefined
  ) => Promise<DetailsResponse>) : undefined,
}): VerificationCodeHandler<Data, SendCodeExtraOptions, DetailsResponse extends SmartResponse ? true : false> {
  const createHandler = (type: 'post' | 'check' | 'details') => createSmartRouteHandler({
    metadata: options.metadata?.[type],
    request: yupObject({
      auth: yupObject({
        project: adaptSchema.required(),
        user: options.userRequired ? adaptSchema.required() : adaptSchema,
      }).required(),
      body: yupObject({
        code: yupString().required(),
      // we cast to undefined as a typehack because the types are a bit icky
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      }).concat((type === 'post' ? options.requestBody : undefined) as undefined ?? yupObject({})).required(),
    }),
    response: type === 'check' ?
      yupObject({
        statusCode: yupNumber().oneOf([200]).required(),
        bodyType: yupString().oneOf(["json"]).required(),
        body: yupObject({
          "is_code_valid": yupBoolean().oneOf([true]).required(),
        }).required(),
      }).required() as yup.ObjectSchema<any> :
      type === 'details' ?
        options.detailsResponse || throwErr('detailsResponse is required') :
        options.response,
    async handler({ body: { code, ...requestBody }, auth }) {
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

      switch (type) {
        case 'post': {
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

          return await options.handler(auth.project, { email: verificationCode.email }, validatedData as any, requestBody as any, auth.user as any);
        }
        case 'check': {
          return {
            statusCode: 200,
            bodyType: "json",
            body: {
              is_code_valid: true,
            },
          };
        }
        case 'details': {
          return await options.details?.(auth.project, { email: verificationCode.email }, validatedData as any, requestBody as any, auth.user as any) as any;
        }
      }
    },
  });

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
        project.config.domains,
        project.config.allow_localhost,
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
    postHandler: createHandler('post'),
    checkHandler: createHandler('check'),
    detailsHandler: (options.detailsResponse ? createHandler('details') : undefined) as any,
  };
}