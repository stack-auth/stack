/* eslint-disable @typescript-eslint/no-empty-object-type */
import { VerificationCodeType } from "@prisma/client";
import * as yup from "yup";
import { KnownErrors } from "@stackframe/stack-shared";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { adaptSchema, yupBoolean, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { DeepPartial } from "@stackframe/stack-shared/dist/utils/objects";
import { validateRedirectUrl } from "@/lib/redirect-urls";
import { prismaClient } from "@/prisma-client";
import { SmartRequest } from "./smart-request";
import { SmartResponse } from "./smart-response";
import { SmartRouteHandler, SmartRouteHandlerOverloadMetadata, createSmartRouteHandler } from "./smart-route-handler";

type CreateCodeOptions<Data, Method extends {}, CallbackUrl extends string | URL | undefined> = {
  project: ProjectsCrud["Admin"]["Read"];
  method: Method;
  expiresInMs?: number;
  data: Data;
  callbackUrl: CallbackUrl;
};

type CodeObject<CallbackUrl extends string | URL | undefined> = {
  code: string;
  link: CallbackUrl extends string | URL ? URL : undefined;
  expiresAt: Date;
};

type VerificationCodeHandler<Data, SendCodeExtraOptions extends {}, HasDetails extends boolean, Method extends {}> = {
  createCode<CallbackUrl extends string | URL | undefined>(
    options: CreateCodeOptions<Data, Method, CallbackUrl>,
  ): Promise<CodeObject<CallbackUrl>>;
  sendCode(options: CreateCodeOptions<Data, Method, string | URL>, sendOptions: SendCodeExtraOptions): Promise<void>;
  postHandler: SmartRouteHandler<any, any, any>;
  checkHandler: SmartRouteHandler<any, any, any>;
  detailsHandler: HasDetails extends true ? SmartRouteHandler<any, any, any> : undefined;
};

/**
 * Make sure to always check that the method is the same as the one in the data.
 */
export function createVerificationCodeHandler<
  Data,
  RequestBody extends {} & DeepPartial<SmartRequest["body"]>,
  Response extends SmartResponse,
  DetailsResponse extends SmartResponse | undefined,
  SendCodeExtraOptions extends {},
  Method extends {},
>(options: {
  metadata?: {
    post?: SmartRouteHandlerOverloadMetadata;
    check?: SmartRouteHandlerOverloadMetadata;
    details?: SmartRouteHandlerOverloadMetadata;
  };
  type: VerificationCodeType;
  data: yup.Schema<Data>;
  method: yup.Schema<Method>;
  requestBody?: yup.ObjectSchema<RequestBody>;
  detailsResponse?: yup.Schema<DetailsResponse>;
  response: yup.Schema<Response>;
  send?(
    codeObject: CodeObject<string | URL>,
    createOptions: CreateCodeOptions<Data, Method, string | URL>,
    sendOptions: SendCodeExtraOptions,
  ): Promise<void>;
  validate?(
    project: ProjectsCrud["Admin"]["Read"],
    method: Method,
    data: Data,
    body: RequestBody,
    user: UsersCrud["Admin"]["Read"] | undefined,
  ): Promise<void>;
  handler(
    project: ProjectsCrud["Admin"]["Read"],
    method: Method,
    data: Data,
    body: RequestBody,
    user: UsersCrud["Admin"]["Read"] | undefined,
  ): Promise<Response>;
  details?: DetailsResponse extends SmartResponse
    ? (
        project: ProjectsCrud["Admin"]["Read"],
        method: Method,
        data: Data,
        body: RequestBody,
        user: UsersCrud["Admin"]["Read"] | undefined,
      ) => Promise<DetailsResponse>
    : undefined;
}): VerificationCodeHandler<Data, SendCodeExtraOptions, DetailsResponse extends SmartResponse ? true : false, Method> {
  const createHandler = (type: "post" | "check" | "details") =>
    createSmartRouteHandler({
      metadata: options.metadata?.[type],
      request: yupObject({
        auth: yupObject({
          project: adaptSchema.required(),
          user: adaptSchema,
        }).required(),
        body: yupObject({
          code: yupString().required(),
        })
          // we cast to undefined as a typehack because the types are a bit icky
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          .concat(((type === "post" ? options.requestBody : undefined) as undefined) ?? yupObject({}))
          .required(),
      }),
      response:
        type === "check"
          ? (yupObject({
              statusCode: yupNumber().oneOf([200]).required(),
              bodyType: yupString().oneOf(["json"]).required(),
              body: yupObject({
                is_code_valid: yupBoolean().oneOf([true]).required(),
              }).required(),
            }).required() as yup.ObjectSchema<any>)
          : type === "details"
            ? options.detailsResponse || throwErr("detailsResponse is required")
            : options.response,
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

        const validatedMethod = await options.method.validate(verificationCode.method, {
          strict: true,
        });
        const validatedData = await options.data.validate(verificationCode.data, {
          strict: true,
        });

        if (options.validate) {
          await options.validate(auth.project, validatedMethod, validatedData, requestBody as any, auth.user as any);
        }

        switch (type) {
          case "post": {
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
            return await options.handler(auth.project, validatedMethod, validatedData, requestBody as any, auth.user);
          }
          case "check": {
            return {
              statusCode: 200,
              bodyType: "json",
              body: {
                is_code_valid: true,
              },
            };
          }
          case "details": {
            return (await options.details?.(auth.project, validatedMethod, validatedData, requestBody as any, auth.user as any)) as any;
          }
        }
      },
    });

  return {
    async createCode({ project, method, data, callbackUrl, expiresInMs }) {
      const validatedData = await options.data.validate(data, {
        strict: true,
      });

      if (callbackUrl !== undefined && !validateRedirectUrl(callbackUrl, project.config.domains, project.config.allow_localhost)) {
        throw new KnownErrors.RedirectUrlNotWhitelisted();
      }

      const verificationCodePrisma = await prismaClient.verificationCode.create({
        data: {
          projectId: project.id,
          type: options.type,
          code: generateSecureRandomString(),
          redirectUrl: callbackUrl?.toString(),
          expiresAt: new Date(Date.now() + (expiresInMs ?? 1000 * 60 * 60 * 24 * 7)), // default: expire after 7 days
          data: validatedData as any,
          method: method,
        },
      });

      let link;
      if (callbackUrl !== undefined) {
        link = new URL(callbackUrl);
        link.searchParams.set("code", verificationCodePrisma.code);
      }

      return {
        code: verificationCodePrisma.code,
        link,
      } as any;
    },
    async sendCode(createOptions, sendOptions) {
      const codeObj = await this.createCode(createOptions);
      if (!options.send) {
        throw new StackAssertionError("Cannot use sendCode on this verification code handler because it doesn't have a send function");
      }
      await options.send(codeObj, createOptions, sendOptions);
    },
    postHandler: createHandler("post"),
    checkHandler: createHandler("check"),
    detailsHandler: (options.detailsResponse ? createHandler("details") : undefined) as any,
  };
}
