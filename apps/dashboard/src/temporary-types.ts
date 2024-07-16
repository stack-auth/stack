// TODO next-release: Remove this file when we remove the dashboard API.

import { SharedProvider, StandardProvider } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ApiKeysCrud } from "@stackframe/stack-shared/dist/interface/crud/api-keys";


export type ClientProjectJson = {
  id: string,
  credentialEnabled: boolean,
  magicLinkEnabled: boolean,
  oauthProviders: {
    id: string,
    enabled: boolean,
  }[],
};

export type ProjectJson = {
  id: string,
  displayName: string,
  description?: string,
  createdAtMillis: number,
  userCount: number,
  isProductionMode: boolean,
  evaluatedConfig: {
    id: string,
    allowLocalhost: boolean,
    credentialEnabled: boolean,
    magicLinkEnabled: boolean,
    oauthProviders: OAuthProviderConfigJson[],
    emailConfig?: EmailConfigJson,
    domains: DomainConfigJson[],
    createTeamOnSignUp: boolean,
    teamCreatorDefaultPermissions: PermissionDefinitionJson[],
    teamMemberDefaultPermissions: PermissionDefinitionJson[],
  },
};

export type OAuthProviderConfigJson = {
  id: string,
  enabled: boolean,
} & (
  | { type: SharedProvider }
  | {
    type: StandardProvider,
    clientId: string,
    clientSecret: string,
  }
);

export type EmailConfigJson = (
  {
    type: "standard",
    senderName: string,
    senderEmail: string,
    host: string,
    port: number,
    username: string,
    password: string,
  }
  | {
    type: "shared",
  }
);

export type DomainConfigJson = {
  domain: string,
  handlerPath: string,
}


export type OrglikeJson = {
  id: string,
  displayName: string,
  profileImageUrl?: string,
  createdAtMillis: number,
};

export type TeamJson = OrglikeJson;

export type OrganizationJson = OrglikeJson;

export type OrglikeCustomizableJson = Pick<OrglikeJson, "displayName" | "profileImageUrl">;
export type TeamCustomizableJson = OrglikeCustomizableJson;

export type TeamMemberJson = {
  userId: string,
  teamId: string,
  displayName: string | null,
}


export type PermissionDefinitionScopeJson =
  | { type: "global" }
  | { type: "any-team" }
  | { type: "specific-team", teamId: string };

export type PermissionDefinitionJson = {
  id: string,
  scope: PermissionDefinitionScopeJson,
};

export type OAuthProviderUpdateOptions = {
  id: string,
  enabled: boolean,
} & (
  | {
    type: SharedProvider,
  }
  | {
    type: StandardProvider,
    clientId: string,
    clientSecret: string,
  }
)

export type ProjectUpdateOptions = {
  displayName?: string,
  description?: string,
  isProductionMode?: boolean,
  config?: {
    domains?: {
      domain: string,
      handlerPath: string,
    }[],
    oauthProviders?: OAuthProviderUpdateOptions[],
    credentialEnabled?: boolean,
    magicLinkEnabled?: boolean,
    allowLocalhost?: boolean,
    createTeamOnSignUp?: boolean,
    emailConfig?: EmailConfigJson,
    teamCreatorDefaultPermissionIds?: string[],
    teamMemberDefaultPermissionIds?: string[],
  },
};

export type ApiKeySetJson = ApiKeysCrud["Admin"]["Read"] & {
  publishableClientKey: null | {
    lastFour: string,
  },
  secretServerKey: null | {
    lastFour: string,
  },
  superSecretAdminKey: null | {
    lastFour: string,
  },
};
