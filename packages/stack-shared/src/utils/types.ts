import { StatusError } from "./errors";

// TODO: make this file less redundant

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

export type KnownErrorCode =
  | typeof GrantInvalidErrorCode
  | typeof AccessTokenExpiredErrorCode 
  | typeof UserAlreadyExistErrorCode 
  | typeof UserNotExistErrorCode 
  | typeof UserNotVerifiedErrorCode 
  | typeof EmailPasswordMissMatchErrorCode
  | typeof RedirectUrlInvalidErrorCode
  | typeof PasswordFormatInvalidErrorCode
  | typeof ProjectIdOrKeyInvalidErrorCode
  | typeof EmailVerificationLinkInvalidErrorCode
  | typeof EmailVerificationLinkExpiredErrorCode
  | typeof EmailVerificationLinkUsedErrorCode
  | typeof PasswordResetLinkInvalidErrorCode
  | typeof PasswordResetLinkExpiredErrorCode
  | typeof PasswordResetLinkUsedErrorCode
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
];

export type SignUpErrorCode = typeof UserAlreadyExistErrorCode
export const SignUpErrorCodes = [UserAlreadyExistErrorCode];

export type SignInErrorCode = typeof EmailPasswordMissMatchErrorCode 
  | typeof UserNotExistErrorCode
export const SignInErrorCodes = [
  EmailPasswordMissMatchErrorCode, 
  UserNotExistErrorCode
];

export type EmailVerificationLinkErrorCode = typeof EmailVerificationLinkInvalidErrorCode 
  | typeof EmailVerificationLinkExpiredErrorCode | typeof EmailVerificationLinkUsedErrorCode
export const EmailVerificationLinkErrorCodes = [
  EmailVerificationLinkInvalidErrorCode, 
  EmailVerificationLinkExpiredErrorCode, 
  EmailVerificationLinkUsedErrorCode
];

export type PasswordResetLinkErrorCode = typeof PasswordResetLinkInvalidErrorCode 
  | typeof PasswordResetLinkExpiredErrorCode | typeof PasswordResetLinkUsedErrorCode
export const PasswordResetLinkErrorCodes = [
  PasswordResetLinkInvalidErrorCode, 
  PasswordResetLinkExpiredErrorCode, 
  PasswordResetLinkUsedErrorCode
];

export class KnownError extends StatusError {
  constructor(public readonly errorCode: KnownErrorCode) {
    super(
      401,
      JSON.stringify({
        error_code: errorCode,
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
}
