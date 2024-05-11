import React, { use, useCallback, useMemo } from "react";
import { KnownError, KnownErrors, OAuthProviderConfigJson, ServerUserJson, StackAdminInterface, StackClientInterface, StackServerInterface } from "@stackframe/stack-shared";
import { getCookie, setOrDeleteCookie } from "./cookie";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { AsyncResult, Result } from "@stackframe/stack-shared/dist/utils/results";
import { suspendIfSsr } from "@stackframe/stack-shared/dist/utils/react";
import { AsyncStore } from "@stackframe/stack-shared/dist/utils/stores";
import { ClientProjectJson, UserJson, TokenObject, TokenStore, ProjectJson, EmailConfigJson, DomainConfigJson, ReadonlyTokenStore, getProductionModeErrors, ProductionModeError, UserUpdateJson, TeamJson, PermissionDefinitionJson, PermissionDefinitionScopeJson, TeamMemberJson } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { isClient } from "../utils/next";
import { callOAuthCallback, signInWithOAuth } from "./auth";
import * as NextNavigation from "next/navigation";  // import the entire module to get around some static compiler warnings emitted by Next.js in some cases
import { ReadonlyJson } from "@stackframe/stack-shared/dist/utils/json";
import { constructRedirectUrl } from "../utils/url";
import { filterUndefined, omit } from "@stackframe/stack-shared/dist/utils/objects";
import { neverResolve, resolved, runAsynchronously, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { AsyncCache } from "@stackframe/stack-shared/dist/utils/caches";
import { ApiKeySetBaseJson, ApiKeySetCreateOptions, ApiKeySetFirstViewJson, ApiKeySetJson, ProjectUpdateOptions } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { suspend } from "@stackframe/stack-shared/dist/utils/react";
import { ServerPermissionDefinitionCustomizableJson, ServerPermissionDefinitionJson, ServerTeamCustomizableJson, ServerTeamJson, ServerTeamMemberJson, ServerUserUpdateJson } from "@stackframe/stack-shared/dist/interface/serverInterface";


export type TokenStoreOptions<HasTokenStore extends boolean = boolean> =
  HasTokenStore extends true ? "cookie" | "nextjs-cookie" | "memory" :
  HasTokenStore extends false ? null :
  TokenStoreOptions<true> | TokenStoreOptions<false>;

export type HandlerUrls = {
  handler: string,
  signIn: string,
  afterSignIn: string,
  signUp: string,
  afterSignUp: string,
  signOut: string,
  afterSignOut: string,
  emailVerification: string,
  passwordReset: string,
  forgotPassword: string,
  home: string,
  oauthCallback: string,
  magicLinkCallback: string,
  accountSettings: string,
}

type ProjectCurrentUser<ProjectId> = ProjectId extends "internal" ? CurrentInternalUser : CurrentUser;
type ProjectCurrentSeverUser<ProjectId> = ProjectId extends "internal" ? CurrentInternalServerUser : CurrentServerUser;

function permissionDefinitionScopeToType(scope: PermissionDefinitionScopeJson): 'team' | 'global' {
  return ({"any-team": "team", "specific-team": "team", "global": "global"} as const)[scope.type];
}

function getUrls(partial: Partial<HandlerUrls>): HandlerUrls {
  const handler = partial.handler ?? "/handler";
  return {
    handler,
    signIn: `${handler}/signin`,
    afterSignIn: "/",
    signUp: `${handler}/signup`,
    afterSignUp: "/",
    signOut: `${handler}/signout`,
    afterSignOut: "/",
    emailVerification: `${handler}/email-verification`,
    passwordReset: `${handler}/password-reset`,
    forgotPassword: `${handler}/forgot-password`,
    oauthCallback: `${handler}/oauth-callback`,
    magicLinkCallback: `${handler}/magic-link-callback`,
    home: "/",
    accountSettings: `${handler}/account-settings`,
    ...filterUndefined(partial),
  };
}

function getDefaultProjectId() {
  return process.env.NEXT_PUBLIC_STACK_PROJECT_ID || throwErr("Welcome to Stack! It seems that you haven't provided a project ID. Please create a project on the Stack dashboard at https://app.stack-auth.com and put it in the NEXT_PUBLIC_STACK_PROJECT_ID environment variable.");
}

function getDefaultPublishableClientKey() {
  return process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || throwErr("Welcome to Stack! It seems that you haven't provided a publishable client key. Please create an API key for your project on the Stack dashboard at https://app.stack-auth.com and copy your publishable client key into the NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY environment variable.");
}

function getDefaultSecretServerKey() {
  return process.env.STACK_SECRET_SERVER_KEY || throwErr("No secret server key provided. Please copy your key from the Stack dashboard and put your it in the STACK_SECRET_SERVER_KEY environment variable.");
}

function getDefaultSuperSecretAdminKey() {
  return process.env.STACK_SUPER_SECRET_ADMIN_KEY || throwErr("No super secret admin key provided. Please copy your key from the Stack dashboard and put it in the STACK_SUPER_SECRET_ADMIN_KEY environment variable.");
}

function getDefaultBaseUrl() {
  return process.env.NEXT_PUBLIC_STACK_URL || defaultBaseUrl;
}

export type StackClientAppConstructorOptions<HasTokenStore extends boolean, ProjectId extends string> = {
  baseUrl?: string,
  projectId?: ProjectId,
  publishableClientKey?: string,
  urls?: Partial<HandlerUrls>,

  // we intersect with TokenStoreOptions in the beginning to make TypeScript error messages easier to read
  tokenStore: TokenStoreOptions<HasTokenStore>,
};

export type StackServerAppConstructorOptions<HasTokenStore extends boolean, ProjectId extends string> = StackClientAppConstructorOptions<HasTokenStore, ProjectId> & {
  secretServerKey?: string,
};

export type StackAdminAppConstructorOptions<HasTokenStore extends boolean, ProjectId extends string> = (
  | (
    & StackServerAppConstructorOptions<HasTokenStore, ProjectId>
    & {
      superSecretAdminKey?: string,
    }
  )
  | (
    & Omit<StackServerAppConstructorOptions<HasTokenStore, ProjectId>, "publishableClientKey" | "secretServerKey">
    & {
      projectOwnerTokens: ReadonlyTokenStore,
    }
  )
);

export type StackClientAppJson<HasTokenStore extends boolean, ProjectId extends string> = StackClientAppConstructorOptions<HasTokenStore, ProjectId> & {
  uniqueIdentifier: string,
  // note: if you add more fields here, make sure to ensure the checkString in the constructor has/doesn't have them
};

const defaultBaseUrl = "https://app.stack-auth.com";

function createEmptyTokenStore() {
  const store = new AsyncStore<TokenObject>();
  store.set({
    refreshToken: null,
    accessToken: null,
  });
  return store;
}

const memoryTokenStore = createEmptyTokenStore();
let cookieTokenStore: TokenStore | null = null;
const cookieTokenStoreInitializer = (): TokenStore => {
  if (!isClient()) {
    throw new Error("Cannot use cookie token store on the server!");
  }

  if (cookieTokenStore === null) {
    cookieTokenStore = new AsyncStore<TokenObject>();
    let hasSucceededInWriting = true;

    setInterval(() => {
      if (hasSucceededInWriting) {
        const newValue = {
          refreshToken: getCookie('stack-refresh'),
          accessToken: getCookie('stack-access'),
        };
        const res = cookieTokenStore!.get();
        if (res.status !== "ok"
          || res.data.refreshToken !== newValue.refreshToken
          || res.data.accessToken !== newValue.accessToken
        ) {
          cookieTokenStore!.set(newValue);
        }
      }
    }, 10);
    cookieTokenStore.onChange((value) => {
      try {
        setOrDeleteCookie('stack-refresh', value.refreshToken, { maxAge: 60 * 60 * 24 * 365 });
        setOrDeleteCookie('stack-access', value.accessToken, { maxAge: 60 * 60 * 24 });
        hasSucceededInWriting = true;
      } catch (e) {
        hasSucceededInWriting = false;
      }
    });
  }

  return cookieTokenStore;
};

const tokenStoreInitializers = new Map<TokenStoreOptions, () => TokenStore>([
  ["cookie", cookieTokenStoreInitializer],
  ["nextjs-cookie", () => {
    if (isClient()) {
      return cookieTokenStoreInitializer();
    } else {
      const store = new AsyncStore<TokenObject>();
      store.set({
        refreshToken: getCookie('stack-refresh'),
        accessToken: getCookie('stack-access'),
      });
      store.onChange((value) => {
        try {
          setOrDeleteCookie('stack-refresh', value.refreshToken, { maxAge: 60 * 60 * 24 * 365 });
          setOrDeleteCookie('stack-access', value.accessToken, { maxAge: 60 * 60 * 24 });
        } catch (e) {
          // ignore
        }
      });
      return store;
    }
  }],
  ["memory", () => memoryTokenStore],
  [null, () => createEmptyTokenStore()],
]);
function getTokenStore(tokenStoreOptions: TokenStoreOptions) {
  return (tokenStoreInitializers.get(tokenStoreOptions) ?? throwErr(`Invalid token store ${tokenStoreOptions}`))();
}

const loadingSentinel = Symbol("stackAppCacheLoadingSentinel");
function useCache<D extends any[], T>(cache: AsyncCache<D, T>, dependencies: D, caller: string): T {
  // we explicitly don't want to run this hook in SSR
  suspendIfSsr(caller);

  const subscribe = useCallback((cb: () => void) => {
    const { unsubscribe } = cache.onChange(dependencies, () => cb());
    return unsubscribe;
  }, [cache, ...dependencies]);
  const getSnapshot = useCallback(() => {
    return AsyncResult.or(cache.getIfCached(dependencies), loadingSentinel);
  }, [cache, ...dependencies]);

  // note: we must use React.useSyncExternalStore instead of importing the function directly, as it will otherwise
  // throw an error ("can't import useSyncExternalStore from the server")
  const value = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (value === loadingSentinel) {
    return use(cache.getOrWait(dependencies, "read-write"));
  } else {
    // still need to call `use` because React expects the control flow to not change across two re-renders with the same props/state and it detects that by hook invocations (including `use`)
    return use(resolved(value));
  }
}

export const stackAppInternalsSymbol = Symbol.for("StackAppInternals");

const allClientApps = new Map<string, [checkString: string, app: StackClientApp<any, any>]>();

const createCache = <D extends any[], T>(fetcher: (dependencies: D) => Promise<T>) => {
  return new AsyncCache<D, T>(
    async (dependencies) => await fetcher(dependencies),
    {},
  );
};

// note that we intentionally use TokenStore (a reference type) as a key instead of a stringified version of it, as different token stores with the same tokens should be treated differently
// (if we wouldn't , we would cache users across requests on the server, which may cause issues)
const createCacheByTokenStore = <D extends any[], T>(fetcher: (tokenStore: TokenStore, extraDependencies: D) => Promise<T> ) => {
  return new AsyncCache<[TokenStore, ...D], T>(
    async ([tokenStore, ...extraDependencies]) => await fetcher(tokenStore, extraDependencies),
    {
      onSubscribe: ([tokenStore], refresh) => {
        // TODO find a *clean* way to not refresh when the token change was made inside the fetcher (for example due to expired access token)
        const handlerObj = tokenStore.onChange((newValue, oldValue) => {
          if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
          refresh();
        });
        return () => handlerObj.unsubscribe();
      },
    },
  );
};


class _StackClientAppImpl<HasTokenStore extends boolean, ProjectId extends string = string> {
  protected readonly _uniqueIdentifier: string;
  protected _interface: StackClientInterface;
  protected readonly _tokenStoreOptions: TokenStoreOptions<HasTokenStore>;
  protected readonly _urlOptions: Partial<HandlerUrls>;

  private readonly __DEMO_ENABLE_SLIGHT_FETCH_DELAY = false;

  private readonly _currentUserCache = createCacheByTokenStore(async (tokenStore) => {
    if (this.__DEMO_ENABLE_SLIGHT_FETCH_DELAY) {
      await wait(2000);
    }
    const user = await this._interface.getClientUserByToken(tokenStore);
    return Result.or(user, null);
  });
  private readonly _currentProjectCache = createCache(async () => {
    return Result.orThrow(await this._interface.getClientProject());
  });
  private readonly _ownedProjectsCache = createCacheByTokenStore(async (tokenStore) => {
    return await this._interface.listProjects(tokenStore);
  });
  private readonly _currentUserPermissionsCache = createCacheByTokenStore<
    [string, 'team' | 'global', boolean], 
    PermissionDefinitionJson[]
  >(async (tokenStore, [teamId, type, direct]) => {
    return await this._interface.listClientUserTeamPermissions({ teamId, type, direct }, tokenStore);
  });
  private readonly _currentUserTeamsCache = createCacheByTokenStore(async (tokenStore) => {
    return await this._interface.listClientUserTeams(tokenStore);
  });

  constructor(options:
    & {
      uniqueIdentifier?: string,
      checkString?: string,
    }
    & (
      | StackClientAppConstructorOptions<HasTokenStore, ProjectId>
      | Pick<StackClientAppConstructorOptions<HasTokenStore, ProjectId>, "tokenStore" | "urls"> & {
        interface: StackClientInterface,
      }
    )
  ) {
    if ("interface" in options) {
      this._interface = options.interface;
    } else {
      this._interface = new StackClientInterface({
        baseUrl: options.baseUrl ?? getDefaultBaseUrl(),
        projectId: options.projectId ?? getDefaultProjectId(),
        publishableClientKey: options.publishableClientKey ?? getDefaultPublishableClientKey(),
      });
    }

    this._tokenStoreOptions = options.tokenStore;
    this._urlOptions = options.urls ?? {};

    this._uniqueIdentifier = options.uniqueIdentifier ?? generateUuid();
    if (allClientApps.has(this._uniqueIdentifier)) {
      throw new StackAssertionError("A Stack client app with the same unique identifier already exists");
    }
    allClientApps.set(this._uniqueIdentifier, [options.checkString ?? "default check string", this]);
  }

  protected hasPersistentTokenStore(): this is StackClientApp<true, ProjectId> {
    return this._tokenStoreOptions !== null;
  }

  protected _ensurePersistentTokenStore(): asserts this is StackClientApp<true, ProjectId>  {
    if (!this.hasPersistentTokenStore()) {
      throw new Error("Cannot call this function on a Stack app without a persistent token store. Make sure the tokenStore option is set to a non-null value when initializing Stack.");
    }
  }

  protected isInternalProject(): this is { projectId: "internal" } {
    return this.projectId === "internal";
  }

  protected _ensureInternalProject(): asserts this is { projectId: "internal" } {
    if (!this.isInternalProject()) {
      throw new Error("Cannot call this function on a Stack app with a project ID other than 'internal'.");
    }
  }

  protected _permissionFromJson(json: PermissionDefinitionJson): Permission {
    const type = permissionDefinitionScopeToType(json.scope);
  
    if (type === 'team') {
      return {
        id: json.id,
        type,
        teamId: (json.scope as { teamId: string }).teamId,
      };
    } else {
      return {
        id: json.id,
        type,
      };
    }
  }

  protected _teamFromJson(json: TeamJson): Team {
    return {
      id: json.id,
      displayName: json.displayName,
      createdAt: new Date(json.createdAtMillis),
      toJson() {
        return json;
      },
    };
  }

  protected _userFromJson(json: UserJson): User {
    const app = this;
    return {
      projectId: json.projectId,
      id: json.id,
      displayName: json.displayName,
      primaryEmail: json.primaryEmail,
      primaryEmailVerified: json.primaryEmailVerified,
      profileImageUrl: json.profileImageUrl,
      signedUpAt: new Date(json.signedUpAtMillis),
      clientMetadata: json.clientMetadata,
      authMethod: json.authMethod,
      hasPassword: json.hasPassword,
      authWithEmail: json.authWithEmail,
      oauthProviders: json.oauthProviders,
      async getTeam(teamId: string) {
        const teams = await this.listTeams();
        return teams.find((t) => t.id === teamId) ?? null;
      },
      useTeam(teamId: string) {
        const teams = this.useTeams();
        return useMemo(() => {
          return teams.find((t) => t.id === teamId) ?? null;
        }, [teams, teamId]);
      },
      onTeamChange(teamId: string, callback: (team: Team | null) => void) {
        return this.onTeamsChange((teams) => {
          // TODO only call callback if the team actually changed
          const team = teams.find((t) => t.id === teamId) ?? null;
          callback(team);
        });
      },
      async listTeams() {
        const teams = await app._currentUserTeamsCache.getOrWait([getTokenStore(app._tokenStoreOptions)], "write-only");
        return teams.map((json) => app._teamFromJson(json));
      },
      useTeams() {
        const teams = useCache(app._currentUserTeamsCache, [getTokenStore(app._tokenStoreOptions)], "user.useTeams()");
        return useMemo(() => teams.map((json) => app._teamFromJson(json)), [teams]);
      },
      onTeamsChange(callback: (value: Team[], oldValue: Team[] | undefined) => void) {
        return app._currentUserTeamsCache.onChange([getTokenStore(app._tokenStoreOptions)], (value, oldValue) => {
          callback(value.map((json) => app._teamFromJson(json)), oldValue?.map((json) => app._teamFromJson(json)));
        });
      },
      async listPermissions(scope: Team, options?: { direct?: boolean }): Promise<Permission[]> {
        const permissions = await app._currentUserPermissionsCache.getOrWait([getTokenStore(app._tokenStoreOptions), scope.id, 'team', !!options?.direct], "write-only");
        return permissions.map((json) => app._permissionFromJson(json));
      },
      usePermissions(scope: Team, options?: { direct?: boolean }): Permission[] {
        const permissions = useCache(app._currentUserPermissionsCache, [getTokenStore(app._tokenStoreOptions), scope.id, 'team', !!options?.direct], "user.usePermissions()");
        return useMemo(() => permissions.map((json) => app._permissionFromJson(json)), [permissions]);
      },
      usePermission(scope: Team, permissionId: string): Permission | null {
        const permissions = this.usePermissions(scope);
        return useMemo(() => permissions.find((p) => p.id === permissionId) ?? null, [permissions, permissionId]);
      },
      async getPermission(scope: Team, permissionId: string): Promise<Permission | null> {
        const permissions = await this.listPermissions(scope);
        return permissions.find((p) => p.id === permissionId) ?? null;
      },
      async hasPermission(scope: Team, permissionId: string): Promise<boolean> {
        const permissions = await this.listPermissions(scope);
        return permissions.some((p) => p.id === permissionId);
      },
      toJson() {
        return json;
      },
    };
  }

  protected _teamMemberFromJson(json: TeamMemberJson): TeamMember;
  protected _teamMemberFromJson(json: TeamMemberJson | null): TeamMember | null;
  protected _teamMemberFromJson(json: TeamMemberJson): TeamMember | null {
    if (json === null) return null;
    return {
      teamId: json.teamId,
      userId: json.userId,
      displayName: json.displayName,
    };
  }

  protected _currentUserFromJson(json: UserJson, tokenStore: TokenStore): ProjectCurrentUser<ProjectId>;
  protected _currentUserFromJson(json: UserJson | null, tokenStore: TokenStore): ProjectCurrentUser<ProjectId> | null;
  protected _currentUserFromJson(json: UserJson | null, tokenStore: TokenStore): ProjectCurrentUser<ProjectId> | null {
    if (json === null) return null;
    const app = this;
    const currentUser: CurrentUser = {
      ...this._userFromJson(json),
      tokenStore,
      update(update) {
        return app._updateUser(update, tokenStore);
      },
      signOut() {
        return app._signOut(tokenStore);
      },
      sendVerificationEmail() {
        return app._sendVerificationEmail(tokenStore);
      },
      updatePassword(options: { oldPassword: string, newPassword: string}) {
        return app._updatePassword(options, tokenStore);
      },
    };
    if (this.isInternalProject()) {
      const internalUser: CurrentInternalUser = {
        ...currentUser,
        createProject(newProject: ProjectUpdateOptions & { displayName: string }) {
          return app._createProject(newProject);
        },
        listOwnedProjects() {
          return app._listOwnedProjects();
        },
        useOwnedProjects() {
          return app._useOwnedProjects();
        },
        onOwnedProjectsChange(callback: (projects: Project[]) => void) {
          return app._onOwnedProjectsChange(callback);
        }
      };
      Object.freeze(internalUser);
      return internalUser;
    } else {
      Object.freeze(currentUser);
      return currentUser as any;
    }
  }

  protected _userToJson(user: User): UserJson {
    return {
      projectId: user.projectId,
      id: user.id,
      displayName: user.displayName,
      primaryEmail: user.primaryEmail,
      primaryEmailVerified: user.primaryEmailVerified,
      profileImageUrl: user.profileImageUrl,
      signedUpAtMillis: user.signedUpAt.getTime(),
      clientMetadata: user.clientMetadata,
      authMethod: user.authMethod,
      hasPassword: user.hasPassword,
      authWithEmail: user.authWithEmail,
      oauthProviders: user.oauthProviders,
    };
  }

  protected _projectAdminFromJson(data: ProjectJson, adminInterface: StackAdminInterface, onRefresh: () => Promise<void>): Project {
    if (data.id !== adminInterface.projectId) {
      throw new Error(`The project ID of the provided project JSON (${data.id}) does not match the project ID of the app (${adminInterface.projectId})! This is a Stack bug.`);
    }

    return {
      id: data.id,
      displayName: data.displayName,
      description: data.description,
      createdAt: new Date(data.createdAtMillis),
      userCount: data.userCount,
      isProductionMode: data.isProductionMode,
      evaluatedConfig: {
        id: data.evaluatedConfig.id,
        credentialEnabled: data.evaluatedConfig.credentialEnabled,
        magicLinkEnabled: data.evaluatedConfig.magicLinkEnabled,
        allowLocalhost: data.evaluatedConfig.allowLocalhost,
        oauthProviders: data.evaluatedConfig.oauthProviders,
        emailConfig: data.evaluatedConfig.emailConfig,
        domains: data.evaluatedConfig.domains,
        createTeamOnSignUp: data.evaluatedConfig.createTeamOnSignUp,
      },

      async update(update: ProjectUpdateOptions) {
        await adminInterface.updateProject(update);
        await onRefresh();
      },

      toJson() {
        return data;
      },

      getProductionModeErrors() {
        return getProductionModeErrors(this.toJson());
      },
    };
  }

  protected _createAdminInterface(forProjectId: string, tokenStore: TokenStore): StackAdminInterface {
    return new StackAdminInterface({
      baseUrl: this._interface.options.baseUrl,
      projectId: forProjectId,
      projectOwnerTokens: tokenStore,
    });
  }

  get projectId(): ProjectId {
    return this._interface.projectId as ProjectId;
  }

  get urls(): Readonly<HandlerUrls> {
    return getUrls(this._urlOptions);
  }

  protected async _redirectTo(handlerName: keyof HandlerUrls) {
    if (!this.urls[handlerName]) {
      throw new Error(`No URL for handler name ${handlerName}`);
    }
    window.location.href = this.urls[handlerName];
    return await wait(2000);
  }

  async redirectToSignIn() { return await this._redirectTo("signIn"); }
  async redirectToSignUp() { return await this._redirectTo("signUp"); }
  async redirectToSignOut() { return await this._redirectTo("signOut"); }
  async redirectToEmailVerification() { return await this._redirectTo("emailVerification"); }
  async redirectToPasswordReset() { return await this._redirectTo("passwordReset"); }
  async redirectToForgotPassword() { return await this._redirectTo("forgotPassword"); }
  async redirectToHome() { return await this._redirectTo("home"); }
  async redirectToOAuthCallback() { return await this._redirectTo("oauthCallback"); }
  async redirectToMagicLinkCallback() { return await this._redirectTo("magicLinkCallback"); }
  async redirectToAfterSignIn() { return await this._redirectTo("afterSignIn"); }
  async redirectToAfterSignUp() { return await this._redirectTo("afterSignUp"); }
  async redirectToAfterSignOut() { return await this._redirectTo("afterSignOut"); }
  async redirectToAccountSettings() { return await this._redirectTo("accountSettings"); }

  async sendForgotPasswordEmail(email: string): Promise<KnownErrors["UserNotFound"] | undefined> {
    const redirectUrl = constructRedirectUrl(this.urls.passwordReset);
    const error = await this._interface.sendForgotPasswordEmail(email, redirectUrl);
    return error;
  }

  async sendMagicLinkEmail(email: string): Promise<KnownErrors["RedirectUrlNotWhitelisted"] | undefined> {
    const magicLinkRedirectUrl = constructRedirectUrl(this.urls.magicLinkCallback);
    const error = await this._interface.sendMagicLinkEmail(email, magicLinkRedirectUrl);
    return error;
  }

  async resetPassword(options: { password: string, code: string }): Promise<KnownErrors["PasswordResetError"] | undefined> {
    const error = await this._interface.resetPassword(options);
    return error;
  }

  async verifyPasswordResetCode(code: string): Promise<KnownErrors["PasswordResetCodeError"] | undefined> {
    return await this._interface.verifyPasswordResetCode(code);
  }

  async verifyEmail(code: string): Promise<KnownErrors["EmailVerificationError"] | undefined> {
    return await this._interface.verifyEmail(code);
  }

  async getUser(options: GetUserOptions & { or: 'redirect' }): Promise<ProjectCurrentUser<ProjectId>>;
  async getUser(options: GetUserOptions & { or: 'throw' }): Promise<ProjectCurrentUser<ProjectId>>;
  async getUser(options?: GetUserOptions): Promise<ProjectCurrentUser<ProjectId> | null>;
  async getUser(options?: GetUserOptions): Promise<ProjectCurrentUser<ProjectId> | null> {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = await this._currentUserCache.getOrWait([tokenStore], "write-only");

    if (userJson === null) {
      switch (options?.or) {
        case 'redirect': {
          NextNavigation.redirect(this.urls.signIn, NextNavigation.RedirectType.replace);
          throw new Error("redirect should never return!");
        }
        case 'throw': {
          throw new Error("User is not signed in but getUser was called with { or: 'throw' }");
        }
        default: {
          return null;
        }
      }
    }

    return this._currentUserFromJson(userJson, tokenStore);
  }

  useUser(options: GetUserOptions & { or: 'redirect' }): ProjectCurrentUser<ProjectId>;
  useUser(options: GetUserOptions & { or: 'throw' }): ProjectCurrentUser<ProjectId>;
  useUser(options?: GetUserOptions): ProjectCurrentUser<ProjectId> | null;
  useUser(options?: GetUserOptions): ProjectCurrentUser<ProjectId> | null {
    this._ensurePersistentTokenStore();

    const router = NextNavigation.useRouter();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = useCache(this._currentUserCache, [tokenStore], "useUser()");

    if (userJson === null) {
      switch (options?.or) {
        case 'redirect': {
          router.replace(this.urls.signIn);
          suspend();
          throw new StackAssertionError("suspend should never return");
        }
        case 'throw': {
          throw new Error("User is not signed in but useUser was called with { or: 'throw' }");
        }
        case undefined:
        case "return-null": {
          // do nothing
        }
      }
    }

    return useMemo(() => {
      return this._currentUserFromJson(userJson, tokenStore);
    }, [userJson, tokenStore, options?.or]);
  }

  onUserChange(callback: (user: CurrentUser | null) => void) {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    return this._currentUserCache.onChange([tokenStore], (userJson) => {
      callback(this._currentUserFromJson(userJson, tokenStore));
    });
  }

  protected async _updateUser(update: UserUpdateJson, tokenStore: TokenStore) {
    const res = await this._interface.setClientUserCustomizableData(update, tokenStore);
    await this._refreshUser(tokenStore);
    return res;
  }

  async signInWithOAuth(provider: string) {
    this._ensurePersistentTokenStore();
    await signInWithOAuth(this._interface, { provider, redirectUrl: this.urls.oauthCallback });
  }

  async signInWithCredential(options: {
    email: string,
    password: string,
  }): Promise<KnownErrors["EmailPasswordMismatch"] | undefined> {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const errorCode = await this._interface.signInWithCredential(options.email, options.password, tokenStore);
    if (!errorCode) {
      window.location.assign(this.urls.afterSignIn);
    }
    return errorCode;
  }

  async signUpWithCredential(options: {
    email: string,
    password: string,
  }): Promise<KnownErrors["UserEmailAlreadyExists"] | undefined>{
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const emailVerificationRedirectUrl = constructRedirectUrl(this.urls.emailVerification);
    const errorCode = await this._interface.signUpWithCredential(
      options.email, 
      options.password, 
      emailVerificationRedirectUrl, 
      tokenStore
    );
    if (!errorCode) {
      window.location.assign(this.urls.afterSignUp);
    }
    return errorCode;
  }

  async signInWithMagicLink(code: string): Promise<KnownErrors["MagicLinkError"] | undefined> {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const result = await this._interface.signInWithMagicLink(code, tokenStore);
    if (result instanceof KnownError) {
      return result;
    }
    if (result.newUser) {
      window.location.replace(this.urls.afterSignUp);
    } else {
      window.location.replace(this.urls.afterSignIn);
    }
    await neverResolve();
  }

  async callOAuthCallback() {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const result = await callOAuthCallback(this._interface, tokenStore, this.urls.oauthCallback);
    if (result) {
      if (result.newUser) {
        window.location.replace(this.urls.afterSignUp);
      } else {
        window.location.replace(this.urls.afterSignIn);
      }
    }
    await neverResolve();
  }

  protected async _signOut(tokenStore: TokenStore): Promise<void> {
    await this._interface.signOut(tokenStore);
    window.location.assign(this.urls.afterSignOut);
  }

  protected async _sendVerificationEmail(tokenStore: TokenStore): Promise<KnownErrors["EmailAlreadyVerified"] | undefined> {
    const emailVerificationRedirectUrl = constructRedirectUrl(this.urls.emailVerification);
    return await this._interface.sendVerificationEmail(emailVerificationRedirectUrl, tokenStore);
  }

  protected async _updatePassword(
    options: { oldPassword: string, newPassword: string }, 
    tokenStore: TokenStore
  ): Promise<KnownErrors["PasswordMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | undefined> {
    return await this._interface.updatePassword(options, tokenStore);
  }

  async signOut(): Promise<void> {
    const user = await this.getUser();
    if (user) {
      await user.signOut();
    }
  }

  async getProject(): Promise<ClientProjectJson> {
    return await this._currentProjectCache.getOrWait([], "write-only");
  }

  useProject(): ClientProjectJson {
    return useCache(this._currentProjectCache, [], "useProject()");
  }

  onProjectChange(callback: (project: ClientProjectJson) => void) {
    return this._currentProjectCache.onChange([], callback);
  }

  protected async _listOwnedProjects(): Promise<Project[]> {
    this._ensureInternalProject();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const json = await this._ownedProjectsCache.getOrWait([tokenStore], "write-only");
    return json.map((j) => this._projectAdminFromJson(
      j,
      this._createAdminInterface(j.id, tokenStore),
      () => this._refreshOwnedProjects(tokenStore),
    ));
  }

  protected _useOwnedProjects(): Project[] {
    this._ensureInternalProject();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const json = useCache(this._ownedProjectsCache, [tokenStore], "useOwnedProjects()");
    return useMemo(() => json.map((j) => this._projectAdminFromJson(
      j,
      this._createAdminInterface(j.id, tokenStore),
      () => this._refreshOwnedProjects(tokenStore),
    )), [json]);
  }

  protected _onOwnedProjectsChange(callback: (projects: Project[]) => void) {
    this._ensureInternalProject();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    return this._ownedProjectsCache.onChange([tokenStore], (projects) => {
      callback(projects.map((j) => this._projectAdminFromJson(
        j,
        this._createAdminInterface(j.id, tokenStore),
        () => this._refreshOwnedProjects(tokenStore),
      )));
    });
  }

  protected async _createProject(newProject: ProjectUpdateOptions & { displayName: string }): Promise<Project> {
    this._ensureInternalProject();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const json = await this._interface.createProject(newProject, tokenStore);
    const res = this._projectAdminFromJson(
      json,
      this._createAdminInterface(json.id, tokenStore),
      () => this._refreshOwnedProjects(tokenStore),
    );
    await this._refreshOwnedProjects(tokenStore);
    return res;
  }

  protected async _refreshUser(tokenStore: TokenStore) {
    await this._currentUserCache.refresh([tokenStore]);
  }

  protected async _refreshUsers() {
    // nothing yet
  }
  
  protected async _refreshProject() {
    await this._currentProjectCache.refresh([]);
  }

  protected async _refreshOwnedProjects(tokenStore: TokenStore) {
    await this._ownedProjectsCache.refresh([tokenStore]);
  }

  static get [stackAppInternalsSymbol]() {
    return {
      fromClientJson: <HasTokenStore extends boolean, ProjectId extends string>(
        json: StackClientAppJson<HasTokenStore, ProjectId>
      ): StackClientApp<HasTokenStore, ProjectId> => {
        const providedCheckString = JSON.stringify(omit(json, [/* none currently */]));
        const existing = allClientApps.get(json.uniqueIdentifier);
        if (existing) {
          const [existingCheckString, clientApp] = existing;
          if (existingCheckString !== providedCheckString) {
            throw new StackAssertionError("The provided app JSON does not match the configuration of the existing client app with the same unique identifier", { providedObj: json, existingString: existingCheckString });
          }
          return clientApp as any;
        }

        return new _StackClientAppImpl<HasTokenStore, ProjectId>({
          ...json,
          checkString: providedCheckString,
        });
      }
    };
  }

  get [stackAppInternalsSymbol]() {
    return {
      toClientJson: (): StackClientAppJson<HasTokenStore, ProjectId> => {
        if (!("publishableClientKey" in this._interface.options)) {
          // TODO find a way to do this
          throw Error("Cannot serialize to JSON from an application without a publishable client key");
        }

        return {
          baseUrl: this._interface.options.baseUrl,
          projectId: this.projectId,
          publishableClientKey: this._interface.options.publishableClientKey,
          tokenStore: this._tokenStoreOptions,
          urls: this._urlOptions,
          uniqueIdentifier: this._uniqueIdentifier,
        };
      },
      setCurrentUser: (userJsonPromise: Promise<UserJson | null>) => {
        runAsynchronously(this._currentUserCache.forceSetCachedValueAsync([getTokenStore(this._tokenStoreOptions)], userJsonPromise));
      },
    };
  };
}

class _StackServerAppImpl<HasTokenStore extends boolean, ProjectId extends string> extends _StackClientAppImpl<HasTokenStore, ProjectId>
{
  declare protected _interface: StackServerInterface;

  // TODO override the client user cache to use the server user cache, so we save some requests
  private readonly _currentServerUserCache = createCacheByTokenStore(async (tokenStore) => {
    const user = await this._interface.getServerUserByToken(tokenStore);
    return Result.or(user, null);
  });
  private readonly _serverUsersCache = createCache(async () => {
    return await this._interface.listUsers();
  });
  private readonly _serverUserCache = createCache<string[], ServerUserJson | null>(async ([userId]) => {
    const user = await this._interface.getServerUserById(userId);
    return Result.or(user, null);
  });
  private readonly _serverTeamsCache = createCache(async () => {
    return await this._interface.listTeams();
  });
  private readonly _serverTeamMembersCache = createCache<string[], TeamMemberJson[]>(async ([teamId]) => {
    return await this._interface.listTeamMembers(teamId);
  });
  private readonly _serverTeamPermissionDefinitionsCache = createCache(async () => {
    return await this._interface.listPermissionDefinitions();
  });
  private readonly _serverTeamUserPermissionsCache = createCache<
    [string, string, 'team' | 'global', boolean], 
    ServerPermissionDefinitionJson[]
  >(async ([teamId, userId, type, direct]) => {
    return await this._interface.listTeamMemberPermissions({ teamId, userId, type, direct });
  });


  constructor(options: 
    | StackServerAppConstructorOptions<HasTokenStore, ProjectId>
    | {
      interface: StackServerInterface,
      tokenStore: TokenStoreOptions<HasTokenStore>,
      urls: Partial<HandlerUrls> | undefined,
    }
  ) {
    if ("interface" in options) {
      super({
        interface: options.interface,
        tokenStore: options.tokenStore,
        urls: options.urls,
      });
    } else {
      super({
        interface: new StackServerInterface({
          baseUrl: options.baseUrl ?? getDefaultBaseUrl(),
          projectId: options.projectId ?? getDefaultProjectId(),
          publishableClientKey: options.publishableClientKey ?? getDefaultPublishableClientKey(),
          secretServerKey: options.secretServerKey ?? getDefaultSecretServerKey(),
        }),
        tokenStore: options.tokenStore,
        urls: options.urls ?? {},
      });
    }
  }

  protected _serverUserFromJson(json: ServerUserJson): ServerUser;
  protected _serverUserFromJson(json: ServerUserJson | null): ServerUser | null;
  protected _serverUserFromJson(json: ServerUserJson | null): ServerUser | null {
    if (json === null) return null;
    const app = this;
    return {
      ...this._userFromJson(json),
      serverMetadata: json.serverMetadata,
      async delete() {
        const res = await app._interface.deleteServerUser(this.id);
        await app._refreshUsers();
        return res;
      },
      async update(update: ServerUserUpdateJson) {
        const res = await app._interface.setServerUserCustomizableData(this.id, update);
        await app._refreshUsers();
        return res;
      },
      getClientUser() {
        return app._userFromJson(json);
      },
      async grantPermission(scope: Team, permissionId: string): Promise<void> {
        await app._interface.grantTeamUserPermission(scope.id, json.id, permissionId, 'team');
        for (const direct of [true, false]) {
          await app._serverTeamUserPermissionsCache.refresh([scope.id, json.id, 'team', direct]);
        }
      },
      async revokePermission(scope: Team, permissionId: string): Promise<void> {
        await app._interface.revokeTeamUserPermission(scope.id, json.id, permissionId, 'team');
        for (const direct of [true, false]) {
          await app._serverTeamUserPermissionsCache.refresh([scope.id, json.id, 'team', direct]);
        }
      },
      async getTeam(teamId: string) {
        const teams = await this.listTeams();
        return teams.find((t) => t.id === teamId) ?? null;
      },
      useTeam(teamId: string) {
        const teams = this.useTeams();
        return useMemo(() => {
          return teams.find((t) => t.id === teamId) ?? null;
        }, [teams, teamId]);
      },
      onTeamChange(teamId: string, callback: (team: ServerTeam | null) => void) {
        return this.onTeamsChange((teams) => {
          // TODO only call callback if the team actually changed
          const team = teams.find((t) => t.id === teamId) ?? null;
          callback(team);
        });
      },
      async listTeams() {
        const teams = await app._serverTeamsCache.getOrWait([getTokenStore(app._tokenStoreOptions)], "write-only");
        return teams.map((json) => app._serverTeamFromJson(json));
      },
      useTeams() {
        const teams = useCache(app._serverTeamsCache, [getTokenStore(app._tokenStoreOptions)], "user.useTeams()");
        return useMemo(() => teams.map((json) => app._serverTeamFromJson(json)), [teams]);
      },
      onTeamsChange(callback: (value: ServerTeam[], oldValue: ServerTeam[] | undefined) => void) {
        return app._serverTeamsCache.onChange([getTokenStore(app._tokenStoreOptions)], (value, oldValue) => {
          callback(value.map((json) => app._serverTeamFromJson(json)), oldValue?.map((json) => app._serverTeamFromJson(json)));
        });
      },
      async listPermissions(scope: Team, options?: { direct?: boolean }): Promise<ServerPermission[]> {
        const permissions = await app._serverTeamUserPermissionsCache.getOrWait([scope.id, json.id, 'team', !!options?.direct], "write-only");
        return permissions.map((json) => app._serverPermissionFromJson(json));
      },
      usePermissions(scope: Team, options?: { direct?: boolean }): ServerPermission[] {
        const permissions = useCache(app._serverTeamUserPermissionsCache, [scope.id, json.id, 'team', !!options?.direct], "user.usePermissions()");
        return useMemo(() => permissions.map((json) => app._serverPermissionFromJson(json)), [permissions]);
      },
      usePermission(scope: Team, permissionId: string): ServerPermission | null {
        const permissions = this.usePermissions(scope);
        return useMemo(() => permissions.find((p) => p.id === permissionId) ?? null, [permissions, permissionId]);
      },
      async getPermission(scope: Team, permissionId: string): Promise<ServerPermission | null> {
        const permissions = await this.listPermissions(scope);
        return permissions.find((p) => p.id === permissionId) ?? null;
      },
      async hasPermission(scope: Team, permissionId: string): Promise<boolean> {
        const permissions = await this.listPermissions(scope);
        return permissions.some((p) => p.id === permissionId);
      },
      toJson() {
        return app._serverUserToJson(this);
      },
    };
  }

  protected _currentServerUserFromJson(json: ServerUserJson, tokenStore: TokenStore): ProjectCurrentSeverUser<ProjectId>;
  protected _currentServerUserFromJson(json: ServerUserJson | null, tokenStore: TokenStore): ProjectCurrentSeverUser<ProjectId> | null;
  protected _currentServerUserFromJson(json: ServerUserJson | null, tokenStore: TokenStore): ProjectCurrentSeverUser<ProjectId> | null {
    if (json === null) return null;
    const app = this;
    const nonCurrentServerUser = this._serverUserFromJson(json);
    const currentUser: CurrentServerUser = {
      ...nonCurrentServerUser,
      tokenStore,
      async delete() {
        const res = await nonCurrentServerUser.delete();
        await app._refreshUser(tokenStore);
        return res;
      },
      async update(update: ServerUserUpdateJson) {
        const res = await nonCurrentServerUser.update(update);
        await app._refreshUser(tokenStore);
        return res;
      },  
      signOut() {
        return app._signOut(tokenStore);
      },
      getClientUser() {
        return app._currentUserFromJson(json, tokenStore);
      },
      sendVerificationEmail() {
        return app._sendVerificationEmail(tokenStore);
      },
      updatePassword(options: { oldPassword: string, newPassword: string}) {
        return app._updatePassword(options, tokenStore);
      },
    };

    if (this.isInternalProject()) {
      const internalUser: CurrentInternalServerUser = {
        ...currentUser,
        createProject(newProject: ProjectUpdateOptions & { displayName: string }) {
          return app._createProject(newProject);
        },
        listOwnedProjects() {
          return app._listOwnedProjects();
        },
        useOwnedProjects() {
          return app._useOwnedProjects();
        },
        onOwnedProjectsChange(callback: (projects: Project[]) => void) {
          return app._onOwnedProjectsChange(callback);
        }
      };
      Object.freeze(internalUser);
      return internalUser;
    } else {
      Object.freeze(currentUser);
      return currentUser as any;
    }
  }

  protected _serverTeamMemberFromJson(json: ServerTeamMemberJson): ServerTeamMember;
  protected _serverTeamMemberFromJson(json: ServerTeamMemberJson | null): ServerTeamMember | null;
  protected _serverTeamMemberFromJson(json: ServerTeamMemberJson | null): ServerTeamMember | null {
    if (json === null) return null;
    const app = this;
    return {
      ...app._teamMemberFromJson(json),
      async getUser() {
        const user = app._serverUserFromJson(await app._serverUserCache.getOrWait([json.userId], "write-only"));
        if (!user) throw new Error(`User ${json.userId} not found`);
        return user;
      }
    };
  }

  protected _serverUserToJson(user: ServerUser): ServerUserJson {
    return {
      projectId: user.projectId,
      id: user.id,
      displayName: user.displayName,
      primaryEmail: user.primaryEmail,
      primaryEmailVerified: user.primaryEmailVerified,
      profileImageUrl: user.profileImageUrl,
      signedUpAtMillis: user.signedUpAt.getTime(),
      clientMetadata: user.clientMetadata,
      serverMetadata: user.serverMetadata,
      authMethod: user.authMethod,
      hasPassword: user.hasPassword,
      authWithEmail: user.authWithEmail,
      oauthProviders: user.oauthProviders,
    };
  }

  protected _serverTeamFromJson(json: ServerTeamJson): ServerTeam {
    const app = this;
    return {
      id: json.id,
      displayName: json.displayName,
      createdAt: new Date(json.createdAtMillis),
      async listMembers() {
        return (await app._interface.listTeamMembers(json.id)).map((u) => app._serverTeamMemberFromJson(u));
      },
      async update(update: Partial<ServerTeamCustomizableJson>) {
        await app._interface.updateTeam(json.id, update);
        await app._serverTeamsCache.refresh([]);
      },
      async delete() {
        await app._interface.deleteTeam(json.id);
        await app._serverTeamsCache.refresh([]);
      },
      useMembers() {
        const result = useCache(app._serverTeamMembersCache, [json.id], "team.useUsers()");
        return useMemo(() => result.map((u) => app._serverTeamMemberFromJson(u)), [result]);
      },
      async addUser(userId) {
        await app._interface.addUserToTeam({
          teamId: json.id,
          userId,
        });
        await app._serverTeamMembersCache.refresh([json.id]);
      },
      async removeUser(userId) {
        await app._interface.removeUserFromTeam({
          teamId: json.id,
          userId,
        });
        await app._serverTeamMembersCache.refresh([json.id]);
      },
      toJson() {
        return json;
      },
    };
  }

  async getServerUser(): Promise<ProjectCurrentSeverUser<ProjectId> | null> {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = await this._currentServerUserCache.getOrWait([tokenStore], "write-only");
    return this._currentServerUserFromJson(userJson, tokenStore);
  }

  async getServerUserById(userId: string): Promise<ServerUser | null> {
    const json = await this._serverUserCache.getOrWait([userId], "write-only");
    return this._serverUserFromJson(json);
  }

  useServerUser(options?: { required: boolean }): ProjectCurrentSeverUser<ProjectId> | null {
    this._ensurePersistentTokenStore();

    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = useCache(this._currentServerUserCache, [tokenStore], "useServerUser()");

    return useMemo(() => {
      if (options?.required && userJson === null) {
        use(this.redirectToSignIn());
      }

      return this._currentServerUserFromJson(userJson, tokenStore);
    }, [userJson, tokenStore, options?.required]);
  }

  onServerUserChange(callback: (user: CurrentServerUser | null) => void) {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    return this._currentServerUserCache.onChange([tokenStore], (userJson) => {
      callback(this._currentServerUserFromJson(userJson, tokenStore));
    });
  }

  async listServerUsers(): Promise<ServerUser[]> {
    const json = await this._serverUsersCache.getOrWait([], "write-only");
    return json.map((j) => this._serverUserFromJson(j));
  }

  useServerUsers(): ServerUser[] {
    const json = useCache(this._serverUsersCache, [], "useServerUsers()");
    return useMemo(() => {
      return json.map((j) => this._serverUserFromJson(j));
    }, [json]);
  }

  onServerUsersChange(callback: (users: ServerUser[]) => void) {
    return this._serverUsersCache.onChange([], (users) => {
      callback(users.map((j) => this._serverUserFromJson(j)));
    });
  }

  async listPermissionDefinitions(): Promise<ServerPermissionDefinitionJson[]> {
    return await this._serverTeamPermissionDefinitionsCache.getOrWait([], "write-only");
  }

  usePermissionDefinitions(): ServerPermissionDefinitionJson[] {
    return useCache(this._serverTeamPermissionDefinitionsCache, [], "usePermissions()");
  }

  _serverPermissionFromJson(json: ServerPermissionDefinitionJson): ServerPermission {
    return {
      ...this._permissionFromJson(json),
      __databaseUniqueId: json.__databaseUniqueId,
      description: json.description,
      containPermissionIds: json.containPermissionIds,
    };
  }

  async createPermissionDefinition(data: ServerPermissionDefinitionCustomizableJson): Promise<ServerPermission>{
    const permission = await this._serverPermissionFromJson(await this._interface.createPermissionDefinition(data));
    await this._serverTeamPermissionDefinitionsCache.refresh([]);
    return permission;
  }

  async updatePermissionDefinition(permissionId: string, data: Partial<ServerPermissionDefinitionCustomizableJson>) {
    await this._interface.updatePermissionDefinition(permissionId, data);
    await this._serverTeamPermissionDefinitionsCache.refresh([]);
  }

  async deletePermissionDefinition(permissionId: string): Promise<void> {
    await this._interface.deletePermissionDefinition(permissionId);
    await this._serverTeamPermissionDefinitionsCache.refresh([]);
  }

  async listTeams(): Promise<ServerTeam[]> {
    const teams = await this._serverTeamsCache.getOrWait([], "write-only");
    return teams.map((t) => this._serverTeamFromJson(t));
  }

  async createTeam(data: ServerTeamCustomizableJson) : Promise<ServerTeam> {
    const team = await this._interface.createTeam(data);
    await this._serverTeamsCache.refresh([]);
    return this._serverTeamFromJson(team);
  }

  useTeams(): ServerTeam[] {
    const teams = useCache(this._serverTeamsCache, [], "useServerTeams()");
    return useMemo(() => {
      return teams.map((t) => this._serverTeamFromJson(t));
    }, [teams]);
  }

  async getTeam(teamId: string): Promise<ServerTeam | null> {
    const teams = await this.listTeams();
    return teams.find((t) => t.id === teamId) ?? null;
  }

  useTeam(teamId: string): ServerTeam | null {
    const teams = this.useTeams();
    return useMemo(() => {
      return teams.find((t) => t.id === teamId) ?? null;
    }, [teams, teamId]);
  }

  protected override async _refreshUser(tokenStore: TokenStore) {
    await Promise.all([
      super._refreshUser(tokenStore),
      this._currentServerUserCache.refresh([tokenStore]),
    ]);
  }

  protected override async _refreshUsers() {
    await Promise.all([
      super._refreshUsers(),
      this._serverUsersCache.refresh([]),
    ]);
  }
}

class _StackAdminAppImpl<HasTokenStore extends boolean, ProjectId extends string> extends _StackServerAppImpl<HasTokenStore, ProjectId>
{
  declare protected _interface: StackAdminInterface;
  
  private readonly _adminProjectCache = createCache(async () => {
    return await this._interface.getProject();
  });
  private readonly _apiKeySetsCache = createCache(async () => {
    return await this._interface.listApiKeySets();
  });

  constructor(options: StackAdminAppConstructorOptions<HasTokenStore, ProjectId>) {
    super({
      interface: new StackAdminInterface({
        baseUrl: options.baseUrl ?? getDefaultBaseUrl(),
        projectId: options.projectId ?? getDefaultProjectId(),
        ..."projectOwnerTokens" in options ? {
          projectOwnerTokens: options.projectOwnerTokens,
        } : {
          publishableClientKey: options.publishableClientKey ?? getDefaultPublishableClientKey(),
          secretServerKey: options.secretServerKey ?? getDefaultSecretServerKey(),
          superSecretAdminKey: options.superSecretAdminKey ?? getDefaultSuperSecretAdminKey(),
        },
      }),
      tokenStore: options.tokenStore,
      urls: options.urls,
    });
  }


  protected _createApiKeySetBaseFromJson(data: ApiKeySetBaseJson): ApiKeySetBase {
    const app = this;
    return {
      id: data.id,
      description: data.description,
      expiresAt: new Date(data.expiresAtMillis),
      manuallyRevokedAt: data.manuallyRevokedAtMillis ? new Date(data.manuallyRevokedAtMillis) : null,
      createdAt: new Date(data.createdAtMillis),
      isValid() {
        return this.whyInvalid() === null;
      },
      whyInvalid() {
        if (this.expiresAt.getTime() < Date.now()) return "expired";
        if (this.manuallyRevokedAt) return "manually-revoked";
        return null;
      },
      async revoke() {
        const res = await app._interface.revokeApiKeySetById(data.id);
        await app._refreshApiKeySets();
        return res;
      }
    };
  }

  protected _createApiKeySetFromJson(data: ApiKeySetJson): ApiKeySet {
    return {
      ...this._createApiKeySetBaseFromJson(data),
      publishableClientKey: data.publishableClientKey ? { lastFour: data.publishableClientKey.lastFour } : null,
      secretServerKey: data.secretServerKey ? { lastFour: data.secretServerKey.lastFour } : null,
      superSecretAdminKey: data.superSecretAdminKey ? { lastFour: data.superSecretAdminKey.lastFour } : null,
    };
  }

  protected _createApiKeySetFirstViewFromJson(data: ApiKeySetFirstViewJson): ApiKeySetFirstView {
    return {
      ...this._createApiKeySetBaseFromJson(data),
      publishableClientKey: data.publishableClientKey,
      secretServerKey: data.secretServerKey,
      superSecretAdminKey: data.superSecretAdminKey,
    };
  }

  async getProjectAdmin(): Promise<Project> {
    return this._projectAdminFromJson(
      await this._adminProjectCache.getOrWait([], "write-only"),
      this._interface,
      () => this._refreshProject()
    );
  }

  useProjectAdmin(): Project {
    const json = useCache(this._adminProjectCache, [], "useProjectAdmin()");
    return useMemo(() => this._projectAdminFromJson(
      json,
      this._interface,
      () => this._refreshProject()
    ), [json]);
  }

  onProjectAdminChange(callback: (project: Project) => void) {
    return this._adminProjectCache.onChange([], (project) => {
      callback(this._projectAdminFromJson(
        project,
        this._interface,
        () => this._refreshProject()
      ));
    });
  }

  async listApiKeySets(): Promise<ApiKeySet[]> {
    const json = await this._apiKeySetsCache.getOrWait([], "write-only");
    return json.map((j) => this._createApiKeySetFromJson(j));
  }

  useApiKeySets(): ApiKeySet[] {
    const json = useCache(this._apiKeySetsCache, [], "useApiKeySets()");
    return useMemo(() => {
      return json.map((j) => this._createApiKeySetFromJson(j));
    }, [json]);
  }

  onApiKeySetsChange(callback: (apiKeySets: ApiKeySet[]) => void) {
    return this._apiKeySetsCache.onChange([], (apiKeySets) => {
      callback(apiKeySets.map((j) => this._createApiKeySetFromJson(j)));
    });
  }

  async createApiKeySet(options: ApiKeySetCreateOptions): Promise<ApiKeySetFirstView> {
    const json = await this._interface.createApiKeySet(options);
    await this._refreshApiKeySets();
    return this._createApiKeySetFirstViewFromJson(json);
  }

  protected override async _refreshProject() {
    await Promise.all([
      super._refreshProject(),
      this._adminProjectCache.refresh([]),
    ]);
  }

  protected async _refreshApiKeySets() {
    await this._apiKeySetsCache.refresh([]);
  }
}

type Auth<T, C> = {
  readonly tokenStore: ReadonlyTokenStore,
  update(this: T, user: C): Promise<void>,
  signOut(this: T): Promise<void>,
  sendVerificationEmail(this: T): Promise<KnownErrors["EmailAlreadyVerified"] | undefined>,
  updatePassword(this: T, options: { oldPassword: string, newPassword: string}): Promise<KnownErrors["PasswordMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | undefined>,
};

type InternalAuth<T> = {
  createProject(this: T, newProject: ProjectUpdateOptions & { displayName: string }): Promise<Project>,
  listOwnedProjects(this: T): Promise<Project[]>,
  useOwnedProjects(this: T): Project[],
  onOwnedProjectsChange(this: T, callback: (projects: Project[]) => void): void,
};

export type User = (
  & {
    readonly projectId: string,
    readonly id: string,

    readonly displayName: string | null,

    /**
     * The user's email address.
     *
     * Note: This might NOT be unique across multiple users, so always use `id` for unique identification.
     */
    readonly primaryEmail: string | null,
    readonly primaryEmailVerified: boolean,

    readonly profileImageUrl: string | null,

    readonly signedUpAt: Date,

    readonly clientMetadata: ReadonlyJson,

    readonly authMethod: 'credential' | 'oauth', // not used anymore, for backwards compatibility
    readonly hasPassword: boolean,
    readonly authWithEmail: boolean,
    readonly oauthProviders: readonly string[],

    hasPermission(this: CurrentUser, scope: Team, permissionId: string): Promise<boolean>,

    toJson(this: CurrentUser): UserJson,
  }
  & AsyncStoreProperty<"team", [id: string], Team | null, false>
  & AsyncStoreProperty<"teams", [], Team[], true>
  & Omit<AsyncStoreProperty<"permission", [scope: Team, permissionId: string, options?: { direct?: boolean }], Permission | null, false>, "onPermissionChange">
  & Omit<AsyncStoreProperty<"permissions", [scope: Team, options?: { direct?: boolean }], Permission[], true>, "onPermissionsChange">
);

export type CurrentUser = Auth<User, UserUpdateJson> & User;

export type CurrentInternalUser = CurrentUser & InternalAuth<CurrentUser>;

/**
 * A user including sensitive fields that should only be used on the server, never sent to the client
 * (such as sensitive information and serverMetadata).
 */
export type ServerUser = (
  Omit<
    User, 
    'hasPermission' | 'toJson' 
      | keyof AsyncStoreProperty<"team", [], Team | null, false>
      | keyof AsyncStoreProperty<"teams", [], Team[], true>
      | keyof AsyncStoreProperty<"permission", [], Permission[], false> 
      | keyof AsyncStoreProperty<"permissions", [], Permission[], true> 
  > & {
    readonly serverMetadata: ReadonlyJson,

    /**
     * Returns a new user object with the sensitive fields removed.
     */
    getClientUser(this: ServerUser): User,

    update(this: ServerUser, user: Partial<ServerUserUpdateJson>): Promise<void>,
    delete(this: ServerUser): Promise<void>,

    grantPermission(scope: Team, permissionId: string): Promise<void>,
    revokePermission(scope: Team, permissionId: string): Promise<void>,

    hasPermission(scope: Team, permissionId: string): Promise<boolean>,

    toJson(this: ServerUser): ServerUserJson,
  } 
  & AsyncStoreProperty<"team", [id: string], ServerTeam | null, false>
  & AsyncStoreProperty<"teams", [], ServerTeam[], true>
  & Omit<AsyncStoreProperty<"permission", [scope: Team, permissionId: string, options?: { direct?: boolean }], ServerPermission | null, false>, "onPermissionChange">
  & Omit<AsyncStoreProperty<"permissions", [scope: Team, options?: { direct?: boolean }], ServerPermission[], true>, "onPermissionsChange">
)

export type CurrentServerUser = Auth<ServerUser, ServerUserUpdateJson> & Omit<ServerUser, "getClientUser"> & {
  getClientUser(this: CurrentServerUser): CurrentUser,
};

export type CurrentInternalServerUser = CurrentServerUser & InternalAuth<CurrentServerUser>;

export type Project = {
  readonly id: string,
  readonly displayName: string,
  readonly description?: string,
  readonly createdAt: Date,
  readonly userCount: number,
  readonly isProductionMode: boolean,
  readonly evaluatedConfig: {
    readonly id: string,
    readonly allowLocalhost: boolean,
    readonly credentialEnabled: boolean,
    readonly magicLinkEnabled: boolean,
    readonly oauthProviders: OAuthProviderConfig[],
    readonly emailConfig?: EmailConfig,
    readonly domains: DomainConfig[],
    readonly createTeamOnSignUp: boolean,
  },

  update(this: Project, update: ProjectUpdateOptions): Promise<void>,

  toJson(this: Project): ProjectJson,

  getProductionModeErrors(this: Project): ProductionModeError[],
};

export type Team = {
  id: string,
  displayName: string,
  createdAt: Date,

  toJson(this: Team): TeamJson,
};

export type ServerTeam = Team & {
  listMembers(): Promise<ServerTeamMember[]>,
  useMembers(): ServerTeamMember[],
  update(update: Partial<ServerTeamCustomizableJson>): Promise<void>,
  delete(): Promise<void>,
  addUser(userId: string): Promise<void>,
  removeUser(userId: string): Promise<void>,
};

export type TeamMember = {
  userId: string,
  teamId: string,
  displayName: string | null,
}

export type ServerTeamMember = TeamMember & {
  getUser(): Promise<ServerUser>,
}

export type Permission = {
  id: string,
} & (
  | { type: "global" }
  | { type: "team", teamId: string }
);

export type ServerPermission = Permission & {
  readonly __databaseUniqueId: string,
  readonly description?: string,
  readonly containPermissionIds: string[],
};


export type ApiKeySetBase = {
  id: string,
  description: string,
  expiresAt: Date,
  manuallyRevokedAt: Date | null,
  createdAt: Date,
  isValid(): boolean,
  whyInvalid(): "expired" | "manually-revoked" | null,
  revoke(): Promise<void>,
};

export type ApiKeySetFirstView = ApiKeySetBase & {
  publishableClientKey?: string,
  secretServerKey?: string,
  superSecretAdminKey?: string,
};

export type ApiKeySet = ApiKeySetBase & {
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


export type EmailConfig = EmailConfigJson;

export type DomainConfig = DomainConfigJson;

export type OAuthProviderConfig = OAuthProviderConfigJson;

export type GetUserOptions = {
  or?: 'redirect' | 'throw' | 'return-null',
};

type SplitArgs<T extends any[], U extends number> = [
  ...Parameters<Extract<T[U], (...args: any) => any>>,
  Omit<T, U>
];

type AsyncStoreProperty<Name extends string, Args extends any[], Value, IsMultiple extends boolean> =
  & { [key in `${IsMultiple extends true ? "list" : "get"}${Capitalize<Name>}`]: (...args: Args) => Promise<Value> }
  & { [key in `on${Capitalize<Name>}Change`]: (...tupleArgs: [...args: Args, callback: (value: Value) => void]) => void }
  & { [key in `use${Capitalize<Name>}`]: (...args: Args) => Value }

export type StackClientApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = (
  & {
    readonly projectId: ProjectId,

    readonly urls: Readonly<HandlerUrls>,

    signInWithOAuth(provider: string): Promise<void>,
    signInWithCredential(options: { email: string, password: string }): Promise<KnownErrors["EmailPasswordMismatch"] | undefined>,
    signUpWithCredential(options: { email: string, password: string }): Promise<KnownErrors["UserEmailAlreadyExists"] | undefined>,
    callOAuthCallback(): Promise<void>,
    sendForgotPasswordEmail(email: string): Promise<KnownErrors["UserNotFound"] | undefined>,
    sendMagicLinkEmail(email: string): Promise<KnownErrors["RedirectUrlNotWhitelisted"] | undefined>,
    resetPassword(options: { code: string, password: string }): Promise<KnownErrors["PasswordResetError"] | undefined>,
    verifyPasswordResetCode(code: string): Promise<KnownErrors["PasswordResetCodeError"] | undefined>,
    verifyEmail(code: string): Promise<KnownErrors["EmailVerificationError"] | undefined>,
    signInWithMagicLink(code: string): Promise<KnownErrors["MagicLinkError"] | undefined>,

    [stackAppInternalsSymbol]: {
      toClientJson(): StackClientAppJson<HasTokenStore, ProjectId>,
      setCurrentUser(userJsonPromise: Promise<UserJson | null>): void,
    },
  }
  & AsyncStoreProperty<"project", [], ClientProjectJson, false>
  & { [K in `redirectTo${Capitalize<keyof Omit<HandlerUrls, 'handler' | 'oauthCallback'>>}`]: () => Promise<void> }
  & (HasTokenStore extends false
    ? {}
    : {
      redirectToOAuthCallback(): Promise<void>,
      useUser(options: GetUserOptions & { or: 'redirect' }): ProjectCurrentUser<ProjectId>,
      useUser(options: GetUserOptions & { or: 'throw' }): ProjectCurrentUser<ProjectId>,
      useUser(options?: GetUserOptions): ProjectCurrentUser<ProjectId> | null,
      getUser(options: GetUserOptions & { or: 'redirect' }): Promise<ProjectCurrentUser<ProjectId>>,
      getUser(options: GetUserOptions & { or: 'throw' }): Promise<ProjectCurrentUser<ProjectId>>,
      getUser(options?: GetUserOptions): Promise<ProjectCurrentUser<ProjectId> | null>,
      onUserChange: AsyncStoreProperty<"user", [], CurrentUser | null, false>["onUserChange"],
    })
);
type StackClientAppConstructor = {
  new <
    TokenStoreType extends string,
    HasTokenStore extends (TokenStoreType extends {} ? true : boolean),
    ProjectId extends string
  >(options: StackClientAppConstructorOptions<HasTokenStore, ProjectId>): StackClientApp<HasTokenStore, ProjectId>,
  new (options: StackClientAppConstructorOptions<boolean, string>): StackClientApp<boolean, string>,

  [stackAppInternalsSymbol]: {
    fromClientJson<HasTokenStore extends boolean, ProjectId extends string>(
      json: StackClientAppJson<HasTokenStore, ProjectId>
    ): StackClientApp<HasTokenStore, ProjectId>,
  },
};
export const StackClientApp: StackClientAppConstructor = _StackClientAppImpl;

export type StackServerApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = (
  & StackClientApp<HasTokenStore, ProjectId>
  & {
    createTeam(data: ServerTeamCustomizableJson): Promise<ServerTeam>,
    createPermissionDefinition(data: ServerPermissionDefinitionCustomizableJson): Promise<ServerPermission>,
    updatePermissionDefinition(permissionId: string, data: Partial<ServerPermissionDefinitionCustomizableJson>): Promise<void>,
    deletePermissionDefinition(permissionId: string): Promise<void>,
    listPermissionDefinitions(): Promise<ServerPermissionDefinitionJson[]>,
    usePermissionDefinitions(): ServerPermissionDefinitionJson[],
  }
  & AsyncStoreProperty<"serverUser", [], CurrentServerUser | null, false>
  & AsyncStoreProperty<"serverUsers", [], ServerUser[], true>
  & Omit<AsyncStoreProperty<"team", [id: string], ServerTeam | null, false>, "onTeamChange">
  & Omit<AsyncStoreProperty<"teams", [], ServerTeam[], true>, "onTeamsChange">
);
type StackServerAppConstructor = {
  new <
    TokenStoreType extends string,
    HasTokenStore extends (TokenStoreType extends {} ? true : boolean),
    ProjectId extends string
  >(options: StackServerAppConstructorOptions<HasTokenStore, ProjectId>): StackServerApp<HasTokenStore, ProjectId>,
  new (options: StackServerAppConstructorOptions<boolean, string>): StackServerApp<boolean, string>,
};
export const StackServerApp: StackServerAppConstructor = _StackServerAppImpl;

export type StackAdminApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = (
  & StackServerApp<HasTokenStore, ProjectId>
  & AsyncStoreProperty<"projectAdmin", [], Project, false>
  & AsyncStoreProperty<"apiKeySets", [], ApiKeySet[], true>
  & {
    createApiKeySet(options: ApiKeySetCreateOptions): Promise<ApiKeySetFirstView>,
  }
);
type StackAdminAppConstructor = {
  new <
    HasTokenStore extends boolean,
    ProjectId extends string
  >(options: StackAdminAppConstructorOptions<HasTokenStore, ProjectId>): StackAdminApp<HasTokenStore, ProjectId>,
  new (options: StackAdminAppConstructorOptions<boolean, string>): StackAdminApp<boolean, string>,
};
export const StackAdminApp: StackAdminAppConstructor = _StackAdminAppImpl;
