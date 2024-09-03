import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { OAuthBaseProvider, TokenSet } from "./base";

export class FacebookProvider extends OAuthBaseProvider {
  private constructor(...args: ConstructorParameters<typeof OAuthBaseProvider>) {
    super(...args);
  }

  static async create(options: { clientId: string; clientSecret: string; facebookConfigId?: string }) {
    return new FacebookProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://www.facebook.com",
        authorizationEndpoint: "https://facebook.com/v20.0/dialog/oauth/",
        tokenEndpoint: "https://graph.facebook.com/v20.0/oauth/access_token",
        redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/facebook",
        baseScope: "public_profile email",
        ...options,
        authorizationExtraParams: options.facebookConfigId
          ? {
              config_id: options.facebookConfigId,
            }
          : undefined,
      })),
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const url = new URL("https://graph.facebook.com/v3.2/me");
    url.searchParams.append("access_token", tokenSet.accessToken || "");
    url.searchParams.append("fields", "id,name,email");
    const rawUserInfo = await fetch(url).then((res) => res.json());

    if (!rawUserInfo.email) {
      throw new StatusError(
        StatusError.BadRequest,
        `Facebook OAuth did not return an email address. This is likely because you did not allow the "email" scope on the Facebook developer dashboard.`,
      );
    }

    return validateUserInfo({
      accountId: rawUserInfo.id,
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      profileImageUrl: `https://graph.facebook.com/v19.0/${rawUserInfo.id}/picture`,
      // Even though it seems like that Facebook verifies the email address with the API calls, but the official docs say that it's not verified.
      // To be on the safe side, we'll assume that it's not verified.
      // https://stackoverflow.com/questions/14280535/is-it-possible-to-check-if-an-email-is-confirmed-on-facebook
      // https://developers.facebook.com/docs/facebook-login/guides/advanced/existing-system#associating2
      emailVerified: false,
    });
  }
}
