import React, { use, useCallback, useMemo } from "react";
import { KnownError, KnownErrors, OAuthProviderConfigJson, ServerUserJson, StackAdminInterface, StackClientInterface, StackServerInterface } from "@stackframe/stack-shared";
import { deleteCookie, getCookie, setOrDeleteCookie } from "./cookie";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import { AsyncResult, Result } from "@stackframe/stack-shared/dist/utils/results";
import { suspendIfSsr } from "@stackframe/stack-shared/dist/utils/react";
import { Store } from "@stackframe/stack-shared/dist/utils/stores";
import { ClientProjectJson, UserJson, ProjectJson, EmailConfigJson, DomainConfigJson, getProductionModeErrors, ProductionModeError, UserUpdateJson, TeamJson, PermissionDefinitionJson, PermissionDefinitionScopeJson, TeamMemberJson, StandardProvider } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { isBrowserLike } from "@stackframe/stack-shared/dist/utils/env";
import { addNewOAuthProviderOrScope, callOAuthCallback, signInWithOAuth } from "./auth";
import * as NextNavigationUnscrambled from "next/navigation";  // import the entire module to get around some static compiler warnings emitted by Next.js in some cases
import { ReadonlyJson } from "@stackframe/stack-shared/dist/utils/json";
import { constructRedirectUrl } from "../utils/url";
import { deepPlainEquals, filterUndefined, omit } from "@stackframe/stack-shared/dist/utils/objects";
import { neverResolve, resolved, runAsynchronously, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { AsyncCache } from "@stackframe/stack-shared/dist/utils/caches";
import { ApiKeySetBaseJson, ApiKeySetCreateOptions, ApiKeySetFirstViewJson, ApiKeySetJson, ProjectUpdateOptions } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { suspend } from "@stackframe/stack-shared/dist/utils/react";
import { EmailTemplateType, ServerPermissionDefinitionCustomizableJson, ServerPermissionDefinitionJson, ServerTeamCustomizableJson, ServerTeamJson, ServerTeamMemberJson, ServerUserUpdateJson } from "@stackframe/stack-shared/dist/interface/serverInterface";
import { EmailTemplateCrud, ListEmailTemplatesCrud } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { scrambleDuringCompileTime } from "@stackframe/stack-shared/dist/utils/compile-time";
import { isReactServer } from "@stackframe/stack-sc";
import * as cookie from "cookie";
import { InternalSession } from "@stackframe/stack-shared/dist/sessions";
import { useTrigger } from "@stackframe/stack-shared/dist/hooks/use-trigger";
import { mergeScopeStrings } from "@stackframe/stack-shared/dist/utils/strings";
import { generateSecureRandomString } from "@stackframe/stack-shared/dist/utils/crypto";


// NextNavigation.useRouter does not exist in react-server environments and some bundlers try to be helpful and throw a warning. Ignore the warning.
const NextNavigation = scrambleDuringCompileTime(NextNavigationUnscrambled);

const clientVersion = process.env.STACK_COMPILE_TIME_CLIENT_PACKAGE_VERSION ?? throwErr("Missing STACK_COMPILE_TIME_CLIENT_PACKAGE_VERSION. This should be a compile-time variable set by Stack's build system.");

type RequestLike = {
  headers: {
    get: (name: string) => string | null,
  },
};

export type TokenStoreInit<HasTokenStore extends boolean = boolean> =
  HasTokenStore extends true ? (
    | "cookie"
    | "nextjs-cookie"
    | "memory"
    | RequestLike
    | { accessToken: string, refreshToken: string }
  )
  : HasTokenStore extends false ? null
  : TokenStoreInit<true> | TokenStoreInit<false>;

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
  error: string,
}

export type OAuthScopesOnSignIn = {
  [key in StandardProvider]: string[];
};


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
    error: `${handler}/error`,
    ...filterUndefined(partial),
  };
}

async function _redirectTo(url: string, options?: { replace?: boolean }) {
  if (isReactServer) {
    NextNavigation.redirect(url, options?.replace ? NextNavigation.RedirectType.replace : NextNavigation.RedirectType.push);
  } else {
    if (options?.replace) {
      window.location.replace(url);
    } else {
      window.location.assign(url);
    }
    await wait(2000);
  }
}

function getDefaultProjectId() {
  return process.env.NEXT_PUBLIC_STACK_PROJECT_ID || throwErr(new Error("Welcome to Stack! It seems that you haven't provided a project ID. Please create a project on the Stack dashboard at https://app.stack-auth.com and put it in the NEXT_PUBLIC_STACK_PROJECT_ID environment variable."));
}

function getDefaultPublishableClientKey() {
  return process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || throwErr(new Error("Welcome to Stack! It seems that you haven't provided a publishable client key. Please create an API key for your project on the Stack dashboard at https://app.stack-auth.com and copy your publishable client key into the NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY environment variable."));
}

function getDefaultSecretServerKey() {
  return process.env.STACK_SECRET_SERVER_KEY || throwErr(new Error("No secret server key provided. Please copy your key from the Stack dashboard and put your it in the STACK_SECRET_SERVER_KEY environment variable."));
}

function getDefaultSuperSecretAdminKey() {
  return process.env.STACK_SUPER_SECRET_ADMIN_KEY || throwErr(new Error("No super secret admin key provided. Please copy your key from the Stack dashboard and put it in the STACK_SUPER_SECRET_ADMIN_KEY environment variable."));
}

function getDefaultBaseUrl() {
  return process.env.NEXT_PUBLIC_STACK_URL || defaultBaseUrl;
}

export type StackClientAppConstructorOptions<HasTokenStore extends boolean, ProjectId extends string> = {
  baseUrl?: string,
  projectId?: ProjectId,
  publishableClientKey?: string,
  urls?: Partial<HandlerUrls>,
  oauthScopesOnSignIn?: Partial<OAuthScopesOnSignIn>,

  // we intersect with TokenStoreInit in the beginning to make TypeScript error messages easier to read
  tokenStore: TokenStoreInit<HasTokenStore>,
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
      projectOwnerSession: InternalSession,
    }
  )
);

export type StackClientAppJson<HasTokenStore extends boolean, ProjectId extends string> = StackClientAppConstructorOptions<HasTokenStore, ProjectId> & {
  uniqueIdentifier: string,
  // note: if you add more fields here, make sure to ensure the checkString in the constructor has/doesn't have them
};

const defaultBaseUrl = "https://app.stack-auth.com";

type TokenObject = {
  accessToken: string | null,
  refreshToken: string | null,
};

function createEmptyTokenStore() {
  return new Store<TokenObject>({
    refreshToken: null,
    accessToken: null,
  });
}

const loadingSentinel = Symbol("stackAppCacheLoadingSentinel");
function useAsyncCache<D extends any[], T>(cache: AsyncCache<D, T>, dependencies: D, caller: string): T {
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

function useStore<T>(store: Store<T>): T {
  const subscribe = useCallback((cb: () => void) => {
    const { unsubscribe } = store.onChange(() => cb());
    return unsubscribe;
  }, [store]);
  const getSnapshot = useCallback(() => store.get(), [store]);

  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const stackAppInternalsSymbol = Symbol.for("StackAppInternals");

const allClientApps = new Map<string, [checkString: string, app: StackClientApp<any, any>]>();

const createCache = <D extends any[], T>(fetcher: (dependencies: D) => Promise<T>) => {
  return new AsyncCache<D, T>(
    async (dependencies) => await fetcher(dependencies),
    {},
  );
};

const createCacheBySession = <D extends any[], T>(fetcher: (session: InternalSession, extraDependencies: D) => Promise<T> ) => {
  return new AsyncCache<[InternalSession, ...D], T>(
    async ([session, ...extraDependencies]) => await fetcher(session, extraDependencies),
    {
      onSubscribe: ([session], refresh) => {
        const handler = session.onInvalidate(() => refresh());
        return () => handler.unsubscribe();
      },
    },
  );
};

let numberOfAppsCreated = 0;

class _StackClientAppImpl<HasTokenStore extends boolean, ProjectId extends string = string> {
  protected _uniqueIdentifier: string | undefined = undefined;
  protected _interface: StackClientInterface;
  protected readonly _tokenStoreInit: TokenStoreInit<HasTokenStore>;
  protected readonly _urlOptions: Partial<HandlerUrls>;
  protected readonly _oauthScopesOnSignIn: Partial<OAuthScopesOnSignIn>;

  private __DEMO_ENABLE_SLIGHT_FETCH_DELAY = false;

  private readonly _currentUserCache = createCacheBySession(async (session) => {
    if (this.__DEMO_ENABLE_SLIGHT_FETCH_DELAY) {
      await wait(2000);
    }
    const user = await this._interface.getClientUserByToken(session);
    return Result.or(user, null);
  });
  private readonly _currentProjectCache = createCache(async () => {
    return Result.orThrow(await this._interface.getClientProject());
  });
  private readonly _ownedProjectsCache = createCacheBySession(async (session) => {
    return await this._interface.listProjects(session);
  });
  private readonly _currentUserPermissionsCache = createCacheBySession<
    [string, 'team' | 'global', boolean], 
    PermissionDefinitionJson[]
  >(async (session, [teamId, type, direct]) => {
    return await this._interface.listClientUserTeamPermissions({ teamId, type, direct }, session);
  });
  private readonly _currentUserTeamsCache = createCacheBySession(async (session) => {
    return await this._interface.listClientUserTeams(session);
  });
  private readonly _currentUserOAuthConnectionAccessTokensCache = createCacheBySession<[string, string], { accessToken: string } | null>(
    async (session, [accountId, scope]) => {
      try {
        return await this._interface.getAccessToken(accountId, scope || "", session);
      } catch (err) {
        if (!(err instanceof KnownErrors.OAuthConnectionDoesNotHaveRequiredScope || err instanceof KnownErrors.OAuthConnectionNotConnectedToUser)) {
          throw err;
        }
      }
      return null;
    }
  );
  private readonly _currentUserOAuthConnectionCache = createCacheBySession<[StandardProvider, string, boolean], OAuthConnection | null>(
    async (session, [connectionId, scope, redirect]) => {
      const user = await this._currentUserCache.getOrWait([session], "write-only");

      let hasConnection = true;
      if (!user || !user.oauthProviders.find((p) => p === connectionId)) {
        hasConnection = false;
      }
      const token = await this._currentUserOAuthConnectionAccessTokensCache.getOrWait([session, connectionId, scope || ""], "write-only");
      if (!token) {
        hasConnection = false;
      }

      if (!hasConnection && redirect) {
        await addNewOAuthProviderOrScope(
          this._interface, 
          { 
            provider: connectionId, 
            redirectUrl: this.urls.oauthCallback,
            errorRedirectUrl: this.urls.error, 
            providerScope: mergeScopeStrings(scope || "", (this._oauthScopesOnSignIn[connectionId] ?? []).join(" ")),
          },
          this._getSession()
        );
        return await neverResolve();
      } else if (!hasConnection) {
        return null;
      }

      const app = this;
      return {
        id: connectionId,
        async getAccessToken() {
          const result = await app._currentUserOAuthConnectionAccessTokensCache.getOrWait([session, connectionId, scope || ""], "write-only");
          if (!result) {
            throw new StackAssertionError("No access token available");
          }
          return result;
        },
        useAccessToken() {
          const result = useAsyncCache(app._currentUserOAuthConnectionAccessTokensCache, [session, connectionId, scope || ""], "oauthAccount.useAccessToken()");
          if (!result) {
            throw new StackAssertionError("No access token available");
          }
          return result;
        }
      };
    }
  );


  constructor(protected readonly _options:
    & {
      uniqueIdentifier?: string,
      checkString?: string,
    }
    & (
      | StackClientAppConstructorOptions<HasTokenStore, ProjectId>
      | Pick<StackClientAppConstructorOptions<HasTokenStore, ProjectId>, "tokenStore" | "urls" | "oauthScopesOnSignIn"> & {
        interface: StackClientInterface,
      }
    )
  ) {
    if ("interface" in _options) {
      this._interface = _options.interface;
    } else {
      this._interface = new StackClientInterface({
        baseUrl: _options.baseUrl ?? getDefaultBaseUrl(),
        projectId: _options.projectId ?? getDefaultProjectId(),
        clientVersion,
        publishableClientKey: _options.publishableClientKey ?? getDefaultPublishableClientKey(),
      });
    }

    this._tokenStoreInit = _options.tokenStore;
    this._urlOptions = _options.urls ?? {};
    this._oauthScopesOnSignIn = _options.oauthScopesOnSignIn ?? {};

    if (_options.uniqueIdentifier) {
      this._uniqueIdentifier = _options.uniqueIdentifier;
      this._initUniqueIdentifier();
    }

    numberOfAppsCreated++;
    if (numberOfAppsCreated > 10) {
      (process.env.NODE_ENV === "development" ? console.log : console.warn)(`You have created more than 10 Stack apps (${numberOfAppsCreated}). This is usually a sign of a memory leak, but can sometimes be caused by hot reload of your tech stack. In production, make sure to minimize the number of Stack apps per page (usually, one per project).`);
    }
  }

  protected _initUniqueIdentifier() {
    if (!this._uniqueIdentifier) {
      throw new StackAssertionError("Unique identifier not initialized");
    }
    if (allClientApps.has(this._uniqueIdentifier)) {
      throw new StackAssertionError("A Stack client app with the same unique identifier already exists");
    }
    allClientApps.set(this._uniqueIdentifier, [this._options.checkString ?? "default check string", this]);
  }

  /**
   * Cloudflare workers does not allow use of randomness on the global scope (on which the Stack app is probably
   * initialized). For that reason, we generate the unique identifier lazily when it is first needed.
   */
  protected _getUniqueIdentifier() {
    if (!this._uniqueIdentifier) {
      this._uniqueIdentifier = generateUuid();
      this._initUniqueIdentifier();
    }
    return this._uniqueIdentifier!;
  }

  protected _memoryTokenStore = createEmptyTokenStore();
  protected _requestTokenStores = new WeakMap<RequestLike, Store<TokenObject>>();
  protected _storedCookieTokenStore: Store<TokenObject> | null = null;
  protected get _refreshTokenCookieName() {
    return `stack-refresh-${this.projectId}`;
  }
  protected get _accessTokenCookieName() {
    // The access token, unlike the refresh token, should not depend on the project ID. We never want to store the
    // access token in cookies more than once because of how big it is (there's a limit of 4096 bytes for all cookies
    // together). This means that, if you have multiple projects on the same domain, some of them will need to refetch
    // the access token on page reload.
    return `stack-access`;
  }
  protected _getCookieTokenStore(): Store<TokenObject> {
    if (!isBrowserLike()) {
      throw new Error("Cannot use cookie token store on the server!");
    }

    if (this._storedCookieTokenStore === null) {
      const getCurrentValue = (old: TokenObject | null) => ({
        refreshToken: getCookie(this._refreshTokenCookieName) ?? getCookie('stack-refresh'),  // keep old cookie name for backwards-compatibility
        
        // if there is an access token in memory already, don't update the access token based on cookies (access token
        // cookies may be set by another project on the same domain)
        // see the comment in _accessTokenCookieName for more information
        accessToken: old === null ? getCookie(this._accessTokenCookieName) : old.accessToken,
      });
      this._storedCookieTokenStore = new Store<TokenObject>(getCurrentValue(null));
      let hasSucceededInWriting = true;

      setInterval(() => {
        if (hasSucceededInWriting) {
          const oldValue = this._storedCookieTokenStore!.get();
          const currentValue = getCurrentValue(oldValue);
          if (!deepPlainEquals(currentValue, oldValue)) {
            this._storedCookieTokenStore!.set(currentValue);
          }
        }
      }, 100);
      this._storedCookieTokenStore.onChange((value) => {
        try {
          setOrDeleteCookie(this._refreshTokenCookieName, value.refreshToken, { maxAge: 60 * 60 * 24 * 365 });
          setOrDeleteCookie(this._accessTokenCookieName, value.accessToken, { maxAge: 60 * 60 * 24 });
          deleteCookie('stack-refresh');  // delete cookie name from previous versions (for backwards-compatibility)
          hasSucceededInWriting = true;
        } catch (e) {
          if (!isBrowserLike()) {
            // Setting cookies inside RSCs is not allowed, so we just ignore it
            hasSucceededInWriting = false;
          } else {
            throw e;
          }
        }
      });
    }

    return this._storedCookieTokenStore;
  };
  protected _getOrCreateTokenStore(overrideTokenStoreInit?: TokenStoreInit): Store<TokenObject> {
    const tokenStoreInit = overrideTokenStoreInit === undefined ? this._tokenStoreInit : overrideTokenStoreInit;

    switch (tokenStoreInit) {
      case "cookie": {
        return this._getCookieTokenStore();
      }
      case "nextjs-cookie": {
        if (isBrowserLike()) {
          return this._getCookieTokenStore();
        } else {
          const store = new Store<TokenObject>({
            refreshToken: getCookie(this._refreshTokenCookieName) ?? getCookie('stack-refresh'),  // keep old cookie name for backwards-compatibility
            accessToken: getCookie(this._accessTokenCookieName),
          });
          store.onChange((value) => {
            try {
              setOrDeleteCookie(this._refreshTokenCookieName, value.refreshToken, { maxAge: 60 * 60 * 24 * 365 });
              setOrDeleteCookie(this._accessTokenCookieName, value.accessToken, { maxAge: 60 * 60 * 24 });
            } catch (e) {
              // ignore
            }
          });
          return store;
        }
      }
      case "memory": {
        return this._memoryTokenStore;
      }
      default: {
        if (tokenStoreInit === null) {
          return createEmptyTokenStore();
        } else if (typeof tokenStoreInit === "object" && "headers" in tokenStoreInit) {
          if (this._requestTokenStores.has(tokenStoreInit)) return this._requestTokenStores.get(tokenStoreInit)!;

          // x-stack-auth header
          const stackAuthHeader = tokenStoreInit.headers.get("x-stack-auth");
          if (stackAuthHeader) {
            let parsed;
            try {
              parsed = JSON.parse(stackAuthHeader);
              if (typeof parsed !== "object") throw new Error("x-stack-auth header must be a JSON object");
              if (parsed === null) throw new Error("x-stack-auth header must not be null");
            } catch (e) {
              throw new Error(`Invalid x-stack-auth header: ${stackAuthHeader}`, { cause: e });
            }
            return this._getOrCreateTokenStore({
              accessToken: parsed.accessToken ?? null,
              refreshToken: parsed.refreshToken ?? null,
            });
          }

          // read from cookies
          const cookieHeader = tokenStoreInit.headers.get("cookie");
          const parsed = cookie.parse(cookieHeader || "");
          const res = new Store<TokenObject>({
            refreshToken: parsed[this._refreshTokenCookieName] || parsed['stack-refresh'] || null,  // keep old cookie name for backwards-compatibility
            accessToken: parsed[this._accessTokenCookieName] || null,
          });
          this._requestTokenStores.set(tokenStoreInit, res);
          return res;
        } else if ("accessToken" in tokenStoreInit || "refreshToken" in tokenStoreInit) {
          return new Store<TokenObject>({
            refreshToken: tokenStoreInit.refreshToken,
            accessToken: tokenStoreInit.accessToken,
          });
        }
    
        throw new Error(`Invalid token store ${tokenStoreInit}`);
      }
    }
  }

  /**
   * A map from token stores and session keys to sessions.
   * 
   * This isn't just a map from session keys to sessions for two reasons:
   * 
   * - So we can garbage-collect Session objects when the token store is garbage-collected
   * - So different token stores are separated and don't leak information between each other, eg. if the same user sends two requests to the same server they should get a different session object
   */
  private _sessionsByTokenStoreAndSessionKey = new WeakMap<Store<TokenObject>, Map<string, InternalSession>>();
  protected _getSessionFromTokenStore(tokenStore: Store<TokenObject>): InternalSession {
    const tokenObj = tokenStore.get();
    const sessionKey = InternalSession.calculateSessionKey(tokenObj);
    const existing = sessionKey ? this._sessionsByTokenStoreAndSessionKey.get(tokenStore)?.get(sessionKey) : null;
    if (existing) return existing;

    const session = this._interface.createSession({
      refreshToken: tokenObj.refreshToken,
      accessToken: tokenObj.accessToken,
    });
    session.onAccessTokenChange((newAccessToken) => {
      tokenStore.update((old) => ({
        ...old,
        accessToken: newAccessToken?.token ?? null
      }));
    });
    session.onInvalidate(() => {
      tokenStore.update((old) => ({
        ...old,
        accessToken: null,
        refreshToken: null,
      }));
    });

    let sessionsBySessionKey = this._sessionsByTokenStoreAndSessionKey.get(tokenStore) ?? new Map();
    this._sessionsByTokenStoreAndSessionKey.set(tokenStore, sessionsBySessionKey);
    sessionsBySessionKey.set(sessionKey, session);
    return session;
  }
  protected _getSession(overrideTokenStoreInit?: TokenStoreInit): InternalSession {
    const tokenStore = this._getOrCreateTokenStore(overrideTokenStoreInit);
    return this._getSessionFromTokenStore(tokenStore);
  }
  protected _useSession(overrideTokenStoreInit?: TokenStoreInit): InternalSession {
    const tokenStore = this._getOrCreateTokenStore(overrideTokenStoreInit);
    const subscribe = useCallback((cb: () => void) => {
      const { unsubscribe } = tokenStore.onChange(() => cb());
      return unsubscribe;
    }, [tokenStore]);
    const getSnapshot = useCallback(() => this._getSessionFromTokenStore(tokenStore), [tokenStore]);
    return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  protected async _signInToAccountWithTokens(tokens: { accessToken: string | null, refreshToken: string }) {
    const tokenStore = this._getOrCreateTokenStore();
    tokenStore.set(tokens);
  }

  protected _hasPersistentTokenStore(overrideTokenStoreInit?: TokenStoreInit): this is StackClientApp<true, ProjectId> {
    return (overrideTokenStoreInit !== undefined ? overrideTokenStoreInit : this._tokenStoreInit) !== null;
  }

  protected _ensurePersistentTokenStore(overrideTokenStoreInit?: TokenStoreInit): asserts this is StackClientApp<true, ProjectId>  {
    if (!this._hasPersistentTokenStore(overrideTokenStoreInit)) {
      throw new Error("Cannot call this function on a Stack app without a persistent token store. Make sure the tokenStore option on the constructor is set to a non-null value when initializing Stack.\n\nStack uses token stores to access access tokens of the current user. For example, on web frontends it is commonly the string value 'cookies' for cookie storage.");
    }
  }

  protected _isInternalProject(): this is { projectId: "internal" } {
    return this.projectId === "internal";
  }

  protected _ensureInternalProject(): asserts this is { projectId: "internal" } {
    if (!this._isInternalProject()) {
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

    async function getConnection(id: StandardProvider, options?: { scopes?: string[] }): Promise<OAuthConnection | null>;
    async function getConnection(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): Promise<OAuthConnection>;
    async function getConnection(id: StandardProvider, options?: { or?: 'redirect', scopes?: string[] }): Promise<OAuthConnection | null> {
      const scopeString = options?.scopes?.join(" ");
      return await app._currentUserOAuthConnectionCache.getOrWait([app._getSession(), id, scopeString || "", options?.or === 'redirect'], "write-only");
    }

    function useConnection(id: StandardProvider, options?: { scopes?: string[] }): OAuthConnection | null;
    function useConnection(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): OAuthConnection;
    function useConnection(id: StandardProvider, options?: { or?: 'redirect', scopes?: string[] }): OAuthConnection | null {
      const scopeString = options?.scopes?.join(" ");
      return useAsyncCache(app._currentUserOAuthConnectionCache, [app._useSession(), id, scopeString || "", options?.or === 'redirect'], "user.useConnection()");
    }

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
      getConnection,
      useConnection,
      async getSelectedTeam() {
        return await this.getTeam(json.selectedTeamId || "");
      },
      useSelectedTeam() {
        return this.useTeam(json.selectedTeamId || "");
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
      onTeamChange(teamId: string, callback: (team: Team | null) => void) {
        return this.onTeamsChange((teams) => {
          // TODO only call callback if the team actually changed
          const team = teams.find((t) => t.id === teamId) ?? null;
          callback(team);
        });
      },
      async listTeams() {
        const teams = await app._currentUserTeamsCache.getOrWait([app._getSession()], "write-only");
        return teams.map((json) => app._teamFromJson(json));
      },
      useTeams() {
        const session = app._useSession();
        const teams = useAsyncCache(app._currentUserTeamsCache, [session], "user.useTeams()");
        return useMemo(() => teams.map((json) => app._teamFromJson(json)), [teams]);
      },
      onTeamsChange(callback: (value: Team[], oldValue: Team[] | undefined) => void) {
        return app._currentUserTeamsCache.onChange([app._getSession()], (value, oldValue) => {
          callback(value.map((json) => app._teamFromJson(json)), oldValue?.map((json) => app._teamFromJson(json)));
        });
      },
      async listPermissions(scope: Team, options?: { direct?: boolean }): Promise<Permission[]> {
        const permissions = await app._currentUserPermissionsCache.getOrWait([app._getSession(), scope.id, 'team', !!options?.direct], "write-only");
        return permissions.map((json) => app._permissionFromJson(json));
      },
      usePermissions(scope: Team, options?: { direct?: boolean }): Permission[] {
        const permissions = useAsyncCache(app._currentUserPermissionsCache, [app._getSession(), scope.id, 'team', !!options?.direct], "user.usePermissions()");
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
        return (await this.getPermission(scope, permissionId)) !== null;
      },
      toJson() {
        return json;
      },
    };
  }

  protected _teamMemberFromJson(json: TeamMemberJson): TeamMember;
  protected _teamMemberFromJson(json: TeamMemberJson | null): TeamMember | null;
  protected _teamMemberFromJson(json: TeamMemberJson | null): TeamMember | null {
    if (json === null) return null;
    return {
      teamId: json.teamId,
      userId: json.userId,
      displayName: json.displayName,
    };
  }

  protected _authFromJson<T, C>(session: InternalSession): Auth<T, C> {
    const app = this;
    return {
      _internalSession: session,
      currentSession: {
        async getTokens() {
          const tokens = await session.getPotentiallyExpiredTokens();
          return {
            accessToken: tokens?.accessToken.token ?? null,
            refreshToken: tokens?.refreshToken?.token ?? null,
          };
        },
      },
      async getAuthHeaders(): Promise<{ "x-stack-auth": string }> {
        return {
          "x-stack-auth": JSON.stringify(await this.getAuthJson()),
        };
      },
      async getAuthJson(): Promise<{ accessToken: string | null, refreshToken: string | null }> {
        const tokens = await this.currentSession.getTokens();
        return tokens;
      },
      signOut() {
        return app._signOut(session);
      },
    
      // TODO these should not actually be on Auth, instead on User
      async setSelectedTeam(team: Team | null) {
        await app._updateUser({ selectedTeamId: team?.id ?? null }, session);
      },
      update(update) {
        // TODO make types work without `as any`
        return app._updateUser(update as any, session);
      },
      sendVerificationEmail() {
        return app._sendVerificationEmail(session);
      },
      updatePassword(options: { oldPassword: string, newPassword: string}) {
        return app._updatePassword(options, session);
      },
    };
  }

  protected _currentUserFromJson(json: UserJson, session: InternalSession): ProjectCurrentUser<ProjectId>;
  protected _currentUserFromJson(json: UserJson | null, session: InternalSession): ProjectCurrentUser<ProjectId> | null;
  protected _currentUserFromJson(json: UserJson | null, session: InternalSession): ProjectCurrentUser<ProjectId> | null {
    if (json === null) return null;
    const app = this;
    const currentUser: CurrentUser = {
      ...this._userFromJson(json),
      ...this._authFromJson(session),
    };
    if (this._isInternalProject()) {
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

  protected _createAdminInterface(forProjectId: string, session: InternalSession): StackAdminInterface {
    return new StackAdminInterface({
      baseUrl: this._interface.options.baseUrl,
      projectId: forProjectId,
      clientVersion,
      projectOwnerSession: session,
    });
  }

  get projectId(): ProjectId {
    return this._interface.projectId as ProjectId;
  }

  get urls(): Readonly<HandlerUrls> {
    return getUrls(this._urlOptions);
  }

  protected async _redirectTo(handlerName: keyof HandlerUrls, options?: RedirectToOptions) {
    const url = this.urls[handlerName];
    if (!url) {
      throw new Error(`No URL for handler name ${handlerName}`);
    }

    await _redirectTo(url, options);
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
  async redirectToError() { return await this._redirectTo("error"); }

  async sendForgotPasswordEmail(email: string): Promise<KnownErrors["UserNotFound"] | void> {
    const redirectUrl = constructRedirectUrl(this.urls.passwordReset);
    const error = await this._interface.sendForgotPasswordEmail(email, redirectUrl);
    return error;
  }

  async sendMagicLinkEmail(email: string): Promise<KnownErrors["RedirectUrlNotWhitelisted"] | void> {
    const magicLinkRedirectUrl = constructRedirectUrl(this.urls.magicLinkCallback);
    const error = await this._interface.sendMagicLinkEmail(email, magicLinkRedirectUrl);
    return error;
  }

  async resetPassword(options: { password: string, code: string }): Promise<KnownErrors["PasswordResetError"] | void> {
    const error = await this._interface.resetPassword(options);
    return error;
  }

  async verifyPasswordResetCode(code: string): Promise<KnownErrors["PasswordResetCodeError"] | void> {
    return await this._interface.verifyPasswordResetCode(code);
  }

  async verifyEmail(code: string): Promise<KnownErrors["EmailVerificationError"] | void> {
    return await this._interface.verifyEmail(code);
  }

  async getUser(options: GetUserOptions & { or: 'redirect' }): Promise<ProjectCurrentUser<ProjectId>>;
  async getUser(options: GetUserOptions & { or: 'throw' }): Promise<ProjectCurrentUser<ProjectId>>;
  async getUser(options?: GetUserOptions): Promise<ProjectCurrentUser<ProjectId> | null>;
  async getUser(options?: GetUserOptions): Promise<ProjectCurrentUser<ProjectId> | null> {
    this._ensurePersistentTokenStore(options?.tokenStore);
    const session = this._getSession(options?.tokenStore);
    const userJson = await this._currentUserCache.getOrWait([session], "write-only");

    if (userJson === null) {
      switch (options?.or) {
        case 'redirect': {
          await this.redirectToSignIn();
          break;
        }
        case 'throw': {
          throw new Error("User is not signed in but getUser was called with { or: 'throw' }");
        }
        default: {
          return null;
        }
      }
    }

    return this._currentUserFromJson(userJson, session);
  }

  useUser(options: GetUserOptions & { or: 'redirect' }): ProjectCurrentUser<ProjectId>;
  useUser(options: GetUserOptions & { or: 'throw' }): ProjectCurrentUser<ProjectId>;
  useUser(options?: GetUserOptions): ProjectCurrentUser<ProjectId> | null;
  useUser(options?: GetUserOptions): ProjectCurrentUser<ProjectId> | null {
    this._ensurePersistentTokenStore(options?.tokenStore);

    const router = NextNavigation.useRouter();
    const session = this._getSession(options?.tokenStore);
    const userJson = useAsyncCache(this._currentUserCache, [session], "useUser()");
    const triggerRedirectToSignIn = useTrigger(() => router.replace(this.urls.signIn));

    if (userJson === null) {
      switch (options?.or) {
        case 'redirect': {
          // Updating the router is not allowed during the component render function, so we do it in a different async tick
          // The error would be: "Cannot update a component (`Router`) while rendering a different component."
          triggerRedirectToSignIn();
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
      return this._currentUserFromJson(userJson, session);
    }, [userJson, session, options?.or]);
  }

  onUserChange(callback: (user: CurrentUser | null) => void) {
    this._ensurePersistentTokenStore();
    const session = this._getSession();
    return this._currentUserCache.onChange([session], (userJson) => {
      callback(this._currentUserFromJson(userJson, session));
    });
  }

  protected async _updateUser(update: UserUpdateJson, session: InternalSession) {
    const res = await this._interface.setClientUserCustomizableData(update, session);
    await this._refreshUser(session);
    return res;
  }

  async signInWithOAuth(provider: StandardProvider) {
    this._ensurePersistentTokenStore();
    await signInWithOAuth(
      this._interface, { 
        provider, 
        redirectUrl: this.urls.oauthCallback, 
        errorRedirectUrl: this.urls.error,
        providerScope: this._oauthScopesOnSignIn[provider]?.join(" "),
      }
    );
  }

  async signInWithCredential(options: {
    email: string,
    password: string,
  }): Promise<KnownErrors["EmailPasswordMismatch"] | void> {
    this._ensurePersistentTokenStore();
    const session = this._getSession();
    const result = await this._interface.signInWithCredential(options.email, options.password, session);
    if (!(result instanceof KnownError)) {
      await this._signInToAccountWithTokens(result);
      return await this.redirectToAfterSignIn({ replace: true });
    }
    return result;
  }

  async createUserWithCredential(options: {
    email: string,
  }): Promise<string | KnownErrors["UserEmailAlreadyExists"] | KnownErrors['PasswordRequirementsNotMet'] | undefined> {
    const emailVerificationRedirectUrl = constructRedirectUrl(this.urls.emailVerification);
    const password =generateSecureRandomString()
    const errorCode = await this._interface.signUpWithCredential(
      options.email,
      password,
      emailVerificationRedirectUrl,
      null,
    );
    if (!errorCode) {
      return password
    }
    return errorCode;
  }

  async signUpWithCredential(options: {
    email: string,
    password: string,
  }): Promise<KnownErrors["UserEmailAlreadyExists"] | KnownErrors['PasswordRequirementsNotMet'] | void> {
    this._ensurePersistentTokenStore();
    const session = this._getSession();
    const emailVerificationRedirectUrl = constructRedirectUrl(this.urls.emailVerification);
    const result = await this._interface.signUpWithCredential(
      options.email, 
      options.password, 
      emailVerificationRedirectUrl, 
      session
    );
    if (!(result instanceof KnownError)) {
      await this._signInToAccountWithTokens(result);
      return await this.redirectToAfterSignUp({ replace: true });
    }
    return result;
  }

  async signInWithMagicLink(code: string): Promise<KnownErrors["MagicLinkError"] | void> {
    this._ensurePersistentTokenStore();
    const session = this._getSession();
    const result = await this._interface.signInWithMagicLink(code, session);
    if (result instanceof KnownError) {
      return result;
    }
    await this._signInToAccountWithTokens(result);
    if (result.newUser) {
      await this.redirectToAfterSignUp({ replace: true });
    } else {
      await this.redirectToAfterSignIn({ replace: true });
    }
  }

  async callOAuthCallback() {
    this._ensurePersistentTokenStore();
    const result = await callOAuthCallback(this._interface, this.urls.oauthCallback);
    if (result) {
      await this._signInToAccountWithTokens(result);
      if (result.afterCallbackRedirectUrl) {
        await _redirectTo(result.afterCallbackRedirectUrl, { replace: true });
        return true;
      } else if (result.newUser) {
        await this.redirectToAfterSignUp({ replace: true });
        return true;
      } else {
        await this.redirectToAfterSignIn({ replace: true });
        return true;
      }
    }
    return false;
  }

  protected async _signOut(session: InternalSession): Promise<void> {
    await this._interface.signOut(session);
    await this.redirectToAfterSignOut();
  }

  protected async _sendVerificationEmail(session: InternalSession): Promise<KnownErrors["EmailAlreadyVerified"] | void> {
    const emailVerificationRedirectUrl = constructRedirectUrl(this.urls.emailVerification);
    return await this._interface.sendVerificationEmail(emailVerificationRedirectUrl, session);
  }

  protected async _updatePassword(
    options: { oldPassword: string, newPassword: string }, 
    session: InternalSession
  ): Promise<KnownErrors["PasswordMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | void> {
    return await this._interface.updatePassword(options, session);
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
    return useAsyncCache(this._currentProjectCache, [], "useProject()");
  }

  onProjectChange(callback: (project: ClientProjectJson) => void) {
    return this._currentProjectCache.onChange([], callback);
  }

  protected async _listOwnedProjects(): Promise<Project[]> {
    this._ensureInternalProject();
    const session = this._getSession();
    const json = await this._ownedProjectsCache.getOrWait([session], "write-only");
    return json.map((j) => this._projectAdminFromJson(
      j,
      this._createAdminInterface(j.id, session),
      () => this._refreshOwnedProjects(session),
    ));
  }

  protected _useOwnedProjects(): Project[] {
    this._ensureInternalProject();
    const session = this._getSession();
    const json = useAsyncCache(this._ownedProjectsCache, [session], "useOwnedProjects()");
    return useMemo(() => json.map((j) => this._projectAdminFromJson(
      j,
      this._createAdminInterface(j.id, session),
      () => this._refreshOwnedProjects(session),
    )), [json]);
  }

  protected _onOwnedProjectsChange(callback: (projects: Project[]) => void) {
    this._ensureInternalProject();
    const session = this._getSession();
    return this._ownedProjectsCache.onChange([session], (projects) => {
      callback(projects.map((j) => this._projectAdminFromJson(
        j,
        this._createAdminInterface(j.id, session),
        () => this._refreshOwnedProjects(session),
      )));
    });
  }

  protected async _createProject(newProject: ProjectUpdateOptions & { displayName: string }): Promise<Project> {
    this._ensureInternalProject();
    const session = this._getSession();
    const json = await this._interface.createProject(newProject, session);
    const res = this._projectAdminFromJson(
      json,
      this._createAdminInterface(json.id, session),
      () => this._refreshOwnedProjects(session),
    );
    await this._refreshOwnedProjects(session);
    return res;
  }

  protected async _refreshUser(session: InternalSession) {
    // TODO this should take a user ID instead of a session, and automatically refresh all sessions with that user ID
    await this._refreshSession(session);
  }

  protected async _refreshSession(session: InternalSession) {
    await this._currentUserCache.refresh([session]);
  }

  protected async _refreshUsers() {
    // nothing yet
  }
  
  protected async _refreshProject() {
    await this._currentProjectCache.refresh([]);
  }

  protected async _refreshOwnedProjects(session: InternalSession) {
    await this._ownedProjectsCache.refresh([session]);
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
          tokenStore: this._tokenStoreInit,
          urls: this._urlOptions,
          oauthScopesOnSignIn: this._oauthScopesOnSignIn,
          uniqueIdentifier: this._getUniqueIdentifier(),
        };
      },
      setCurrentUser: (userJsonPromise: Promise<UserJson | null>) => {
        runAsynchronously(this._currentUserCache.forceSetCachedValueAsync([this._getSession()], userJsonPromise));
      },
    };
  };
}

class _StackServerAppImpl<HasTokenStore extends boolean, ProjectId extends string> extends _StackClientAppImpl<HasTokenStore, ProjectId>
{
  declare protected _interface: StackServerInterface;

  // TODO override the client user cache to use the server user cache, so we save some requests
  private readonly _currentServerUserCache = createCacheBySession(async (session) => {
    const user = await this._interface.getServerUserByToken(session);
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
  private readonly _serverEmailTemplatesCache = createCache(async () => {
    return await this._interface.listEmailTemplates();
  });


  constructor(options: 
    | StackServerAppConstructorOptions<HasTokenStore, ProjectId>
    | {
      interface: StackServerInterface,
      tokenStore: TokenStoreInit<HasTokenStore>,
      urls: Partial<HandlerUrls> | undefined,
      oauthScopesOnSignIn?: Partial<OAuthScopesOnSignIn> | undefined,
    }
  ) {
    super("interface" in options ? {
      interface: options.interface,
      tokenStore: options.tokenStore,
      urls: options.urls,
      oauthScopesOnSignIn: options.oauthScopesOnSignIn,
    } : {
      interface: new StackServerInterface({
        baseUrl: options.baseUrl ?? getDefaultBaseUrl(),
        projectId: options.projectId ?? getDefaultProjectId(),
        clientVersion,
        publishableClientKey: options.publishableClientKey ?? getDefaultPublishableClientKey(),
        secretServerKey: options.secretServerKey ?? getDefaultSecretServerKey(),
      }),
      tokenStore: options.tokenStore,
      urls: options.urls ?? {},
      oauthScopesOnSignIn: options.oauthScopesOnSignIn ?? {},
    });
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
        const teams = await app._serverTeamsCache.getOrWait([app._getSession()], "write-only");
        return teams.map((json) => app._serverTeamFromJson(json));
      },
      useTeams() {
        const teams = useAsyncCache(app._serverTeamsCache, [app._getSession()], "user.useTeams()");
        return useMemo(() => teams.map((json) => app._serverTeamFromJson(json)), [teams]);
      },
      onTeamsChange(callback: (value: ServerTeam[], oldValue: ServerTeam[] | undefined) => void) {
        return app._serverTeamsCache.onChange([app._getSession()], (value, oldValue) => {
          callback(value.map((json) => app._serverTeamFromJson(json)), oldValue?.map((json) => app._serverTeamFromJson(json)));
        });
      },
      async listPermissions(scope: Team, options?: { direct?: boolean }): Promise<ServerPermission[]> {
        const permissions = await app._serverTeamUserPermissionsCache.getOrWait([scope.id, json.id, 'team', !!options?.direct], "write-only");
        return permissions.map((json) => app._serverPermissionFromJson(json));
      },
      usePermissions(scope: Team, options?: { direct?: boolean }): ServerPermission[] {
        const permissions = useAsyncCache(app._serverTeamUserPermissionsCache, [scope.id, json.id, 'team', !!options?.direct], "user.usePermissions()");
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
        return json;
      },
    };
  }

  protected _currentServerUserFromJson(json: ServerUserJson, session: InternalSession): ProjectCurrentSeverUser<ProjectId>;
  protected _currentServerUserFromJson(json: ServerUserJson | null, session: InternalSession): ProjectCurrentSeverUser<ProjectId> | null;
  protected _currentServerUserFromJson(json: ServerUserJson | null, session: InternalSession): ProjectCurrentSeverUser<ProjectId> | null {
    if (json === null) return null;
    const app = this;
    const nonCurrentServerUser = this._serverUserFromJson(json);
    const currentUser: CurrentServerUser = {
      ...nonCurrentServerUser,
      ...this._authFromJson(session),
      async delete() {
        const res = await nonCurrentServerUser.delete();
        // TODO instead of refreshing user session in this override, the normal ServerUser delete function should invalidate all sessions with that user ID
        // same for everywhere else where user sessions are refreshed
        await app._refreshUser(session);
        return res;
      },
      getClientUser() {
        return app._currentUserFromJson(json, session);
      },
    };

    if (this._isInternalProject()) {
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
        const result = useAsyncCache(app._serverTeamMembersCache, [json.id], "team.useUsers()");
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
    const session = this._getSession();
    const userJson = await this._currentServerUserCache.getOrWait([session], "write-only");
    return this._currentServerUserFromJson(userJson, session);
  }

  async getServerUserById(userId: string): Promise<ServerUser | null> {
    const json = await this._serverUserCache.getOrWait([userId], "write-only");
    return this._serverUserFromJson(json);
  }

  useServerUser(options?: { required: boolean }): ProjectCurrentSeverUser<ProjectId> | null {
    // TODO deprecate in favor of making useUser return server users automatically
    this._ensurePersistentTokenStore();

    const session = this._getSession();
    const userJson = useAsyncCache(this._currentServerUserCache, [session], "useServerUser()");

    return useMemo(() => {
      if (options?.required && userJson === null) {
        use(this.redirectToSignIn());
      }

      return this._currentServerUserFromJson(userJson, session);
    }, [userJson, session, options?.required]);
  }

  onServerUserChange(callback: (user: CurrentServerUser | null) => void) {
    this._ensurePersistentTokenStore();
    const session = this._getSession();
    return this._currentServerUserCache.onChange([session], (userJson) => {
      callback(this._currentServerUserFromJson(userJson, session));
    });
  }

  async listServerUsers(): Promise<ServerUser[]> {
    const json = await this._serverUsersCache.getOrWait([], "write-only");
    return json.map((j) => this._serverUserFromJson(j));
  }

  useServerUsers(): ServerUser[] {
    const json = useAsyncCache(this._serverUsersCache, [], "useServerUsers()");
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
    return useAsyncCache(this._serverTeamPermissionDefinitionsCache, [], "usePermissions()");
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
    const permission = this._serverPermissionFromJson(await this._interface.createPermissionDefinition(data));
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
    const teams = useAsyncCache(this._serverTeamsCache, [], "useServerTeams()");
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

  protected override async _refreshSession(session: InternalSession) {
    await Promise.all([
      super._refreshUser(session),
      this._currentServerUserCache.refresh([session]),
    ]);
  }

  protected override async _refreshUsers() {
    await Promise.all([
      super._refreshUsers(),
      this._serverUsersCache.refresh([]),
    ]);
  }

  useEmailTemplates(): ListEmailTemplatesCrud['Server']['Read'] {
    return useAsyncCache(this._serverEmailTemplatesCache, [], "useEmailTemplates()");
  }

  async listEmailTemplates(): Promise<ListEmailTemplatesCrud['Server']['Read']> {
    return await this._serverEmailTemplatesCache.getOrWait([], "write-only");
  }

  async updateEmailTemplate(type: EmailTemplateType, data: EmailTemplateCrud['Server']['Update']): Promise<void> {
    await this._interface.updateEmailTemplate(type, data);
    await this._serverEmailTemplatesCache.refresh([]);
  }

  async resetEmailTemplate(type: EmailTemplateType) {
    await this._interface.resetEmailTemplate(type);
    await this._serverEmailTemplatesCache.refresh([]);
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
        clientVersion,
        ..."projectOwnerSession" in options ? {
          projectOwnerSession: options.projectOwnerSession,
        } : {
          publishableClientKey: options.publishableClientKey ?? getDefaultPublishableClientKey(),
          secretServerKey: options.secretServerKey ?? getDefaultSecretServerKey(),
          superSecretAdminKey: options.superSecretAdminKey ?? getDefaultSuperSecretAdminKey(),
        },
      }),
      tokenStore: options.tokenStore,
      urls: options.urls,
      oauthScopesOnSignIn: options.oauthScopesOnSignIn,
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
    const json = useAsyncCache(this._adminProjectCache, [], "useProjectAdmin()");
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
    const json = useAsyncCache(this._apiKeySetsCache, [], "useApiKeySets()");
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

type RedirectToOptions = {
  replace?: boolean,
};

type Session = {
  getTokens(): Promise<{ accessToken: string | null, refreshToken: string | null }>,
};

/**
 * Contains everything related to the current user session.
 */
type Auth<T, C> = {
  readonly _internalSession: InternalSession,
  readonly currentSession: Session,
  signOut(this: T): Promise<void>,

  /**
   * Returns headers for sending authenticated HTTP requests to external servers. Most commonly used in cross-origin
   * requests. Similar to `getAuthJson`, but specifically for HTTP requests.
   * 
   * If you are using `tokenStore: "cookie"`, you don't need this for same-origin requests. However, most
   * browsers now disable third-party cookies by default, so we must pass authentication tokens by header instead
   * if the client and server are on different hostnames.
   *
   * This function returns a header object that can be used with `fetch` or other HTTP request libraries to send
   * authenticated requests.
   * 
   * On the server, you can then pass in the `Request` object to the `tokenStore` option
   * of your Stack app. Please note that CORS does not allow most headers by default, so you
   * must include `x-stack-auth` in the [`Access-Control-Allow-Headers` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
   * of the CORS preflight response.
   * 
   * If you are not using HTTP (and hence cannot set headers), you will need to use the `getAuthJson()` function
   * instead.
   * 
   * Example:
   * 
   * ```ts
   * // client
   * const res = await fetch("https://api.example.com", {
   *   headers: {
   *     ...await stackApp.getAuthHeaders()
   *     // you can also add your own headers here
   *   },
   * });
   * 
   * // server
   * function handleRequest(req: Request) {
   *   const user = await stackServerApp.getUser({ tokenStore: req });
   *   return new Response("Welcome, " + user.displayName);
   * }
   * ```
   */
  getAuthHeaders(): Promise<{ "x-stack-auth": string }>,

  /**
   * Creates a JSON-serializable object containing the information to authenticate a user on an external server.
   * Similar to `getAuthHeaders`, but returns an object that can be sent over any protocol instead of just
   * HTTP headers.
   * 
   * While `getAuthHeaders` is the recommended way to send authentication tokens over HTTP, your app may use
   * a different protocol, for example WebSockets or gRPC. This function returns a token object that can be JSON-serialized and sent to the server in any way you like.
   * 
   * On the server, you can pass in this token object into the `tokenStore` option to fetch user details.
   * 
   * Example:
   * 
   * ```ts
   * // client
   * const res = await rpcCall(rpcEndpoint, {
   *   data: {
   *     auth: await stackApp.getAuthJson(),
   *   },
   * });
   * 
   * // server
   * function handleRequest(data) {
   *   const user = await stackServerApp.getUser({ tokenStore: data.auth });
   *   return new Response("Welcome, " + user.displayName);
   * }
   * ```
   */
  getAuthJson(): Promise<{ accessToken: string | null, refreshToken: string | null }>,


  // TODO these should not actually be here
  update(this: T, user: C): Promise<void>,
  setSelectedTeam(this: T, team: Team | null): Promise<void>,
  sendVerificationEmail(this: T): Promise<KnownErrors["EmailAlreadyVerified"] | void>,
  updatePassword(this: T, options: { oldPassword: string, newPassword: string}): Promise<KnownErrors["PasswordMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | void>,
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
    getSelectedTeam(this: CurrentUser): Promise<Team | null>,
    useSelectedTeam(this: CurrentUser): Team | null,
    
    getConnection(id: StandardProvider, options?: { scopes?: string[] }): Promise<OAuthConnection | null>,
    getConnection(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): Promise<OAuthConnection>,
    getConnection(id: StandardProvider, options?: { or?: 'redirect', scopes?: string[] }): Promise<OAuthConnection | null>,
    useConnection(id: StandardProvider, options?: { scopes?: string[] }): OAuthConnection | null,
    useConnection(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): OAuthConnection,
    useConnection(id: StandardProvider, options?: { or?: 'redirect', scopes?: string[] }): OAuthConnection | null,

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


export type Connection = {
  id: string,
}

export type OAuthConnection = Connection & {
  getAccessToken(): Promise<{ accessToken: string }>,
  useAccessToken(): { accessToken: string },
}


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
  tokenStore?: TokenStoreInit,
};

type AsyncStoreProperty<Name extends string, Args extends any[], Value, IsMultiple extends boolean> =
  & { [key in `${IsMultiple extends true ? "list" : "get"}${Capitalize<Name>}`]: (...args: Args) => Promise<Value> }
  & { [key in `on${Capitalize<Name>}Change`]: (...tupleArgs: [...args: Args, callback: (value: Value) => void]) => void }
  & { [key in `use${Capitalize<Name>}`]: (...args: Args) => Value }

export type StackClientApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = (
  & {
    readonly projectId: ProjectId,

    readonly urls: Readonly<HandlerUrls>,

    signInWithOAuth(provider: string): Promise<void>,
    signInWithCredential(options: { email: string, password: string }): Promise<KnownErrors["EmailPasswordMismatch"] | void>,
    signUpWithCredential(options: { email: string, password: string }): Promise<KnownErrors["UserEmailAlreadyExists"] | KnownErrors["PasswordRequirementsNotMet"] | void>,
    createUserWithCredential(options: { email: string }): Promise<string | KnownErrors["UserEmailAlreadyExists"] | KnownErrors["PasswordRequirementsNotMet"] | undefined>,
    callOAuthCallback(): Promise<boolean>,
    sendForgotPasswordEmail(email: string): Promise<KnownErrors["UserNotFound"] | void>,
    sendMagicLinkEmail(email: string): Promise<KnownErrors["RedirectUrlNotWhitelisted"] | void>,
    resetPassword(options: { code: string, password: string }): Promise<KnownErrors["PasswordResetError"] | void>,
    verifyPasswordResetCode(code: string): Promise<KnownErrors["PasswordResetCodeError"] | void>,
    verifyEmail(code: string): Promise<KnownErrors["EmailVerificationError"] | void>,
    signInWithMagicLink(code: string): Promise<KnownErrors["MagicLinkError"] | void>,

    [stackAppInternalsSymbol]: {
      toClientJson(): StackClientAppJson<HasTokenStore, ProjectId>,
      setCurrentUser(userJsonPromise: Promise<UserJson | null>): void,
    },
  }
  & AsyncStoreProperty<"project", [], ClientProjectJson, false>
  & { [K in `redirectTo${Capitalize<keyof Omit<HandlerUrls, 'handler' | 'oauthCallback'>>}`]: (options?: RedirectToOptions) => Promise<void> }
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
    useEmailTemplates(): ListEmailTemplatesCrud['Server']['Read'],
    listEmailTemplates(): Promise<ListEmailTemplatesCrud['Server']['Read']>,
    updateEmailTemplate(type: EmailTemplateType, data: EmailTemplateCrud['Server']['Update']): Promise<void>,
    resetEmailTemplate(type: EmailTemplateType): Promise<void>,
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
