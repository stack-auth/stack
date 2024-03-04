import * as yup from 'yup';

export interface OauthUserInfo {
  accountId: string,
  displayName: string,
  email: string,
  profileImageUrl?: string,
  accessToken?: string,
  refreshToken?: string,
}

const OauthUserInfoSchema = yup.object().shape({
  accountId: yup.string().required(),
  displayName: yup.string().required(),
  email: yup.string().required(),
  profileImageUrl: yup.string().optional(),
  accessToken: yup.string().optional(),
  refreshToken: yup.string().optional(),
});

export function validateUserInfo(userInfo: any): OauthUserInfo {
  return OauthUserInfoSchema.validateSync(userInfo);
}