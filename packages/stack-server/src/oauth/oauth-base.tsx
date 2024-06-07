import { Issuer, generators, CallbackParamsType, Client, TokenSet } from "openid-client";
import { OAuthUserInfo } from "./utils";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";

export abstract class OAuthBaseProvider {
  issuer: Issuer;
  scope: string;
  oauthClient: Client;
  redirectUri: string;
  openid: boolean;

  constructor({
    issuer,
    authorizationEndpoint,
    tokenEndpoint,
    userinfoEndpoint,
    clientId,
    clientSecret,
    redirectUri,
    jwksUri,
    openid,
    scope,
  }: {
    issuer: string,
    authorizationEndpoint: string,
    tokenEndpoint: string,
    userinfoEndpoint?: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    jwksUri?: string,
    openid?: boolean,
    scope: string,
  }) {
    this.issuer = new Issuer({
      issuer,
      authorization_endpoint: authorizationEndpoint,
      token_endpoint: tokenEndpoint,
      userinfo_endpoint: userinfoEndpoint,
      jwks_uri: jwksUri,
    });
    this.oauthClient = new this.issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      response_types: ["code"],
    });

    this.openid = openid || false;
    this.redirectUri = redirectUri;
    this.scope = scope;
  }

  getAuthorizationUrl({
    codeVerifier,
    state
  }: {
    codeVerifier: string,
    state: string,
  }) {
    return this.oauthClient.authorizationUrl({
      scope: this.scope,
      code_challenge: generators.codeChallenge(codeVerifier),
      code_challenge_method: "S256",
      state: state,
    });
  }

  async getCallback({
    callbackParams,
    codeVerifier,
    state
  }:{
    callbackParams: CallbackParamsType, 
    codeVerifier: string, 
    state: string,
  }): Promise<OAuthUserInfo> {
    let tokenSet;
    try {
      const params = {
        code_verifier: codeVerifier,
        state: state,
      };
      if (this.openid) {
        tokenSet = await this.oauthClient.callback(this.redirectUri, callbackParams, params);
      } else {
        tokenSet = await this.oauthClient.oauthCallback(this.redirectUri, callbackParams, params);
      }
    } catch (error) {
      throw new StackAssertionError("Inner OAuth callback failed", undefined, { cause: error });
    }
    if (!tokenSet.access_token) {
      throw new StackAssertionError("No access token received from inner OAuth", { tokenSet });
    }
    
    return await this.postProcessUserInfo(tokenSet);
  }

  abstract postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo>;
}
