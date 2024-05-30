import { AuthorizationCode, AuthorizationCodeModel, Client, Falsey, OAuth2Server, RefreshToken, Token, User } from "@node-oauth/oauth2-server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";
import { prismaClient } from "@/prisma-client";
import { decodeAccessToken, encodeAccessToken } from "@/lib/tokens";
import { validateUrl } from "@/lib/utils";
import { checkApiKeySet } from "@/lib/api-keys";
import { getProject } from "@/lib/projects";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";

const enabledScopes = ["openid"];

function checkScope(scope: string | string[] | undefined) {
  if (typeof scope === "string") {
    return enabledScopes.includes(scope);
  } else if (Array.isArray(scope)){
    return scope.every((s) => enabledScopes.includes(s));
  } else {
    return false;
  }
}

export class OAuthModel implements AuthorizationCodeModel {
  async getClient(clientId: string, clientSecret: string): Promise<Client | Falsey> {
    if (clientSecret) {
      const keySet = await checkApiKeySet(clientId, { publishableClientKey: clientSecret });
      if (!keySet) {
        return false;
      }
    }
    
    const project = await getProject(clientId);
    if (!project) {
      return false;
    }

    const redirectUris = project.evaluatedConfig.domains.map(
      ({ domain, handlerPath }) => new URL(handlerPath, domain).toString()
    );

    if (redirectUris.length === 0 && project.evaluatedConfig.allowLocalhost) {
      redirectUris.push("http://localhost");
    }

    return {
      id: project.id,
      grants: ["authorization_code", "refresh_token"],
      redirectUris: redirectUris,
    };
  }

  async validateScope(user: User, client: Client, scope?: string[]): Promise<string[] | Falsey> {
    if (!user) {
      return false;
    }

    if (!client) {
      return false;
    }

    return checkScope(scope) ? scope : false;
  }

  async generateAccessToken(client: Client, user: User, scope: string[]): Promise<string> {
    return await encodeAccessToken({
      projectId: client.id,
      userId: user.id,
    });
  }

  async generateRefreshToken(client: Client, user: User, scope: string[]): Promise<string> {
    return generateSecureRandomString();
  }

  async saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey>{
    if (token.refreshToken) {
      await prismaClient.projectUserRefreshToken.create({
        data: {
          refreshToken: token.refreshToken,
          expiresAt: token.refreshTokenExpiresAt,
          projectUser: {
            connect: {
              projectId_projectUserId: {
                projectId: client.id,
                projectUserId: user.id,
              },
            },
          },
        },
      });
    }

    token.client = client;
    token.user = user;
    return {
      ...token,
      newUser: user.newUser,
    };
  }

  async getAccessToken(accessToken: string): Promise<Token | Falsey> {
    let decoded;
    try {
      decoded = await decodeAccessToken(accessToken);
    } catch (e) {
      captureError("getAccessToken", e);
      return false;
    }

    return {
      accessToken,
      accessTokenExpiresAt: new Date(decoded.exp * 1000),
      user: {
        id: decoded.userId,
      },
      client: {
        id: decoded.projectId,
        grants: ["authorization_code", "refresh_token"],
      },
      scope: enabledScopes,
    };
  }

  async getRefreshToken(refreshToken: string): Promise<RefreshToken | Falsey> {
    const token = await prismaClient.projectUserRefreshToken.findUnique({
      where: {
        refreshToken,
      },
    });

    if (!token) {
      return false;
    }

    return {
      refreshToken,
      refreshTokenExpiresAt: token.expiresAt === null ? undefined : token.expiresAt,
      user: {
        id: token.projectUserId,
      },
      client: {
        id: token.projectId,
        grants: ["authorization_code", "refresh_token"],
      },
      scope: enabledScopes,
    };
  }

  async revokeToken(token: RefreshToken): Promise<boolean> {
    // No refreshToken rotation for now (see Git history for old code)
    return true;
  }

  async verifyScope(token: Token, scope: string[]): Promise<boolean> {
    return checkScope(scope);
  }

  async saveAuthorizationCode(
    code: Pick<AuthorizationCode, 'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope' | 'codeChallenge' | 'codeChallengeMethod'>,
    client: Client,
    user: User
  ): Promise<AuthorizationCode | Falsey> {
    await prismaClient.projectUserAuthorizationCode.create({
      data: {
        authorizationCode: code.authorizationCode,
        codeChallenge: code.codeChallenge || "",
        codeChallengeMethod: code.codeChallengeMethod || "",
        redirectUri: code.redirectUri,
        expiresAt: code.expiresAt,
        projectUserId: user.id,
        newUser: user.newUser,
        projectId: client.id,
      },
    });

    return {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: enabledScopes,
      client: {
        id: client.id,
        grants: ["authorization_code", "refresh_token"],
      },
      user,
    };
  }

  async getAuthorizationCode(authorizationCode: string): Promise<AuthorizationCode | Falsey> {
    const code = await prismaClient.projectUserAuthorizationCode.findUnique({
      where: {
        authorizationCode,
      },
    });
    if (!code) {
      return false;
    }
    return {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: enabledScopes,
      codeChallenge: code.codeChallenge,
      codeChallengeMethod: code.codeChallengeMethod,
      client: {
        id: code.projectId,
        grants: ["authorization_code", "refresh_token"],
      },
      user: {
        id: code.projectUserId,
        newUser: code.newUser,
      },
    };
  }

  async revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    try {
      const deletedCode = await prismaClient.projectUserAuthorizationCode.delete({
        where: {
          authorizationCode: code.authorizationCode,
        }
      });

      return !!deletedCode;
    } catch (e) {
      if (!(e instanceof PrismaClientKnownRequestError)) {
        throw e;
      }
      return false;
    }
  }

  async validateRedirectUri(redirect_uri: string, client: Client): Promise<boolean> {
    const project = await getProject(client.id);

    if (!project) {
      // This should in theory never happen, make typescript happy
      throw new StackAssertionError("Project not found");
    }

    return validateUrl(
      redirect_uri,
      project.evaluatedConfig.domains,
      project.evaluatedConfig.allowLocalhost,
    );
  }
}
