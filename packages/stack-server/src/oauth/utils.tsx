export type OauthUserInfo = {
  accountId: string,
  displayName: string,
  email: string,
  accessToken?: string,
  refreshToken?: string,
}

export type OauthCallback = {
  oauthProviderConfigId: string,
} & OauthUserInfo;

export function validateUserInfo(userInfo: any): OauthUserInfo {
  if (!userInfo.accountId || !userInfo.displayName || !userInfo.email) {
    throw new Error("Invalid user info: ", userInfo);
  }
  return {
    accountId: userInfo.accountId,
    displayName: userInfo.displayName,
    email: userInfo.email,
    accessToken: userInfo.accessToken,
    refreshToken: userInfo.refreshToken,
  };
}
