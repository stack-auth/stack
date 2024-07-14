import * as yup from 'yup';
import { yupObject, yupString, yupNumber, yupBoolean, yupArray, yupMixed } from "@stackframe/stack-shared/dist/schema-fields";

export type OAuthUserInfo = yup.InferType<typeof OAuthUserInfoSchema>;

const OAuthUserInfoSchema = yupObject({
  accountId: yupString().required(),
  displayName: yupString().nullable().default(null),
  email: yupString().required(),
  profileImageUrl: yupString().nullable().default(null),
  accessToken: yupString().nullable().default(null),
  refreshToken: yupString().nullable().default(null),
});

export function validateUserInfo(userInfo: any): OAuthUserInfo {
  return OAuthUserInfoSchema.validateSync(userInfo);
}
