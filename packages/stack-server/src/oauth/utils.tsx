import * as yup from 'yup';

export interface OAuthUserInfo {
  accountId: string,
  displayName: string,
  email: string,
  profileImageUrl?: string,
  accessToken?: string,
  refreshToken?: string,
}

const OAuthUserInfoSchema = yup.object().shape({
  accountId: yup.string().required(),
  displayName: yup.string().required(),
  email: yup.string().required(),
  profileImageUrl: yup.string().default(undefined),
  accessToken: yup.string().default(undefined),
  refreshToken: yup.string().default(undefined),
});

export function validateUserInfo(userInfo: any): OAuthUserInfo {
  return OAuthUserInfoSchema.validateSync(userInfo);
}
