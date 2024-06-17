import * as yup from 'yup';

export type OAuthUserInfo = yup.InferType<typeof OAuthUserInfoSchema>;

const OAuthUserInfoSchema = yup.object().shape({
  accountId: yup.string().required(),
  displayName: yup.string().nullable().default(null),
  email: yup.string().required(),
  profileImageUrl: yup.string().nullable().default(null),
  accessToken: yup.string().nullable().default(null),
  refreshToken: yup.string().nullable().default(null),
});

export function validateUserInfo(userInfo: any): OAuthUserInfo {
  return OAuthUserInfoSchema.validateSync(userInfo);
}
