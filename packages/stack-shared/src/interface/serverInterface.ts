import { KnownErrors } from "../known-errors";
import { AccessToken, InternalSession, RefreshToken } from "../sessions";
import { StackAssertionError } from "../utils/errors";
import { filterUndefined } from "../utils/objects";
import { Result } from "../utils/results";
import {
  ClientInterfaceOptions,
  StackClientInterface
} from "./clientInterface";
import { ContactChannelsCrud } from "./crud/contact-channels";
import { CurrentUserCrud } from "./crud/current-user";
import { ConnectedAccountAccessTokenCrud } from "./crud/oauth";
import { TeamMemberProfilesCrud } from "./crud/team-member-profiles";
import { TeamMembershipsCrud } from "./crud/team-memberships";
import { TeamPermissionsCrud } from "./crud/team-permissions";
import { TeamsCrud } from "./crud/teams";
import { UsersCrud } from "./crud/users";

export type ServerAuthApplicationOptions = (
  & ClientInterfaceOptions
  & (
    | {
      readonly secretServerKey: string,
    }
    | {
      readonly projectOwnerSession: InternalSession,
    }
  )
);

export class StackServerInterface extends StackClientInterface {
  constructor(public override options: ServerAuthApplicationOptions) {
    super(options);
  }

  protected async sendServerRequest(path: string, options: RequestInit, session: InternalSession | null, requestType: "server" | "admin" = "server") {
    return await this.sendClientRequest(
      path,
      {
        ...options,
        headers: {
          "x-stack-secret-server-key": "secretServerKey" in this.options ? this.options.secretServerKey : "",
          ...options.headers,
        },
      },
      session,
      requestType,
    );
  }

  protected async sendServerRequestAndCatchKnownError<E extends typeof KnownErrors[keyof KnownErrors]>(
    path: string,
    requestOptions: RequestInit,
    tokenStoreOrNull: InternalSession | null,
    errorsToCatch: readonly E[],
  ): Promise<Result<
    Response & {
      usedTokens: {
        accessToken: AccessToken,
        refreshToken: RefreshToken | null,
      } | null,
    },
    InstanceType<E>
  >> {
    try {
      return Result.ok(await this.sendServerRequest(path, requestOptions, tokenStoreOrNull));
    } catch (e) {
      for (const errorType of errorsToCatch) {
        if (e instanceof errorType) {
          return Result.error(e as InstanceType<E>);
        }
      }
      throw e;
    }
  }

  async createServerUser(data: UsersCrud['Server']['Create']): Promise<UsersCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      "/users",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await response.json();
  }

  async getServerUserByToken(session: InternalSession): Promise<CurrentUserCrud['Server']['Read'] | null> {
    const responseOrError = await this.sendServerRequestAndCatchKnownError(
      "/users/me",
      {},
      session,
      [KnownErrors.CannotGetOwnUserWithoutUser],
    );
    if (responseOrError.status === "error") {
      if (responseOrError.error instanceof KnownErrors.CannotGetOwnUserWithoutUser) {
        return null;
      } else {
        throw new StackAssertionError("Unexpected uncaught error", { cause: responseOrError.error });
      }
    }
    const response = responseOrError.data;
    const user: CurrentUserCrud['Server']['Read'] = await response.json();
    if (!(user as any)) throw new StackAssertionError("User endpoint returned null; this should never happen");
    return user;
  }

  async getServerUserById(userId: string): Promise<Result<UsersCrud['Server']['Read']>> {
    const response = await this.sendServerRequest(
      `/users/${userId}`,
      {},
      null,
    );
    const user: CurrentUserCrud['Server']['Read'] | null = await response.json();
    if (!user) return Result.error(new Error("Failed to get user"));
    return Result.ok(user);
  }

  async listServerTeamMemberProfiles(
    options: {
      teamId: string,
    },
  ): Promise<TeamMemberProfilesCrud['Server']['Read'][]> {
    const response = await this.sendServerRequest(
      "/team-member-profiles?team_id=" + options.teamId,
      {},
      null,
    );
    const result = await response.json() as TeamMemberProfilesCrud['Server']['List'];
    return result.items;
  }

  async getServerTeamMemberProfile(
    options: {
      teamId: string,
      userId: string,
    },
  ): Promise<TeamMemberProfilesCrud['Client']['Read']> {
    const response = await this.sendServerRequest(
      `/team-member-profiles/${options.teamId}/${options.userId}`,
      {},
      null,
    );
    return await response.json();
  }

  async listServerTeamPermissions(
    options: {
      userId?: string,
      teamId?: string,
      recursive: boolean,
    },
    session: InternalSession | null,
  ): Promise<TeamPermissionsCrud['Server']['Read'][]> {
    const response = await this.sendServerRequest(
      "/team-permissions?" + new URLSearchParams(filterUndefined({
        user_id: options.userId,
        team_id: options.teamId,
        recursive: options.recursive.toString(),
      })),
      {},
      session,
    );
    const result = await response.json() as TeamPermissionsCrud['Server']['List'];
    return result.items;
  }

  async listServerUsers(): Promise<UsersCrud['Server']['Read'][]> {
    const response = await this.sendServerRequest("/users", {}, null);
    const result = await response.json() as UsersCrud['Server']['List'];
    return result.items;
  }

  async listServerTeams(options?: {
    userId?: string,
  }): Promise<TeamsCrud['Server']['Read'][]> {
    const response = await this.sendServerRequest(
      "/teams?" + new URLSearchParams(filterUndefined({
        user_id: options?.userId,
      })),
      {},
      null
    );
    const result = await response.json() as TeamsCrud['Server']['List'];
    return result.items;
  }

  async listServerTeamUsers(teamId: string): Promise<UsersCrud['Server']['Read'][]> {
    const response = await this.sendServerRequest(`/users?team_id=${teamId}`, {}, null);
    const result = await response.json() as UsersCrud['Server']['List'];
    return result.items;
  }

  /* when passing a session, the user will be added to the team */
  async createServerTeam(data: TeamsCrud['Server']['Create']): Promise<TeamsCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      "/teams",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null
    );
    return await response.json();
  }

  async updateServerTeam(teamId: string, data: TeamsCrud['Server']['Update']): Promise<TeamsCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      `/teams/${teamId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await response.json();
  }

  async deleteServerTeam(teamId: string): Promise<void> {
    await this.sendServerRequest(
      `/teams/${teamId}`,
      { method: "DELETE" },
      null,
    );
  }

  async addServerUserToTeam(options: {
    userId: string,
    teamId: string,
  }): Promise<TeamMembershipsCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      `/team-memberships/${options.teamId}/${options.userId}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
    return await response.json();
  }

  async removeServerUserFromTeam(options: {
    userId: string,
    teamId: string,
  }) {
    await this.sendServerRequest(
      `/team-memberships/${options.teamId}/${options.userId}`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }

  async updateServerUser(userId: string, update: UsersCrud['Server']['Update']): Promise<UsersCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      `/users/${userId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(update),
      },
      null,
    );
    return await response.json();
  }

  async createServerProviderAccessToken(
    userId: string,
    provider: string,
    scope: string,
  ): Promise<ConnectedAccountAccessTokenCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      `/connected-accounts/${userId}/${provider}/access-token`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ scope }),
      },
      null,
    );
    return await response.json();
  }

  async createServerUserSession(userId: string, expiresInMillis: number): Promise<{ accessToken: string, refreshToken: string }> {
    const response = await this.sendServerRequest(
      "/auth/sessions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          expires_in_millis: expiresInMillis,
        }),
      },
      null,
    );
    const result = await response.json();
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }

  async leaveServerTeam(
    options: {
      teamId: string,
      userId: string,
    },
  ) {
    await this.sendClientRequest(
      `/team-memberships/${options.teamId}/${options.userId}`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }

  async grantServerTeamUserPermission(teamId: string, userId: string, permissionId: string) {
    await this.sendServerRequest(
      `/team-permissions/${teamId}/${userId}/${permissionId}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }

  async revokeServerTeamUserPermission(teamId: string, userId: string, permissionId: string) {
    await this.sendServerRequest(
      `/team-permissions/${teamId}/${userId}/${permissionId}`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }

  async deleteServerServerUser(userId: string) {
    await this.sendServerRequest(
      `/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
  }

  async createServerContactChannel(
    data: ContactChannelsCrud['Server']['Create'],
  ): Promise<ContactChannelsCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      "/contact-channels",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await response.json();
  }

  async updateServerContactChannel(
    userId: string,
    contactChannelId: string,
    data: ContactChannelsCrud['Server']['Update'],
  ): Promise<ContactChannelsCrud['Server']['Read']> {
    const response = await this.sendServerRequest(
      `/contact-channels/${userId}/${contactChannelId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await response.json();
  }

  async deleteServerContactChannel(
    userId: string,
    contactChannelId: string,
  ): Promise<void> {
    await this.sendServerRequest(
      `/contact-channels/${userId}/${contactChannelId}`,
      {
        method: "DELETE",
      },
      null,
    );
  }

  async listServerContactChannels(
    userId: string,
  ): Promise<ContactChannelsCrud['Server']['Read'][]> {
    const response = await this.sendServerRequest(
      `/contact-channels?user_id=${userId}`,
      {
        method: "GET",
      },
      null,
    );
    const json = await response.json() as ContactChannelsCrud['Server']['List'];
    return json.items;
  }

  async sendServerContactChannelVerificationEmail(
    userId: string,
    contactChannelId: string,
    callbackUrl: string,
  ): Promise<Result<undefined, KnownErrors["EmailAlreadyVerified"]>> {
    const responseOrError = await this.sendServerRequestAndCatchKnownError(
      `/contact-channels/${userId}/${contactChannelId}/send-verification-code`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ callback_url: callbackUrl }),
      },
      null,
      [KnownErrors.EmailAlreadyVerified],
    );

    if (responseOrError.status === "error") {
      return Result.error(responseOrError.error);
    }
    return Result.ok(undefined);
  }
}
