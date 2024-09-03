// TODO next-release: Remove this file when we remove the dashboard API.
import { ReadonlyJson } from "@stackframe/stack-shared/dist/utils/json";

export type ServerTeamMemberJson = TeamMemberJson & {
  user: ServerUserJson;
};

export type ServerPermissionDefinitionCustomizableJson = {
  readonly id: string;
  readonly description?: string;
  readonly scope: PermissionDefinitionScopeJson;
  readonly containPermissionIds: string[];
};

export type ServerPermissionDefinitionJson = PermissionDefinitionJson &
  ServerPermissionDefinitionCustomizableJson & {
    readonly __databaseUniqueId: string;
    readonly scope: PermissionDefinitionScopeJson;
  };

export type ClientProjectJson = {
  id: string;
  credentialEnabled: boolean;
  magicLinkEnabled: boolean;
  oauthProviders: {
    id: string;
    enabled: boolean;
  }[];
};

export type ProjectJson = {
  id: string;
  displayName: string;
  description?: string;
  createdAtMillis: number;
  userCount: number;
  isProductionMode: boolean;
  evaluatedConfig: {
    id: string;
    allowLocalhost: boolean;
    credentialEnabled: boolean;
    magicLinkEnabled: boolean;
    oauthProviders: OAuthProviderConfigJson[];
    emailConfig?: EmailConfigJson;
    domains: DomainConfigJson[];
    createTeamOnSignUp: boolean;
    teamCreatorDefaultPermissions: PermissionDefinitionJson[];
    teamMemberDefaultPermissions: PermissionDefinitionJson[];
  };
};

export type OAuthProviderConfigJson = {
  id: string;
  enabled: boolean;
} & (
  | { type: SharedProvider }
  | {
      type: StandardProvider;
      clientId: string;
      clientSecret: string;
    }
);

export type EmailConfigJson =
  | {
      type: "standard";
      senderName: string;
      senderEmail: string;
      host: string;
      port: number;
      username: string;
      password: string;
    }
  | {
      type: "shared";
    };

export type DomainConfigJson = {
  domain: string;
  handlerPath: string;
};

export type OrglikeJson = {
  id: string;
  displayName: string;
  profileImageUrl?: string;
  createdAtMillis: number;
};

export type TeamJson = OrglikeJson;

export type OrganizationJson = OrglikeJson;

export type OrglikeCustomizableJson = Pick<OrglikeJson, "displayName" | "profileImageUrl">;
export type TeamCustomizableJson = OrglikeCustomizableJson;

export type TeamMemberJson = {
  userId: string;
  teamId: string;
  displayName: string | null;
};

export type PermissionDefinitionScopeJson = { type: "global" } | { type: "any-team" } | { type: "specific-team"; teamId: string };

export type PermissionDefinitionJson = {
  id: string;
  scope: PermissionDefinitionScopeJson;
};

export type OAuthProviderUpdateOptions = {
  id: string;
  enabled: boolean;
} & (
  | {
      type: SharedProvider;
    }
  | {
      type: StandardProvider;
      clientId: string;
      clientSecret: string;
    }
);

export type ProjectUpdateOptions = {
  displayName?: string;
  description?: string;
  isProductionMode?: boolean;
  config?: {
    domains?: {
      domain: string;
      handlerPath: string;
    }[];
    oauthProviders?: OAuthProviderUpdateOptions[];
    credentialEnabled?: boolean;
    magicLinkEnabled?: boolean;
    allowLocalhost?: boolean;
    createTeamOnSignUp?: boolean;
    emailConfig?: EmailConfigJson;
    teamCreatorDefaultPermissionIds?: string[];
    teamMemberDefaultPermissionIds?: string[];
  };
};

export type ApiKeySetBaseJson = {
  id: string;
  description: string;
  expiresAtMillis: number;
  manuallyRevokedAtMillis: number | null;
  createdAtMillis: number;
};

export type ApiKeySetFirstViewJson = ApiKeySetBaseJson & {
  publishableClientKey?: string;
  secretServerKey?: string;
  superSecretAdminKey?: string;
};

export type ApiKeySetJson = ApiKeySetBaseJson & {
  publishableClientKey: null | {
    lastFour: string;
  };
  secretServerKey: null | {
    lastFour: string;
  };
  superSecretAdminKey: null | {
    lastFour: string;
  };
};

export type ServerOrglikeCustomizableJson = Pick<ServerOrglikeJson, "displayName" | "profileImageUrl">;
export type ServerOrglikeJson = OrglikeJson & {};

export type ServerTeamCustomizableJson = ServerOrglikeCustomizableJson;
export type ServerTeamJson = ServerOrglikeJson;

type UserCustomizableJson = {
  displayName: string | null;
  clientMetadata: ReadonlyJson;
  selectedTeamId: string | null;
};

export type UserJson = UserCustomizableJson & {
  projectId: string;
  id: string;
  primaryEmail: string | null;
  primaryEmailVerified: boolean;
  displayName: string | null;
  clientMetadata: ReadonlyJson;
  profileImageUrl: string | null;
  signedUpAtMillis: number;
  /**
   * not used anymore, for backwards compatibility
   */
  authMethod: "credential" | "oauth";
  hasPassword: boolean;
  authWithEmail: boolean;
  oauthProviders: string[];
  selectedTeamId: string | null;
  selectedTeam: TeamJson | null;
};

export type UserUpdateJson = Partial<UserCustomizableJson>;

export type ServerUserJson = UserJson & {
  serverMetadata: ReadonlyJson;
};

export type ServerUserUpdateJson = UserUpdateJson & {
  serverMetadata?: ReadonlyJson;
  primaryEmail?: string | null;
  primaryEmailVerified?: boolean;
};

export type SharedProvider = "shared-github" | "shared-google" | "shared-facebook" | "shared-microsoft" | "shared-spotify";
export const sharedProviders = ["shared-github", "shared-google", "shared-facebook", "shared-microsoft", "shared-spotify"] as const;

export type StandardProvider = "github" | "facebook" | "google" | "microsoft" | "spotify";
export const standardProviders = ["github", "facebook", "google", "microsoft", "spotify"] as const;

export function toStandardProvider(provider: SharedProvider | StandardProvider): StandardProvider {
  return provider.replace("shared-", "") as StandardProvider;
}

export function toSharedProvider(provider: SharedProvider | StandardProvider): SharedProvider {
  return ("shared-" + provider) as SharedProvider;
}
