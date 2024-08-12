import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import * as yup from 'yup';

export type OAuthUserInfo = yup.InferType<typeof OAuthUserInfoSchema>;

const OAuthUserInfoSchema = yupObject({
  accountId: yupString().required(),
  displayName: yupString().nullable().default(null),
  email: yupString().required(),
  profileImageUrl: yupString().nullable().default(null),
});

export function validateUserInfo(userInfo: Partial<yup.InferType<typeof OAuthUserInfoSchema>>): OAuthUserInfo {
  return OAuthUserInfoSchema.validateSync(userInfo);
}