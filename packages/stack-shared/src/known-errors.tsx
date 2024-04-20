import { StatusError, throwErr, throwStackErr } from "./utils/errors";
import { identityArgs } from "./utils/functions";
import { Json } from "./utils/json";

export type KnownErrorJson = {
  code: string,
  message: string,
  details?: Json,
};

export type AbstractKnownErrorConstructor<Args extends any[]> =
  & (abstract new (...args: Args) => KnownError)
  & {
    constructorArgsFromJson: (json: KnownErrorJson) => Args,
  };

export type KnownErrorConstructor<Instance extends KnownError, Args extends any[]> = {
  new (...args: Args): Instance,
  errorCode: string,
  constructorArgsFromJson: (json: KnownErrorJson) => Args,
};

export abstract class KnownError extends StatusError {
  public name = "KnownError";

  constructor(
    public readonly statusCode: number,
    public readonly humanReadableMessage: string,
    public readonly details?: Json,
  ) {
    super(
      statusCode,
      humanReadableMessage
    );
  }

  public override getBody(): Uint8Array {
    return new TextEncoder().encode(JSON.stringify({
      code: this.errorCode,
      message: this.humanReadableMessage,
      details: this.details,
    }, undefined, 2));
  }

  public override getHeaders(): Record<string, string[]> {
    return {
      "Content-Type": ["application/json; charset=utf-8"],
      "X-Stack-Known-Error": [this.errorCode],
    };
  }

  get errorCode(): string {
    return (this.constructor as any).errorCode ?? throwStackErr(`Can't find error code for this KnownError. Is its constructor a KnownErrorConstructor? ${this}`);
  }

  public static constructorArgsFromJson(json: KnownErrorJson): ConstructorParameters<typeof KnownError> {
    return [
      400,
      json.message,
      json.details,
    ];
  }

  public static fromJson(json: KnownErrorJson): KnownError {
    for (const [_, KnownErrorType] of Object.entries(KnownErrors)) {
      if (json.code === KnownErrorType.prototype.errorCode) {
        return new KnownErrorType(
          // @ts-expect-error
          ...KnownErrorType.constructorArgsFromJson(json),
        );
      }
    }

    throw new Error(`Unknown KnownError code: ${json.code}`);
  }
}

const knownErrorConstructorErrorCodeSentinel = Symbol("knownErrorConstructorErrorCodeSentinel");
/**
 * Exists solely so that known errors are nominative types (ie. two KnownErrors with the same interface are not the same type)
 */
type KnownErrorBrand<ErrorCode extends string> = {
  /**
   * Does not exist at runtime
   * 
   * Must be an object because it may be true for multiple error codes (it's true for all parents)
   */
  [knownErrorConstructorErrorCodeSentinel]: {
    [K in ErrorCode]: true
  },
};

function createKnownErrorConstructor<ErrorCode extends string, Super extends AbstractKnownErrorConstructor<any>, Args extends any[]>(
  SuperClass: Super,
  errorCode: ErrorCode,
  create: ((...args: Args) => Readonly<ConstructorParameters<Super>>),
  constructorArgsFromJson: ((json: KnownErrorJson) => Args),
): KnownErrorConstructor<InstanceType<Super> & KnownErrorBrand<ErrorCode>, Args> & { errorCode: ErrorCode };
function createKnownErrorConstructor<ErrorCode extends string, Super extends AbstractKnownErrorConstructor<any>>(
  SuperClass: Super,
  errorCode: ErrorCode,
  create: "inherit",
  constructorArgsFromJson: "inherit",
): KnownErrorConstructor<InstanceType<Super> & KnownErrorBrand<ErrorCode>, ConstructorParameters<Super>> & { errorCode: ErrorCode };
function createKnownErrorConstructor<ErrorCode extends string, Super extends AbstractKnownErrorConstructor<any>, Args extends any[]>(
  SuperClass: Super,
  errorCode: ErrorCode,
  create: "inherit" | ((...args: Args) => Readonly<ConstructorParameters<Super>>),
  constructorArgsFromJson: "inherit" | ((json: KnownErrorJson) => Args),
): KnownErrorConstructor<InstanceType<Super> & KnownErrorBrand<ErrorCode>, Args> & { errorCode: ErrorCode } {
  const createFn = create === "inherit" ? identityArgs<Args> as never : create;
  const constructorArgsFromJsonFn = constructorArgsFromJson === "inherit" ? SuperClass.constructorArgsFromJson as never : constructorArgsFromJson;

  // @ts-expect-error this is not a mixin, but TS detects it as one
  class KnownErrorImpl extends SuperClass {
    public static readonly errorCode = errorCode;
    public name = `KnownError<${errorCode}>`;

    constructor(...args: Args) {
      // @ts-expect-error
      super(...createFn(...args));
    }

    static constructorArgsFromJson(json: KnownErrorJson): Args {
      return constructorArgsFromJsonFn(json);
    }
  };

  // @ts-expect-error
  return KnownErrorImpl;
}

const UnsupportedError = createKnownErrorConstructor(
  KnownError,
  "UNSUPPORTED_ERROR",
  (originalErrorCode: string) => [
    500,
    `An error occured that is not currently supported (possibly because it was added in a version of Stack that is newer than this client). The original unsupported error code was: ${originalErrorCode}`,
    {
      originalErrorCode,
    },
  ] as const,
  (json) => [
    (json.details as any)?.originalErrorCode ?? throwErr("originalErrorCode not found in UnsupportedError details"),
  ] as const,
);

const SchemaError = createKnownErrorConstructor(
  KnownError,
  "SCHEMA_ERROR",
  (message: string) => [
    400,
    message,
  ] as const,
  (json) => [json.message] as const,
);

const AllOverloadsFailed = createKnownErrorConstructor(
  KnownError,
  "ALL_OVERLOADS_FAILED",
  (overloadErrors: Json[]) => [
    400,
    "This endpoint has multiple overloads, but they all failed to process the request.",
    {
      overloads: overloadErrors,
    },
  ] as const,
  (json) => [
    (json.details as any)?.overloadErrors ?? throwErr("overloadErrors not found in AllOverloadsFailed details"),
  ] as const,
);

const ProjectAuthenticationError = createKnownErrorConstructor(
  KnownError,
  "PROJECT_AUTHENTICATION_ERROR",
  "inherit",
  "inherit",
);

const InvalidProjectAuthentication = createKnownErrorConstructor(
  ProjectAuthenticationError,
  "INVALID_PROJECT_AUTHENTICATION",
  "inherit",
  "inherit",
);

const InvalidPublishableClientKey = createKnownErrorConstructor(
  InvalidProjectAuthentication,
  "INVALID_PUBLISHABLE_CLIENT_KEY",
  () => [
    401,
    "The publishable key is not valid for the given project. Does the project and/or the key exist?",
  ] as const,
  () => [] as const,
);

const InvalidSecretServerKey = createKnownErrorConstructor(
  InvalidProjectAuthentication,
  "INVALID_SECRET_SERVER_KEY",
  () => [
    401,
    "The secret server key is not valid for the given project. Does the project and/or the key exist?",
  ] as const,
  () => [] as const,
);

const InvalidSuperSecretAdminKey = createKnownErrorConstructor(
  InvalidProjectAuthentication,
  "INVALID_SUPER_SECRET_ADMIN_KEY",
  () => [
    401,
    "The super secret admin key is not valid for the given project. Does the project and/or the key exist?",
  ] as const,
  () => [] as const,
);

const InvalidAdminAccessToken = createKnownErrorConstructor(
  InvalidProjectAuthentication,
  "INVALID_ADMIN_ACCESS_TOKEN",
  "inherit",
  "inherit",
);

const UnparsableAdminAccessToken = createKnownErrorConstructor(
  InvalidAdminAccessToken,
  "UNPARSABLE_ADMIN_ACCESS_TOKEN",
  () => [
    401,
    "Admin access token is not parsable.",
  ] as const,
  () => [] as const,
);

const AdminAccessTokenExpired = createKnownErrorConstructor(
  InvalidAdminAccessToken,
  "ADMIN_ACCESS_TOKEN_EXPIRED",
  () => [
    401,
    "Admin access token has expired. Please refresh it and try again.",
  ] as const,
  () => [] as const,
);

const InvalidProjectForAdminAccessToken = createKnownErrorConstructor(
  InvalidAdminAccessToken,
  "INVALID_PROJECT_FOR_ADMIN_ACCESS_TOKEN",
  () => [
    401,
    "Admin access token not valid for this project.",
  ] as const,
  () => [] as const,
);

const ProjectAuthenticationRequired = createKnownErrorConstructor(
  ProjectAuthenticationError,
  "PROJECT_AUTHENTICATION_REQUIRED",
  "inherit",
  "inherit",
);

const ClientAuthenticationRequired = createKnownErrorConstructor(
  ProjectAuthenticationRequired,
  "CLIENT_AUTHENTICATION_REQUIRED",
  () => [
    401,
    "The publishable client key must be provided.",
  ] as const,
  () => [] as const,
);

const ServerAuthenticationRequired = createKnownErrorConstructor(
  ProjectAuthenticationRequired,
  "SERVER_AUTHENTICATION_REQUIRED",
  () => [
    401,
    "The secret server key must be provided.",
  ] as const,
  () => [] as const,
);

const ClientOrServerAuthenticationRequired = createKnownErrorConstructor(
  ProjectAuthenticationRequired,
  "CLIENT_OR_SERVER_AUTHENTICATION_REQUIRED",
  () => [
    401,
    "Either the publishable client key or the secret server key must be provided.",
  ] as const,
  () => [] as const,
);

const ClientOrAdminAuthenticationRequired = createKnownErrorConstructor(
  ProjectAuthenticationRequired,
  "CLIENT_OR_ADMIN_AUTHENTICATION_REQUIRED",
  () => [
    401,
    "Either the publishable client key or the super secret admin key must be provided.",
  ] as const,
  () => [] as const,
);

const ClientOrServerOrAdminAuthenticationRequired = createKnownErrorConstructor(
  ProjectAuthenticationRequired,
  "CLIENT_OR_SERVER_OR_ADMIN_AUTHENTICATION_REQUIRED",
  () => [
    401,
    "Either the publishable client key, the secret server key, or the super secret admin key must be provided.",
  ] as const,
  () => [] as const,
);

const AdminAuthenticationRequired = createKnownErrorConstructor(
  ProjectAuthenticationRequired,
  "ADMIN_AUTHENTICATION_REQUIRED",
  () => [
    401,
    "The super secret admin key must be provided.",
  ] as const,
  () => [] as const,
);

const ExpectedInternalProject = createKnownErrorConstructor(
  ProjectAuthenticationError,
  "EXPECTED_INTERNAL_PROJECT",
  () => [
    401,
    "The project ID is expected to be internal.",
  ] as const,
  () => [] as const,
);

const SessionAuthenticationError = createKnownErrorConstructor(
  KnownError,
  "SESSION_AUTHENTICATION_ERROR",
  "inherit",
  "inherit",
);

const InvalidSessionAuthentication = createKnownErrorConstructor(
  SessionAuthenticationError,
  "INVALID_SESSION_AUTHENTICATION",
  "inherit",
  "inherit",
);

const InvalidAccessToken = createKnownErrorConstructor(
  InvalidSessionAuthentication,
  "INVALID_ACCESS_TOKEN",
  "inherit",
  "inherit",
);

const UnparsableAccessToken = createKnownErrorConstructor(
  InvalidAccessToken,
  "UNPARSABLE_ACCESS_TOKEN",
  () => [
    401,
    "Access token is not parsable.",
  ] as const,
  () => [] as const,
);

const AccessTokenExpired = createKnownErrorConstructor(
  InvalidAccessToken,
  "ACCESS_TOKEN_EXPIRED",
  () => [
    401,
    "Access token has expired. Please refresh it and try again.",
  ] as const,
  () => [] as const,
);

const InvalidProjectForAccessToken = createKnownErrorConstructor(
  InvalidAccessToken,
  "INVALID_PROJECT_FOR_ACCESS_TOKEN",
  () => [
    401,
    "Access token not valid for this project.",
  ] as const,
  () => [] as const,
);

const SessionUserEmailNotVerified = createKnownErrorConstructor(
  InvalidSessionAuthentication,
  "SESSION_USER_EMAIL_NOT_VERIFIED",
  () => [
    401,
    "User e-mail not verified, but is required by the project.",
  ] as const,
  () => [] as const,
);

const SessionAuthenticationRequired = createKnownErrorConstructor(
  SessionAuthenticationError,
  "SESSION_AUTHENTICATION_REQUIRED",
  () => [
    401,
    "Session required for this request.",
  ] as const,
  () => [] as const,
);

const RefreshTokenError = createKnownErrorConstructor(
  KnownError,
  "INVALID_REFRESH_TOKEN",
  "inherit",
  "inherit",
);

const ProviderRejected = createKnownErrorConstructor(
  RefreshTokenError,
  "PROVIDER_REJECTED",
  () => [
    401,
    "The provider refused to refresh their token.",
  ] as const,
  () => [] as const,
);

const InvalidRefreshToken = createKnownErrorConstructor(
  RefreshTokenError,
  "REFRESH_TOKEN_EXPIRED",
  () => [
    401,
    "Refresh token has expired. A new refresh token requires reauthentication.",
  ] as const,
  () => [] as const,
);

const UserEmailAlreadyExists = createKnownErrorConstructor(
  KnownError,
  "USER_EMAIL_ALREADY_EXISTS",
  () => [
    400,
    "User already exists.",
  ] as const,
  () => [] as const,
);

const UserNotFound = createKnownErrorConstructor(
  KnownError,
  "USER_NOT_FOUND",
  () => [
    404,
    "User not found.",
  ] as const,
  () => [] as const,
);

const ApiKeyNotFound = createKnownErrorConstructor(
  KnownError,
  "API_KEY_NOT_FOUND",
  () => [
    404,
    "API key not found.",
  ] as const,
  () => [] as const,
);

const ProjectNotFound = createKnownErrorConstructor(
  KnownError,
  "PROJECT_NOT_FOUND",
  () => [
    404,
    "Project not found or is not accessible with the current user.",
  ] as const,
  () => [] as const,
);

const EmailPasswordMismatch = createKnownErrorConstructor(
  KnownError,
  "EMAIL_PASSWORD_MISMATCH",
  () => [
    400,
    "Wrong e-mail or password.",
  ] as const,
  () => [] as const,
);

const RedirectUrlNotWhitelisted = createKnownErrorConstructor(
  KnownError,
  "REDIRECT_URL_NOT_WHITELISTED",
  () => [
    400,
    "Redirect URL not whitelisted.",
  ] as const,
  () => [] as const,
);

const PasswordRequirementsNotMet = createKnownErrorConstructor(
  KnownError,
  "PASSWORD_REQUIREMENTS_NOT_MET",
  "inherit",
  "inherit",
);

const PasswordTooShort = createKnownErrorConstructor(
  PasswordRequirementsNotMet,
  "PASSWORD_TOO_SHORT",
  (minLength: number) => [
    400,
    `Password too short. Minimum length is ${minLength}.`,
    {
      minLength,
    },
  ] as const,
  (json) => [
    (json.details as any)?.minLength ?? throwErr("minLength not found in PasswordTooShort details"),
  ] as const,
);

const PasswordTooLong = createKnownErrorConstructor(
  PasswordRequirementsNotMet,
  "PASSWORD_TOO_LONG",
  (maxLength: number) => [
    400,
    `Password too long. Maximum length is ${maxLength}.`,
    {
      maxLength,
    },
  ] as const,
  (json) => [
    (json.details as any)?.maxLength ?? throwErr("maxLength not found in PasswordTooLong details"),
  ] as const,
);

const EmailVerificationError = createKnownErrorConstructor(
  KnownError,
  "EMAIL_VERIFICATION_ERROR",
  "inherit",
  "inherit",
);

const EmailVerificationCodeError = createKnownErrorConstructor(
  EmailVerificationError,
  "EMAIL_VERIFICATION_CODE_ERROR",
  "inherit",
  "inherit",
);

const EmailVerificationCodeNotFound = createKnownErrorConstructor(
  EmailVerificationCodeError,
  "EMAIL_VERIFICATION_CODE_NOT_FOUND",
  () => [
    404,
    "The e-mail verification code does not exist for this project.",
  ] as const,
  () => [] as const,
);

const EmailVerificationCodeExpired = createKnownErrorConstructor(
  EmailVerificationCodeError,
  "EMAIL_VERIFICATION_CODE_EXPIRED",
  () => [
    400,
    "The e-mail verification code has expired.",
  ] as const,
  () => [] as const,
);

const EmailVerificationCodeAlreadyUsed = createKnownErrorConstructor(
  EmailVerificationCodeError,
  "EMAIL_VERIFICATION_CODE_ALREADY_USED",
  () => [
    400,
    "The e-mail verification link has already been used.",
  ] as const,
  () => [] as const,
);

const MagicLinkError = createKnownErrorConstructor(
  KnownError,
  "MAGIC_LINK_ERROR",
  "inherit",
  "inherit",
);

const MagicLinkCodeError = createKnownErrorConstructor(
  MagicLinkError,
  "MAGIC_LINK_CODE_ERROR",
  "inherit",
  "inherit",
);

const MagicLinkCodeNotFound = createKnownErrorConstructor(
  MagicLinkCodeError,
  "MAGIC_LINK_CODE_NOT_FOUND",
  () => [
    404,
    "The e-mail verification code does not exist for this project.",
  ] as const,
  () => [] as const,
);

const MagicLinkCodeExpired = createKnownErrorConstructor(
  MagicLinkCodeError,
  "MAGIC_LINK_CODE_EXPIRED",
  () => [
    400,
    "The e-mail verification code has expired.",
  ] as const,
  () => [] as const,
);

const MagicLinkCodeAlreadyUsed = createKnownErrorConstructor(
  MagicLinkCodeError,
  "MAGIC_LINK_CODE_ALREADY_USED",
  () => [
    400,
    "The e-mail verification link has already been used.",
  ] as const,
  () => [] as const,
);

const PasswordMismatch = createKnownErrorConstructor(
  KnownError,
  "PASSWORD_MISMATCH",
  () => [
    400,
    "Passwords do not match.",
  ] as const,
  () => [] as const,
);

const PasswordResetError = createKnownErrorConstructor(
  KnownError,
  "PASSWORD_RESET_ERROR",
  "inherit",
  "inherit",
);

const PasswordResetCodeError = createKnownErrorConstructor(
  PasswordResetError,
  "PASSWORD_RESET_CODE_ERROR",
  "inherit",
  "inherit",
);

const PasswordResetCodeNotFound = createKnownErrorConstructor(
  PasswordResetCodeError,
  "PASSWORD_RESET_CODE_NOT_FOUND",
  () => [
    404,
    "The password reset code does not exist for this project.",
  ] as const,
  () => [] as const,
);

const PasswordResetCodeExpired = createKnownErrorConstructor(
  PasswordResetCodeError,
  "PASSWORD_RESET_CODE_EXPIRED",
  () => [
    400,
    "The password reset code has expired.",
  ] as const,
  () => [] as const,
);

const PasswordResetCodeAlreadyUsed = createKnownErrorConstructor(
  PasswordResetCodeError,
  "PASSWORD_RESET_CODE_ALREADY_USED",
  () => [
    400,
    "The password reset code has already been used.",
  ] as const,
  () => [] as const,
);

const EmailAlreadyVerified = createKnownErrorConstructor(
  KnownError,
  "EMAIL_ALREADY_VERIFIED",
  () => [
    400,
    "The e-mail is already verified.",
  ] as const,
  () => [] as const,
);

export type KnownErrors = {
  [K in keyof typeof KnownErrors]: InstanceType<typeof KnownErrors[K]>;
};

export const KnownErrors = {
  UnsupportedError,
  SchemaError,
  AllOverloadsFailed,
  ProjectAuthenticationError,
  InvalidProjectAuthentication,
  InvalidPublishableClientKey,
  InvalidSecretServerKey,
  InvalidSuperSecretAdminKey,
  InvalidAdminAccessToken,
  UnparsableAdminAccessToken,
  AdminAccessTokenExpired,
  InvalidProjectForAdminAccessToken,
  ProjectAuthenticationRequired,
  ClientAuthenticationRequired,
  ServerAuthenticationRequired,
  ClientOrServerAuthenticationRequired,
  ClientOrAdminAuthenticationRequired,
  ClientOrServerOrAdminAuthenticationRequired,
  AdminAuthenticationRequired,
  ExpectedInternalProject,
  SessionAuthenticationError,
  InvalidSessionAuthentication,
  InvalidAccessToken,
  UnparsableAccessToken,
  AccessTokenExpired,
  InvalidProjectForAccessToken,
  SessionUserEmailNotVerified,
  SessionAuthenticationRequired,
  RefreshTokenError,
  ProviderRejected,
  InvalidRefreshToken,
  UserEmailAlreadyExists,
  UserNotFound,
  ApiKeyNotFound,
  ProjectNotFound,
  EmailPasswordMismatch,
  RedirectUrlNotWhitelisted,
  PasswordRequirementsNotMet,
  PasswordTooShort,
  PasswordTooLong,
  EmailVerificationError,
  EmailVerificationCodeError,
  EmailVerificationCodeNotFound,
  EmailVerificationCodeExpired,
  EmailVerificationCodeAlreadyUsed,
  MagicLinkError,
  MagicLinkCodeError,
  MagicLinkCodeNotFound,
  MagicLinkCodeExpired,
  MagicLinkCodeAlreadyUsed,
  PasswordResetError,
  PasswordResetCodeError,
  PasswordResetCodeNotFound,
  PasswordResetCodeExpired,
  PasswordResetCodeAlreadyUsed,
  PasswordMismatch,
  EmailAlreadyVerified,
} satisfies Record<string, KnownErrorConstructor<any, any>>;


// ensure that all known error codes are unique
const knownErrorCodes = new Set<string>();
for (const [_, KnownError] of Object.entries(KnownErrors)) {
  if (knownErrorCodes.has(KnownError.errorCode)) {
    throw new Error(`Duplicate known error code: ${KnownError.errorCode}`);
  }
  knownErrorCodes.add(KnownError.errorCode);
}
