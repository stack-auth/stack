import { yupBoolean, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import * as yup from 'yup';

export type OAuthUserInfo = yup.InferType<typeof OAuthUserInfoSchema>;

const OAuthUserInfoSchema = yupObject({
  accountId: yupString().min(1).required(),
  displayName: yupString().nullable().default(null),
  email: yupString().email().nullable().default(null),
  profileImageUrl: yupString().nullable().default(null),
  emailVerified: yupBoolean().default(false),
});

export function validateUserInfo(
  userInfo: Partial<yup.InferType<typeof OAuthUserInfoSchema>>,
  options?: { expectNoEmail?: boolean }
): OAuthUserInfo {
  if (!options?.expectNoEmail && !userInfo.email) {
    throw new Error("Email is required");
  }
  return OAuthUserInfoSchema.validateSync(userInfo);
}