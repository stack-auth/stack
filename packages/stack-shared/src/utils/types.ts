import { StatusError } from "./errors";

export const AccessTokenExpiredErrorCode = "ACCESS_TOKEN_EXPIRED";
export const GrantInvalidErrorCode = "GRANT_INVALID";
export const UserAlreadyExistErrorCode = "USER_ALREADY_EXIST";
export const UserNotExistErrorCode = "USER_NOT_EXIST";
export const UserNotVerifiedErrorCode = "USER_NOT_VERIFIED";
export const EmailPasswordMissMatchErrorCode = "EMAIL_PASSWORD_MISS_MATCH";
export const RedirectUrlInvalidErrorCode = "REDIRECT_URL_INVALID";
export const PasswordFormatInvalidErrorCode = "PASSWORD_FORMAT_INVALID";
export const ProjectIdOrKeyInvalidErrorCode = "PROJECT_ID_OR_KEY_INVALID";
export const EmailVerificationLinkInvalidErrorCode = "EMAIL_VERIFICATION_LINK_INVALID";
export const EmailVerificationLinkExpiredErrorCode = "EMAIL_VERIFICATION_LINK_EXPIRED";
export const EmailVerificationLinkUsedErrorCode = "EMAIL_VERIFICATION_LINK_USED";
export const PasswordResetLinkInvalidErrorCode = "PASSWORD_RESET_LINK_INVALID";
export const PasswordResetLinkExpiredErrorCode = "PASSWORD_RESET_LINK_EXPIRED";
export const PasswordResetLinkUsedErrorCode = "PASSWORD_RESET_LINK_USED";

export const KnownErrorCodes = [
  AccessTokenExpiredErrorCode,
  GrantInvalidErrorCode,
  UserAlreadyExistErrorCode,
  UserNotExistErrorCode,
  UserNotVerifiedErrorCode,
  EmailPasswordMissMatchErrorCode,
  RedirectUrlInvalidErrorCode,
  PasswordFormatInvalidErrorCode,
  ProjectIdOrKeyInvalidErrorCode,
  EmailVerificationLinkInvalidErrorCode,
  EmailVerificationLinkExpiredErrorCode,
  EmailVerificationLinkUsedErrorCode,
  PasswordResetLinkInvalidErrorCode,
  PasswordResetLinkExpiredErrorCode,
  PasswordResetLinkUsedErrorCode,
] as const;
export type KnownErrorCode = typeof KnownErrorCodes[number];

export const SignUpErrorCodes = [UserAlreadyExistErrorCode] as const;
export type SignUpErrorCode = typeof SignUpErrorCodes[number];

export const SignInErrorCodes = [
  EmailPasswordMissMatchErrorCode, 
  UserNotExistErrorCode
] as const;
export type SignInErrorCode = typeof SignInErrorCodes[number];

export const EmailVerificationLinkErrorCodes = [
  EmailVerificationLinkInvalidErrorCode, 
  EmailVerificationLinkExpiredErrorCode, 
  EmailVerificationLinkUsedErrorCode
] as const;
export type EmailVerificationLinkErrorCode = typeof EmailVerificationLinkErrorCodes[number]

export const PasswordResetLinkErrorCodes = [
  PasswordResetLinkInvalidErrorCode, 
  PasswordResetLinkExpiredErrorCode, 
  PasswordResetLinkUsedErrorCode
] as const;
export type PasswordResetLinkErrorCode = typeof PasswordResetLinkErrorCodes[number]

export class KnownError extends StatusError {
  constructor(public readonly errorCode: KnownErrorCode) {
    super(
      401,
      JSON.stringify({
        error_code: errorCode,
      }),
      {
        headers: {
          "content-type": ["application/json"],
        },
      }
    );
  }
}
