import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class MicrosoftProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: {
    clientId: string,
    clientSecret: string,
    microsoftTenantId?: string,
  }) {
    return new MicrosoftProvider(...await OAuthBaseProvider.createConstructorArgs({
      issuer: `https://login.microsoftonline.com${"/" + options.microsoftTenantId || ""}`,
      authorizationEndpoint: `https://login.microsoftonline.com/${options.microsoftTenantId || 'consumers'}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${options.microsoftTenantId || 'consumers'}/oauth2/v2.0/token`,
      redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/microsoft",
      baseScope: "User.Read",
      ...options,
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      {
        headers: {
          Authorization: `Bearer ${tokenSet.accessToken}`,
        },
      }
    ).then(res => res.json());

    return validateUserInfo({
      accountId: rawUserInfo.id,
      displayName: rawUserInfo.displayName,
      email: rawUserInfo.mail || rawUserInfo.userPrincipalName,
      profileImageUrl: undefined, // Microsoft Graph API does not return profile image URL
      // Microsoft does not make sure that the email is verified, so we cannot trust it
      // https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation#validate-the-subject
      emailVerified: false,
    });
  }
}
