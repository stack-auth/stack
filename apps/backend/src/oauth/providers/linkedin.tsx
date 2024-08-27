import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

interface Identifier {
  identifier: string,
}

interface Element {
  identifiers: Identifier[],
}

export interface LinkedInProfile extends Record<string, any> {
  id: string,
  localizedFirstName: string,
  localizedLastName: string,
  profilePicture: {
    "displayImage~": {
      elements: Element[],
    },
  },
}

export class LinkedInProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new LinkedInProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://linkedin.com",
        authorizationEndpoint: "https://linkedin.com/oauth/v2/authorization",
        tokenEndpoint: "https://linkedin.com/oauth/v2/accessToken",
        userinfoEndpoint:
          "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~digitalmediaAsset:playableStreams))",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/linkedin",
        baseScope: "r_liteprofile r_emailaddress",
        ...options,
      }))
    );
  }
  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = (await this.oauthClient.userinfo(
      tokenSet.accessToken
    )) as LinkedInProfile;
    const emailData = await fetch(
       "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
       { headers: { Authorization: `Bearer ${tokenSet.accessToken}` } }
     ).then((res) => res.json());
    return validateUserInfo({
      accountId: rawUserInfo.id.toString(),
      displayName: `${rawUserInfo.localizedFirstName} ${rawUserInfo.localizedLastName}`,
      email: emailData?.elements?.[0]?.["handle~"]?.emailAddress,
      profileImageUrl: rawUserInfo.profilePicture["displayImage~"].elements[0].identifiers[0].identifier,
    });
  }
}
