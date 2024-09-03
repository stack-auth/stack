import * as yup from "yup";
import { yupBoolean, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export type OAuthUserInfo = yup.InferType<typeof OAuthUserInfoSchema>;

const OAuthUserInfoSchema = yupObject({
  accountId: yupString().min(1).required(),
  displayName: yupString().nullable().default(null),
  email: yupString().email().required(),
  profileImageUrl: yupString().nullable().default(null),
  emailVerified: yupBoolean().default(false),
});

export function validateUserInfo(userInfo: Partial<yup.InferType<typeof OAuthUserInfoSchema>>): OAuthUserInfo {
  return OAuthUserInfoSchema.validateSync(userInfo);
}
