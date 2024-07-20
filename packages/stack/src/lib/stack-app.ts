import { isReactServer } from "@stackframe/stack-sc";
import { KnownError, KnownErrors, StackAdminInterface, StackClientInterface, StackServerInterface } from "@stackframe/stack-shared";
import { ProductionModeError, getProductionModeErrors } from "@stackframe/stack-shared/dist/helpers/production-mode";
import { ApiKeyCreateCrudRequest, ApiKeyCreateCrudResponse } from "@stackframe/stack-shared/dist/interface/adminInterface";
import { StandardProvider } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ApiKeysCrud } from "@stackframe/stack-shared/dist/interface/crud/api-keys";
import { CurrentUserCrud } from "@stackframe/stack-shared/dist/interface/crud/current-user";
import { EmailTemplateCrud, EmailTemplateType } from "@stackframe/stack-shared/dist/interface/crud/email-templates";
import { InternalProjectsCrud, ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { TeamPermissionDefinitionsCrud, TeamPermissionsCrud } from "@stackframe/stack-shared/dist/interface/crud/team-permissions";
import { TeamsCrud } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { InternalSession } from "@stackframe/stack-shared/dist/sessions";
import { AsyncCache } from "@stackframe/stack-shared/dist/utils/caches";
import { scrambleDuringCompileTime } from "@stackframe/stack-shared/dist/utils/compile-time";
import { isBrowserLike } from "@stackframe/stack-shared/dist/utils/env";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { ReadonlyJson } from "@stackframe/stack-shared/dist/utils/json";
import { DependenciesMap } from "@stackframe/stack-shared/dist/utils/maps";
import { deepPlainEquals, filterUndefined, omit } from "@stackframe/stack-shared/dist/utils/objects";
import { ReactPromise, neverResolve, runAsynchronously, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { suspend, suspendIfSsr } from "@stackframe/stack-shared/dist/utils/react";
import { Result } from "@stackframe/stack-shared/dist/utils/results";
import { Store } from "@stackframe/stack-shared/dist/utils/stores";
import { mergeScopeStrings } from "@stackframe/stack-shared/dist/utils/strings";
import { generateUuid } from "@stackframe/stack-shared/dist/utils/uuids";
import * as cookie from "cookie";
import * as NextNavigationUnscrambled from "next/navigation"; // import the entire module to get around some static compiler warnings emitted by Next.js in some cases
import React, { useCallback, useMemo } from "react";
import { constructRedirectUrl } from "../utils/url";
import { addNewOAuthProviderOrScope, callOAuthCallback, signInWithOAuth } from "./auth";
import { deleteCookie, getCookie, setOrDeleteCookie } from "./cookie";

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
type ProjectCurrentServerUser<ProjectId> = ProjectId extends "internal" ? CurrentInternalServerUser : CurrentServerUser;

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
  tokenStore: TokenStoreInit<HasTokenStore>,

  /**
   * By default, the Stack app will automatically prefetch some data from Stack's server when this app is first
   * constructed. This improves the performance of your app, but will create network requests that are unnecessary if
   * the app is never used or disposed of immediately. To disable this behavior, set this option to true.
   */
  noAutomaticPrefetch?: boolean,
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

const defaultBaseUrl = "https://api.stack-auth.com";

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

const cachePromiseByComponentId = new Map<string, Promise<unknown>>();
function useAsyncCache<D extends any[], T>(cache: AsyncCache<D, T>, dependencies: D, caller: string): T {
  // we explicitly don't want to run this hook in SSR
  suspendIfSsr(caller);

  const id = React.useId();

  const subscribe = useCallback((cb: () => void) => {
    const { unsubscribe } = cache.onStateChange(dependencies, () => {
      cachePromiseByComponentId.delete(id);
      cb();
    });
    return unsubscribe;
  }, [cache, ...dependencies]);
  const getSnapshot = useCallback(() => {
    // React checks whether a promise passed to `use` is still the same as the previous one by comparing the reference.
    // If we didn't cache here, this wouldn't work because the promise would be recreated every time the value changes.
    if (!cachePromiseByComponentId.has(id)) {
      cachePromiseByComponentId.set(id, cache.getOrWait(dependencies, "read-write"));
    }
    return cachePromiseByComponentId.get(id) as ReactPromise<T>;
  }, [cache, ...dependencies]);

  // note: we must use React.useSyncExternalStore instead of importing the function directly, as it will otherwise
  // throw an error ("can't import useSyncExternalStore from the server")
  const promise = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => throwErr(new Error("getServerSnapshot should never be called in useAsyncCache because we restrict to CSR earlier"))
  );

  return React.use(promise);
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
  private readonly _ownedAdminApps = new DependenciesMap<[InternalSession, string], _StackAdminAppImpl<false, string>>();

  private readonly _currentUserCache = createCacheBySession(async (session) => {
    if (this.__DEMO_ENABLE_SLIGHT_FETCH_DELAY) {
      await wait(2000);
    }
    return await this._interface.getClientUserByToken(session);
  });
  private readonly _currentProjectCache = createCache(async () => {
    return Result.orThrow(await this._interface.getClientProject());
  });
  private readonly _ownedProjectsCache = createCacheBySession(async (session) => {
    return await this._interface.listProjects(session);
  });
  private readonly _currentUserPermissionsCache = createCacheBySession<
    [string, boolean],
    TeamPermissionsCrud['Client']['Read'][]
  >(async (session, [teamId, recursive]) => {
    return await this._interface.listCurrentUserTeamPermissions({ teamId, recursive }, session);
  });
  private readonly _currentUserTeamsCache = createCacheBySession(async (session) => {
    return await this._interface.listCurrentUserTeams(session);
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
      if (!user || !user.oauth_providers.find((p) => p.id === connectionId)) {
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
          session,
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
      | Pick<StackClientAppConstructorOptions<HasTokenStore, ProjectId>, "tokenStore" | "urls" | "oauthScopesOnSignIn" | "noAutomaticPrefetch"> & {
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

    if (!_options.noAutomaticPrefetch) {
      numberOfAppsCreated++;
      if (numberOfAppsCreated > 10) {
        (process.env.NODE_ENV === "development" ? console.log : console.warn)(`You have created more than 10 Stack apps with automatic pre-fetch enabled (${numberOfAppsCreated}). This is usually a sign of a memory leak, but can sometimes be caused by hot reload of your tech stack. If you are getting this error and it is not caused by hot reload, make sure to minimize the number of Stack apps per page (usually, one per project). (If it is caused by hot reload and does not occur in production, you can safely ignore it.)`);
      }
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
   * initialized). For that reason, we generate the unique identifier lazily when it is first needed instead of in the
   * constructor.
   */
  protected _getUniqueIdentifier() {
    if (!this._uniqueIdentifier) {
      this._uniqueIdentifier = generateUuid();
      this._initUniqueIdentifier();
    }
    return this._uniqueIdentifier!;
  }

  protected async _checkFeatureSupport(featureName: string, options: any) {
    return await this._interface.checkFeatureSupport({ ...options, featureName });
  }

  protected _useCheckFeatureSupport(featureName: string, options: any): never {
    runAsynchronously(this._checkFeatureSupport(featureName, options));
    throw new StackAssertionError(`${featureName} is not currently supported. Please reach out to Stack support for more information.`);
  }

  protected _memoryTokenStore = createEmptyTokenStore();
  protected _requestTokenStores = new WeakMap<RequestLike, Store<TokenObject>>();
  protected _storedCookieTokenStore: Store<TokenObject> | null = null;
  protected get _refreshTokenCookieName() {
    return `stack-refresh-${this.projectId}`;
  }
  protected _getTokensFromCookies(cookies: { refreshTokenCookie: string | null, accessTokenCookie: string | null }): TokenObject {
    const refreshToken = cookies.refreshTokenCookie;
    const accessTokenObject = cookies.accessTokenCookie?.startsWith('[\"') ? JSON.parse(cookies.accessTokenCookie) : null;  // gotta check for validity first for backwards-compat, and also in case someone messes with the cookie value
    const accessToken = accessTokenObject && refreshToken === accessTokenObject[0] ? accessTokenObject[1] : null;  // if the refresh token has changed, the access token is invalid
    return {
      refreshToken,
      accessToken,
    };
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
      const getCurrentValue = (old: TokenObject | null) => {
        const tokens = this._getTokensFromCookies({
          refreshTokenCookie: getCookie(this._refreshTokenCookieName) ?? getCookie('stack-refresh'),  // keep old cookie name for backwards-compatibility
          accessTokenCookie: getCookie(this._accessTokenCookieName),
        });
        return {
          refreshToken: tokens.refreshToken,
          accessToken: tokens.accessToken ?? (old?.refreshToken === tokens.refreshToken ? old.accessToken : null),
        };
      };
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
          setOrDeleteCookie(this._accessTokenCookieName, value.accessToken ? JSON.stringify([value.refreshToken, value.accessToken]) : null, { maxAge: 60 * 60 * 24 });
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
          const tokens = this._getTokensFromCookies({
            refreshTokenCookie: getCookie(this._refreshTokenCookieName) ?? getCookie('stack-refresh'),  // keep old cookie name for backwards-compatibility
            accessTokenCookie: getCookie(this._accessTokenCookieName),
          });
          const store = new Store<TokenObject>(tokens);
          store.onChange((value) => {
            try {
              setOrDeleteCookie(this._refreshTokenCookieName, value.refreshToken, { maxAge: 60 * 60 * 24 * 365 });
              setOrDeleteCookie(this._accessTokenCookieName, value.accessToken ? JSON.stringify([value.refreshToken, value.accessToken]) : null, { maxAge: 60 * 60 * 24 });
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
      const { unsubscribe } = tokenStore.onChange(() => {
        cb();
      });
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

  protected _clientProjectFromCrud(crud: ProjectsCrud['Client']['Read']): Project {
    return {
      id: crud.id,
      config: {
        credentialEnabled: crud.config.credential_enabled,
        magicLinkEnabled: crud.config.magic_link_enabled,
        oauthProviders: crud.config.enabled_oauth_providers.map((p) => ({
          id: p.id,
        })),
      }
    };
  }

  protected _clientTeamPermissionFromCrud(crud: TeamPermissionsCrud['Client']['Read']): TeamPermission {
    return {
      id: crud.id,
    };
  }

  protected _clientTeamFromCrud(crud: TeamsCrud['Client']['Read']): Team {
    return {
      id: crud.id,
      displayName: crud.display_name,
      profileImageUrl: crud.profile_image_url,
    };
  }

  protected _createAuth(session: InternalSession): Auth {
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
    };
  }

  protected _createBaseUser(crud: CurrentUserCrud['Client']['Read']): BaseUser {
    if (!crud) {
      throw new StackAssertionError("User not found");
    }
    return {
      projectId: crud.project_id,
      id: crud.id,
      displayName: crud.display_name,
      primaryEmail: crud.primary_email,
      primaryEmailVerified: crud.primary_email_verified,
      profileImageUrl: crud.profile_image_url,
      signedUpAt: new Date(crud.signed_up_at_millis),
      clientMetadata: crud.client_metadata,
      hasPassword: crud.has_password,
      emailAuthEnabled: crud.auth_with_email,
      oauthProviders: crud.oauth_providers,
      selectedTeam: crud.selected_team && this._clientTeamFromCrud(crud.selected_team),
      toClientJson(): CurrentUserCrud['Client']['Read'] {
        return crud;
      }
    };
  }

  protected _createCurrentUserExtra(crud: CurrentUserCrud['Client']['Read'], session: InternalSession): UserExtra {
    const app = this;
    async function getConnectedAccount(id: StandardProvider, options?: { scopes?: string[] }): Promise<OAuthConnection | null>;
    async function getConnectedAccount(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): Promise<OAuthConnection>;
    async function getConnectedAccount(id: StandardProvider, options?: { or?: 'redirect', scopes?: string[] }): Promise<OAuthConnection | null> {
      const scopeString = options?.scopes?.join(" ");
      return await app._currentUserOAuthConnectionCache.getOrWait([session, id, scopeString || "", options?.or === 'redirect'], "write-only");
    }

    function useConnectedAccount(id: StandardProvider, options?: { scopes?: string[] }): OAuthConnection | null;
    function useConnectedAccount(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): OAuthConnection;
    function useConnectedAccount(id: StandardProvider, options?: { or?: 'redirect', scopes?: string[] }): OAuthConnection | null {
      const scopeString = options?.scopes?.join(" ");
      return useAsyncCache(app._currentUserOAuthConnectionCache, [session, id, scopeString || "", options?.or === 'redirect'], "user.useConnectedAccount()");
    }

    return {
      setDisplayName(displayName: string) {
        return this.update({ displayName });
      },
      setClientMetadata(metadata: Record<string, any>) {
        return this.update({ clientMetadata: metadata });
      },
      async setSelectedTeam(team: Team | null) {
        await this.update({ selectedTeamId: team?.id ?? null });
      },
      getConnectedAccount: getConnectedAccount,
      useConnectedAccount: useConnectedAccount,
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
      async listTeams() {
        const teams = await app._currentUserTeamsCache.getOrWait([session], "write-only");
        return teams.map((crud) => app._clientTeamFromCrud(crud));
      },
      useTeams() {
        const teams = useAsyncCache(app._currentUserTeamsCache, [session], "user.useTeams()");
        return useMemo(() => teams.map((crud) => app._clientTeamFromCrud(crud)), [teams]);
      },
      async createTeam(data: TeamCreateOptions) {
        const crud = await app._interface.createTeamForCurrentUser(teamCreateOptionsToCrud(data), session);
        await app._currentUserTeamsCache.refresh([session]);
        return app._clientTeamFromCrud(crud);
      },
      async listPermissions(scope: Team, options?: { recursive?: boolean }): Promise<TeamPermission[]> {
        const recursive = options?.recursive ?? true;
        const permissions = await app._currentUserPermissionsCache.getOrWait([session, scope.id, recursive], "write-only");
        return permissions.map((crud) => app._clientTeamPermissionFromCrud(crud));
      },
      usePermissions(scope: Team, options?: { recursive?: boolean }): TeamPermission[] {
        const recursive = options?.recursive ?? true;
        const permissions = useAsyncCache(app._currentUserPermissionsCache, [session, scope.id, recursive], "user.usePermissions()");
        return useMemo(() => permissions.map((crud) => app._clientTeamPermissionFromCrud(crud)), [permissions]);
      },
      usePermission(scope: Team, permissionId: string): TeamPermission | null {
        const permissions = this.usePermissions(scope);
        return useMemo(() => permissions.find((p) => p.id === permissionId) ?? null, [permissions, permissionId]);
      },
      async getPermission(scope: Team, permissionId: string): Promise<TeamPermission | null> {
        const permissions = await this.listPermissions(scope);
        return permissions.find((p) => p.id === permissionId) ?? null;
      },
      async hasPermission(scope: Team, permissionId: string): Promise<boolean> {
        return (await this.getPermission(scope, permissionId)) !== null;
      },
      update(update) {
        return app._updateClientUser(update, session);
      },
      sendVerificationEmail() {
        return app._sendVerificationEmail(session);
      },
      updatePassword(options: { oldPassword: string, newPassword: string}) {
        return app._updatePassword(options, session);
      },
    };
  }

  protected _createInternalUserExtra(session: InternalSession): InternalUserExtra {
    const app = this;
    this._ensureInternalProject();
    return {
      createProject(newProject: AdminProjectUpdateOptions & { displayName: string }) {
        return app._createProject(session, newProject);
      },
      listOwnedProjects() {
        return app._listOwnedProjects(session);
      },
      useOwnedProjects() {
        return app._useOwnedProjects(session);
      },
    };
  }

  protected _currentUserFromCrud(crud: CurrentUserCrud['Client']['Read'], session: InternalSession): ProjectCurrentUser<ProjectId> {
    const currentUser = {
      ...this._createBaseUser(crud),
      ...this._createAuth(session),
      ...this._createCurrentUserExtra(crud, session),
      ...this._isInternalProject() ? this._createInternalUserExtra(session) : {},
    } satisfies CurrentUser;

    Object.freeze(currentUser);
    return currentUser as ProjectCurrentUser<ProjectId>;
  }

  protected _getOwnedAdminApp(forProjectId: string, session: InternalSession): _StackAdminAppImpl<false, string> {
    if (!this._ownedAdminApps.has([session, forProjectId])) {
      this._ownedAdminApps.set([session, forProjectId], new _StackAdminAppImpl({
        baseUrl: this._interface.options.baseUrl,
        projectId: forProjectId,
        tokenStore: null,
        projectOwnerSession: session,
        noAutomaticPrefetch: true,
      }));
    }
    return this._ownedAdminApps.get([session, forProjectId])!;
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

  async resetPassword(options: { password: string, code: string }): Promise<KnownErrors["VerificationCodeError"] | void> {
    const error = await this._interface.resetPassword(options);
    return error;
  }

  async verifyPasswordResetCode(code: string): Promise<KnownErrors["VerificationCodeError"] | void> {
    return await this._interface.verifyPasswordResetCode(code);
  }

  async verifyEmail(code: string): Promise<KnownErrors["VerificationCodeError"] | void> {
    return await this._interface.verifyEmail(code);
  }

  async getUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): Promise<ProjectCurrentUser<ProjectId>>;
  async getUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): Promise<ProjectCurrentUser<ProjectId>>;
  async getUser(options?: GetUserOptions<HasTokenStore>): Promise<ProjectCurrentUser<ProjectId> | null>;
  async getUser(options?: GetUserOptions<HasTokenStore>): Promise<ProjectCurrentUser<ProjectId> | null> {
    this._ensurePersistentTokenStore(options?.tokenStore);
    const session = this._getSession(options?.tokenStore);
    const crud = await this._currentUserCache.getOrWait([session], "write-only");

    if (crud === null) {
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

    return crud && this._currentUserFromCrud(crud, session);
  }

  useUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): ProjectCurrentUser<ProjectId>;
  useUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): ProjectCurrentUser<ProjectId>;
  useUser(options?: GetUserOptions<HasTokenStore>): ProjectCurrentUser<ProjectId> | null;
  useUser(options?: GetUserOptions<HasTokenStore>): ProjectCurrentUser<ProjectId> | null {
    this._ensurePersistentTokenStore(options?.tokenStore);

    const router = NextNavigation.useRouter();
    const session = this._useSession(options?.tokenStore);
    const crud = useAsyncCache(this._currentUserCache, [session], "useUser()");

    if (crud === null) {
      switch (options?.or) {
        case 'redirect': {
          // Updating the router is not allowed during the component render function, so we do it in a different async tick
          // The error would be: "Cannot update a component (`Router`) while rendering a different component."
          setTimeout(() => router.replace(this.urls.signIn), 0);
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
      return crud && this._currentUserFromCrud(crud, session);
    }, [crud, session, options?.or]);
  }

  protected async _updateClientUser(update: UserUpdateOptions, session: InternalSession) {
    const res = await this._interface.updateClientUser(userUpdateOptionsToCrud(update), session);
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

  async signInWithMagicLink(code: string): Promise<KnownErrors["VerificationCodeError"] | void> {
    this._ensurePersistentTokenStore();
    const result = await this._interface.signInWithMagicLink(code);
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
  ): Promise<KnownErrors["PasswordConfirmationMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | void> {
    return await this._interface.updatePassword(options, session);
  }

  async signOut(): Promise<void> {
    const user = await this.getUser();
    if (user) {
      await user.signOut();
    }
  }

  async getProject(): Promise<Project> {
    const crud = await this._currentProjectCache.getOrWait([], "write-only");
    return this._clientProjectFromCrud(crud);
  }

  useProject(): Project {
    const crud = useAsyncCache(this._currentProjectCache, [], "useProject()");
    return useMemo(() => this._clientProjectFromCrud(crud), [crud]);
  }

  protected async _listOwnedProjects(session: InternalSession): Promise<AdminOwnedProject[]> {
    this._ensureInternalProject();
    const crud = await this._ownedProjectsCache.getOrWait([session], "write-only");
    return crud.map((j) => this._getOwnedAdminApp(j.id, session)._adminOwnedProjectFromCrud(
      j,
      () => this._refreshOwnedProjects(session),
    ));
  }

  protected _useOwnedProjects(session: InternalSession): AdminOwnedProject[] {
    this._ensureInternalProject();
    const projects = useAsyncCache(this._ownedProjectsCache, [session], "useOwnedProjects()");
    return useMemo(() => projects.map((j) => this._getOwnedAdminApp(j.id, session)._adminOwnedProjectFromCrud(
      j,
      () => this._refreshOwnedProjects(session),
    )), [projects]);
  }

  protected async _createProject(session: InternalSession, newProject: AdminProjectUpdateOptions & { displayName: string }): Promise<AdminOwnedProject> {
    this._ensureInternalProject();
    const crud = await this._interface.createProject(adminProjectCreateOptionsToCrud(newProject), session);
    const res = this._getOwnedAdminApp(crud.id, session)._adminOwnedProjectFromCrud(
      crud,
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
      setCurrentUser: (userJsonPromise: Promise<CurrentUserCrud['Client']['Read'] | null>) => {
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
    return await this._interface.getServerUserByToken(session);
  });
  private readonly _serverUsersCache = createCache(async () => {
    return await this._interface.listServerUsers();
  });
  private readonly _serverUserCache = createCache<string[], UsersCrud['Server']['Read'] | null>(async ([userId]) => {
    const user = await this._interface.getServerUserById(userId);
    return Result.or(user, null);
  });
  private readonly _serverTeamsCache = createCache(async () => {
    return await this._interface.listServerTeams();
  });
  private readonly _serverCurrentUserTeamsCache = createCacheBySession(async (session) => {
    return await this._interface.listServerCurrentUserTeams(session);
  });
  private readonly _serverTeamUsersCache = createCache<
    string[],
    UsersCrud['Server']['Read'][]
  >(async ([teamId]) => {
    return await this._interface.listServerTeamUsers(teamId);
  });
  private readonly _serverTeamUserPermissionsCache = createCache<
    [string, string, boolean],
    TeamPermissionsCrud['Server']['Read'][]
  >(async ([teamId, userId, recursive]) => {
    return await this._interface.listServerTeamMemberPermissions({ teamId, userId, recursive });
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

  protected override _createBaseUser(crud: UsersCrud['Server']['Read']): ServerBaseUser;
  protected override _createBaseUser(crud: CurrentUserCrud['Client']['Read']): BaseUser;
  protected override _createBaseUser(crud: CurrentUserCrud['Client']['Read'] | UsersCrud['Server']['Read']): BaseUser | ServerBaseUser {
    if (!crud) {
      throw new StackAssertionError("User not found");
    }
    return {
      ...super._createBaseUser(crud),
      ..."server_metadata" in crud ? {
        // server user
        serverMetadata: crud.server_metadata,
      } : {},
    };
  }

  protected override _createCurrentUserExtra(crud: UsersCrud['Server']['Read']): ServerUserExtra;
  protected override _createCurrentUserExtra(crud: CurrentUserCrud['Client']['Read']): UserExtra;
  protected override _createCurrentUserExtra(crud: CurrentUserCrud['Client']['Read'] | UsersCrud['Server']['Read']): ServerUserExtra {
    if (!crud) {
      throw new StackAssertionError("User not found");
    }
    const app = this;
    return {
      async setDisplayName(displayName: string) {
        return await this.update({ displayName });
      },
      async setClientMetadata(metadata: Record<string, any>) {
        return await this.update({ clientMetadata: metadata });
      },
      async setServerMetadata(metadata: Record<string, any>) {
        return await this.update({ serverMetadata: metadata });
      },
      async setSelectedTeam(team: Team | null) {
        return await this.update({ selectedTeamId: team?.id ?? null });
      },
      async setPrimaryEmail(email: string, options?: { verified?: boolean }) {
        return await this.update({ primaryEmail: email, primaryEmailVerified: options?.verified });
      },
      getConnectedAccount: async () => {
        return await app._checkFeatureSupport("getConnectedAccount() on ServerUser", {});
      },
      useConnectedAccount: () => {
        return app._useCheckFeatureSupport("useConnectedAccount() on ServerUser", {});
      },
      async getTeam(teamId: string) {
        const teams = await this.listTeams();
        return teams.find((t) => t.id === teamId) ?? null;
      },
      useTeam(teamId: string) {
        return app._useCheckFeatureSupport("useTeam() on ServerUser", {});
      },
      async listTeams() {
        const crud = await app._serverCurrentUserTeamsCache.getOrWait([app._getSession()], "write-only");
        return crud.map((t) => app._serverTeamFromCrud(t));
      },
      useTeams() {
        return app._useCheckFeatureSupport("useTeams() on ServerUser", {});
      },
      createTeam: async (data: ServerTeamCreateOptions) => {
        const team =  await app._interface.createServerTeam(serverTeamCreateOptionsToCrud(data), app._getSession());
        await app._serverTeamsCache.refresh([]);
        return app._serverTeamFromCrud(team);
      },
      async listPermissions(scope: Team, options?: { recursive?: boolean }): Promise<AdminTeamPermission[]> {
        const recursive = options?.recursive ?? true;
        const permissions = await app._serverTeamUserPermissionsCache.getOrWait([scope.id, crud.id, recursive], "write-only");
        return permissions.map((crud) => app._serverPermissionFromCrud(crud));
      },
      usePermissions(scope: Team, options?: { recursive?: boolean }): AdminTeamPermission[] {
        const recursive = options?.recursive ?? true;
        const permissions = useAsyncCache(app._serverTeamUserPermissionsCache, [scope.id, crud.id, recursive], "user.usePermissions()");
        return useMemo(() => permissions.map((crud) => app._serverPermissionFromCrud(crud)), [permissions]);
      },
      async getPermission(scope: Team, permissionId: string): Promise<AdminTeamPermission | null> {
        const permissions = await this.listPermissions(scope);
        return permissions.find((p) => p.id === permissionId) ?? null;
      },
      usePermission(scope: Team, permissionId: string): AdminTeamPermission | null {
        const permissions = this.usePermissions(scope);
        return useMemo(() => permissions.find((p) => p.id === permissionId) ?? null, [permissions, permissionId]);
      },
      async hasPermission(scope: Team, permissionId: string): Promise<boolean> {
        return await this.getPermission(scope, permissionId) !== null;
      },
      async grantPermission(scope: Team, permissionId: string): Promise<void> {
        await app._interface.grantServerTeamUserPermission(scope.id, crud.id, permissionId);
        for (const recursive of [true, false]) {
          await app._serverTeamUserPermissionsCache.refresh([scope.id, crud.id, recursive]);
        }
      },
      async revokePermission(scope: Team, permissionId: string): Promise<void> {
        await app._interface.revokeServerTeamUserPermission(scope.id, crud.id, permissionId);
        for (const recursive of [true, false]) {
          await app._serverTeamUserPermissionsCache.refresh([scope.id, crud.id, recursive]);
        }
      },
      async delete() {
        const res = await app._interface.deleteServerServerUser(crud.id);
        await app._refreshUsers();
        return res;
      },
      async update(update: ServerUserUpdateOptions) {
        const res = await app._interface.updateServerUser(crud.id, serverUserUpdateOptionsToCrud(update));
        await app._refreshUsers();
      },
      async sendVerificationEmail() {
        return await app._checkFeatureSupport("sendVerificationEmail() on ServerUser", {});
      },
      async updatePassword(options: { oldPassword?: string, newPassword: string}) {
        return await app._checkFeatureSupport("updatePassword() on ServerUser", {});
      },
    };
  }

  protected _serverUserFromCrud(crud: UsersCrud['Server']['Read']): ServerUser {
    return {
      ...this._createBaseUser(crud),
      ...this._createCurrentUserExtra(crud),
    };
  }

  protected override _currentUserFromCrud(crud: UsersCrud['Server']['Read'], session: InternalSession): ProjectCurrentServerUser<ProjectId> {
    const app = this;
    const currentUser = {
      ...this._serverUserFromCrud(crud),
      ...this._createAuth(session),
      ...this._isInternalProject() ? this._createInternalUserExtra(session) : {},
    } satisfies ServerUser;

    Object.freeze(currentUser);
    return currentUser as ProjectCurrentServerUser<ProjectId>;
  }

  protected _serverTeamFromCrud(crud: TeamsCrud['Server']['Read']): ServerTeam {
    const app = this;
    return {
      id: crud.id,
      displayName: crud.display_name,
      profileImageUrl: crud.profile_image_url,
      createdAt: new Date(crud.created_at_millis),
      async listUsers() {
        return (await app._interface.listServerTeamUsers(crud.id)).map((u) => app._serverUserFromCrud(u));
      },
      async update(update: Partial<ServerTeamUpdateOptions>) {
        await app._interface.updateServerTeam(crud.id, serverTeamUpdateOptionsToCrud(update));
        await app._serverTeamsCache.refresh([]);
      },
      async delete() {
        await app._interface.deleteServerTeam(crud.id);
        await app._serverTeamsCache.refresh([]);
      },
      useUsers() {
        const result = useAsyncCache(app._serverTeamUsersCache, [crud.id], "team.useUsers()");
        return useMemo(() => result.map((u) => app._serverUserFromCrud(u)), [result]);
      },
      async addUser(userId) {
        await app._interface.addServerUserToTeam({
          teamId: crud.id,
          userId,
        });
        await app._serverTeamUsersCache.refresh([crud.id]);
      },
      async removeUser(userId) {
        await app._interface.removeServerUserFromTeam({
          teamId: crud.id,
          userId,
        });
        await app._serverTeamUsersCache.refresh([crud.id]);
      },
    };
  }


  async getUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): Promise<ProjectCurrentServerUser<ProjectId>>;
  async getUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): Promise<ProjectCurrentServerUser<ProjectId>>;
  async getUser(options?: GetUserOptions<HasTokenStore>): Promise<ProjectCurrentServerUser<ProjectId> | null>;
  async getUser(options?: GetUserOptions<HasTokenStore>): Promise<ProjectCurrentServerUser<ProjectId> | null> {
    // TODO this code is duplicated from the client app; fix that
    this._ensurePersistentTokenStore(options?.tokenStore);
    const session = this._getSession(options?.tokenStore);
    const crud = await this._currentServerUserCache.getOrWait([session], "write-only");

    if (crud === null) {
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

    return crud && this._currentUserFromCrud(crud, session);
  }

  async getServerUser(): Promise<ProjectCurrentServerUser<ProjectId> | null> {
    console.warn("stackServerApp.getServerUser is deprecated; use stackServerApp.getUser instead");
    return await this.getUser();
  }

  async getServerUserById(userId: string): Promise<ServerUser | null> {
    const crud = await this._serverUserCache.getOrWait([userId], "write-only");
    return crud && this._serverUserFromCrud(crud);
  }

  useUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): ProjectCurrentServerUser<ProjectId>;
  useUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): ProjectCurrentServerUser<ProjectId>;
  useUser(options?: GetUserOptions<HasTokenStore>): ProjectCurrentServerUser<ProjectId> | null;
  useUser(options?: GetUserOptions<HasTokenStore>): ProjectCurrentServerUser<ProjectId> | null {
    // TODO this code is duplicated from the client app; fix that
    this._ensurePersistentTokenStore(options?.tokenStore);

    const router = NextNavigation.useRouter();
    const session = this._getSession(options?.tokenStore);
    const crud = useAsyncCache(this._currentServerUserCache, [session], "useUser()");

    if (crud === null) {
      switch (options?.or) {
        case 'redirect': {
          // Updating the router is not allowed during the component render function, so we do it in a different async tick
          // The error would be: "Cannot update a component (`Router`) while rendering a different component."
          setTimeout(() => router.replace(this.urls.signIn), 0);
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
      return crud && this._currentUserFromCrud(crud, session);
    }, [crud, session, options?.or]);
  }

  useUserById(userId: string): ServerUser | null {
    const crud = useAsyncCache(this._serverUserCache, [userId], "useUserById()");
    return useMemo(() => {
      return crud && this._serverUserFromCrud(crud);
    }, [crud]);
  }

  async listUsers(): Promise<ServerUser[]> {
    const crud = await this._serverUsersCache.getOrWait([], "write-only");
    return crud.map((j) => this._serverUserFromCrud(j));
  }

  useUsers(): ServerUser[] {
    const crud = useAsyncCache(this._serverUsersCache, [], "useServerUsers()");
    return useMemo(() => {
      return crud.map((j) => this._serverUserFromCrud(j));
    }, [crud]);
  }

  _serverPermissionFromCrud(crud: TeamPermissionsCrud['Server']['Read']): AdminTeamPermission {
    return {
      id: crud.id,
    };
  }

  _serverTeamPermissionDefinitionFromCrud(crud: TeamPermissionDefinitionsCrud['Admin']['Read']): AdminTeamPermissionDefinition {
    return {
      id: crud.id,
      description: crud.description,
      containedPermissionIds: crud.contained_permission_ids,
    };
  }

  async listTeams(): Promise<ServerTeam[]> {
    const teams = await this._serverTeamsCache.getOrWait([], "write-only");
    return teams.map((t) => this._serverTeamFromCrud(t));
  }

  async createTeam(data: ServerTeamCreateOptions) : Promise<ServerTeam> {
    const team = await this._interface.createServerTeam(serverTeamCreateOptionsToCrud(data));
    await this._serverTeamsCache.refresh([]);
    return this._serverTeamFromCrud(team);
  }

  useTeams(): ServerTeam[] {
    const teams = useAsyncCache(this._serverTeamsCache, [], "useServerTeams()");
    return useMemo(() => {
      return teams.map((t) => this._serverTeamFromCrud(t));
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
}

class _StackAdminAppImpl<HasTokenStore extends boolean, ProjectId extends string> extends _StackServerAppImpl<HasTokenStore, ProjectId>
{
  declare protected _interface: StackAdminInterface;

  private readonly _adminProjectCache = createCache(async () => {
    return await this._interface.getProject();
  });
  private readonly _apiKeysCache = createCache(async () => {
    return await this._interface.listApiKeys();
  });
  private readonly _adminEmailTemplatesCache = createCache(async () => {
    return await this._interface.listEmailTemplates();
  });
  private readonly _adminTeamPermissionDefinitionsCache = createCache(async () => {
    return await this._interface.listPermissionDefinitions();
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

  _adminOwnedProjectFromCrud(data: InternalProjectsCrud['Admin']['Read'], onRefresh: () => Promise<void>): AdminOwnedProject {
    if (this._tokenStoreInit !== null) {
      throw new StackAssertionError("Owned apps must always have tokenStore === null — did you not create this project with app._createOwnedApp()?");;
    }
    return {
      ...this._adminProjectFromCrud(data, onRefresh),
      app: this as StackAdminApp<false>,
    };
  }

  _adminProjectFromCrud(data: InternalProjectsCrud['Admin']['Read'], onRefresh: () => Promise<void>): AdminProject {
    if (data.id !== this.projectId) {
      throw new StackAssertionError(`The project ID of the provided project JSON (${data.id}) does not match the project ID of the app (${this.projectId})!`);
    }

    const app = this;
    return {
      id: data.id,
      displayName: data.display_name,
      description: data.description,
      createdAt: new Date(data.created_at_millis),
      userCount: data.user_count,
      isProductionMode: data.is_production_mode,
      config: {
        id: data.config.id,
        credentialEnabled: data.config.credential_enabled,
        magicLinkEnabled: data.config.magic_link_enabled,
        allowLocalhost: data.config.allow_localhost,
        oauthProviders: data.config.oauth_providers.map((p) => ((p.type === 'shared' ? {
          id: p.id,
          enabled: p.enabled,
          type: 'shared',
        } as const : {
          id: p.id,
          enabled: p.enabled,
          type: 'standard',
          clientId: p.client_id ?? throwErr("Client ID is missing"),
          clientSecret: p.client_secret ?? throwErr("Client secret is missing"),
        } as const))),
        emailConfig: data.config.email_config.type === 'shared' ? {
          type: 'shared'
        } : {
          type: 'standard',
          host: data.config.email_config.host ?? throwErr("Email host is missing"),
          port: data.config.email_config.port ?? throwErr("Email port is missing"),
          username: data.config.email_config.username ?? throwErr("Email username is missing"),
          password: data.config.email_config.password ?? throwErr("Email password is missing"),
          senderName: data.config.email_config.sender_name ?? throwErr("Email sender name is missing"),
          senderEmail: data.config.email_config.sender_email ?? throwErr("Email sender email is missing"),
        },
        domains: data.config.domains.map((d) => ({
          domain: d.domain,
          handlerPath: d.handler_path,
        })),
        createTeamOnSignUp: data.config.create_team_on_sign_up,
        teamCreatorDefaultPermissions: data.config.team_creator_default_permissions,
        teamMemberDefaultPermissions: data.config.team_member_default_permissions,
      },

      async update(update: AdminProjectUpdateOptions) {
        await app._interface.updateProject(adminProjectUpdateOptionsToCrud(update));
        await onRefresh();
      },

      async getProductionModeErrors() {
        return getProductionModeErrors(data);
      },
      useProductionModeErrors() {
        return getProductionModeErrors(data);
      },
    };
  }

  _adminEmailTemplateFromCrud(data: EmailTemplateCrud['Admin']['Read']): AdminEmailTemplate {
    return {
      type: data.type,
      subject: data.subject,
      content: data.content,
      isDefault: data.is_default,
    };
  }

  override async getProject(): Promise<AdminProject> {
    return this._adminProjectFromCrud(
      await this._adminProjectCache.getOrWait([], "write-only"),
      () => this._refreshProject()
    );
  }

  override useProject(): AdminProject {
    const crud = useAsyncCache(this._adminProjectCache, [], "useProjectAdmin()");
    return useMemo(() => this._adminProjectFromCrud(
      crud,
      () => this._refreshProject()
    ), [crud]);
  }

  protected _createApiKeyBaseFromCrud(data: ApiKeyBaseCrudRead): ApiKeyBase {
    const app = this;
    return {
      id: data.id,
      description: data.description,
      expiresAt: new Date(data.expires_at_millis),
      manuallyRevokedAt: data.manually_revoked_at_millis ? new Date(data.manually_revoked_at_millis) : null,
      createdAt: new Date(data.created_at_millis),
      isValid() {
        return this.whyInvalid() === null;
      },
      whyInvalid() {
        if (this.expiresAt.getTime() < Date.now()) return "expired";
        if (this.manuallyRevokedAt) return "manually-revoked";
        return null;
      },
      async revoke() {
        const res = await app._interface.revokeApiKeyById(data.id);
        await app._refreshApiKeys();
        return res;
      }
    };
  }

  protected _createApiKeyFromCrud(data: ApiKeysCrud["Admin"]["Read"]): ApiKey {
    return {
      ...this._createApiKeyBaseFromCrud(data),
      publishableClientKey: data.publishable_client_key ? { lastFour: data.publishable_client_key.last_four } : null,
      secretServerKey: data.secret_server_key ? { lastFour: data.secret_server_key.last_four } : null,
      superSecretAdminKey: data.super_secret_admin_key ? { lastFour: data.super_secret_admin_key.last_four } : null,
    };
  }

  protected _createApiKeyFirstViewFromCrud(data: ApiKeyCreateCrudResponse): ApiKeyFirstView {
    return {
      ...this._createApiKeyBaseFromCrud(data),
      publishableClientKey: data.publishable_client_key,
      secretServerKey: data.secret_server_key,
      superSecretAdminKey: data.super_secret_admin_key,
    };
  }

  async listApiKeys(): Promise<ApiKey[]> {
    const crud = await this._apiKeysCache.getOrWait([], "write-only");
    return crud.map((j) => this._createApiKeyFromCrud(j));
  }

  useApiKeys(): ApiKey[] {
    const crud = useAsyncCache(this._apiKeysCache, [], "useApiKeys()");
    return useMemo(() => {
      return crud.map((j) => this._createApiKeyFromCrud(j));
    }, [crud]);
  }

  async createApiKey(options: ApiKeyCreateOptions): Promise<ApiKeyFirstView> {
    const crud = await this._interface.createApiKey(apiKeyCreateOptionsToCrud(options));
    await this._refreshApiKeys();
    return this._createApiKeyFirstViewFromCrud(crud);
  }

  useEmailTemplates(): AdminEmailTemplate[] {
    const crud = useAsyncCache(this._adminEmailTemplatesCache, [], "useEmailTemplates()");
    return useMemo(() => {
      return crud.map((j) => this._adminEmailTemplateFromCrud(j));
    }, [crud]);
  }

  async listEmailTemplates(): Promise<AdminEmailTemplate[]> {
    const crud = await this._adminEmailTemplatesCache.getOrWait([], "write-only");
    return crud.map((j) => this._adminEmailTemplateFromCrud(j));
  }

  async updateEmailTemplate(type: EmailTemplateType, data: AdminEmailTemplateUpdateOptions): Promise<void> {
    await this._interface.updateEmailTemplate(type, adminEmailTemplateUpdateOptionsToCrud(data));
    await this._adminEmailTemplatesCache.refresh([]);
  }

  async resetEmailTemplate(type: EmailTemplateType) {
    await this._interface.resetEmailTemplate(type);
    await this._adminEmailTemplatesCache.refresh([]);
  }

  async createTeamPermissionDefinition(data: AdminTeamPermissionDefinitionCreateOptions): Promise<AdminTeamPermission>{
    const crud = await this._interface.createPermissionDefinition(serverTeamPermissionDefinitionCreateOptionsToCrud(data));
    await this._adminTeamPermissionDefinitionsCache.refresh([]);
    return this._serverTeamPermissionDefinitionFromCrud(crud);
  }

  async updateTeamPermissionDefinition(permissionId: string, data: AdminTeamPermissionDefinitionUpdateOptions) {
    await this._interface.updatePermissionDefinition(permissionId, data);
    await this._adminTeamPermissionDefinitionsCache.refresh([]);
  }

  async deleteTeamPermissionDefinition(permissionId: string): Promise<void> {
    await this._interface.deletePermissionDefinition(permissionId);
    await this._adminTeamPermissionDefinitionsCache.refresh([]);
  }

  async listTeamPermissionDefinitions(): Promise<AdminTeamPermissionDefinition[]> {
    const crud = await this._adminTeamPermissionDefinitionsCache.getOrWait([], "write-only");
    return crud.map((p) => this._serverTeamPermissionDefinitionFromCrud(p));
  }

  useTeamPermissionDefinitions(): AdminTeamPermissionDefinition[] {
    const crud = useAsyncCache(this._adminTeamPermissionDefinitionsCache, [], "usePermissions()");
    return useMemo(() => {
      return crud.map((p) => this._serverTeamPermissionDefinitionFromCrud(p));
    }, [crud]);
  }


  protected override async _refreshProject() {
    await Promise.all([
      super._refreshProject(),
      this._adminProjectCache.refresh([]),
    ]);
  }

  protected async _refreshApiKeys() {
    await this._apiKeysCache.refresh([]);
  }
}

type _______________USER_______________ = never;  // this is a marker for VSCode's outline view
type ___________client_user = never;  // this is a marker for VSCode's outline view

type Session = {
  getTokens(): Promise<{ accessToken: string | null, refreshToken: string | null }>,
};

/**
 * Contains everything related to the current user session.
 */
type Auth = {
  readonly _internalSession: InternalSession,
  readonly currentSession: Session,
  signOut(): Promise<void>,

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
};

export type User =
  & {
    readonly projectId: string,
    readonly id: string,

    readonly displayName: string | null,
    setDisplayName(displayName: string): Promise<void>,

    /**
     * The user's email address.
     *
     * Note: This might NOT be unique across multiple users, so always use `id` for unique identification.
     */
    readonly primaryEmail: string | null,
    readonly primaryEmailVerified: boolean,
    sendVerificationEmail(): Promise<KnownErrors["EmailAlreadyVerified"] | void>,

    readonly profileImageUrl: string | null,

    readonly signedUpAt: Date,

    readonly clientMetadata: any,
    setClientMetadata(metadata: any): Promise<void>,

    /**
     * Whether the primary e-mail can be used for authentication.
     */
    readonly emailAuthEnabled: boolean,
    /**
     * Whether the user has a password set.
     */
    readonly hasPassword: boolean,
    readonly oauthProviders: readonly { id: string }[],
    updatePassword(options: { oldPassword: string, newPassword: string}): Promise<KnownErrors["PasswordConfirmationMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | void>,

    /**
     * A shorthand method to update multiple fields of the user at once.
     */
    update(update: UserUpdateOptions): Promise<void>,

    hasPermission(scope: Team, permissionId: string): Promise<boolean>,

    readonly selectedTeam: Team | null,
    setSelectedTeam(team: Team | null): Promise<void>,

    createTeam(data: TeamCreateOptions): Promise<Team>,

    getConnectedAccount(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): Promise<OAuthConnection>,
    getConnectedAccount(id: StandardProvider, options?: { or?: 'redirect' | 'throw' | 'return-null', scopes?: string[] }): Promise<OAuthConnection | null>,
    useConnectedAccount(id: StandardProvider, options: { or: 'redirect', scopes?: string[] }): OAuthConnection,
    useConnectedAccount(id: StandardProvider, options?: { or?: 'redirect' | 'throw' | 'return-null', scopes?: string[] }): OAuthConnection | null,

    toClientJson(): CurrentUserCrud["Client"]["Read"],
  }
  & AsyncStoreProperty<"team", [id: string], Team | null, false>
  & AsyncStoreProperty<"teams", [], Team[], true>
  & AsyncStoreProperty<"permission", [scope: Team, permissionId: string, options?: { recursive?: boolean }], TeamPermission | null, false>
  & AsyncStoreProperty<"permissions", [scope: Team, options?: { recursive?: boolean }], TeamPermission[], true>;

type BaseUser = Pick<User,
  | "projectId"
  | "id"
  | "displayName"
  | "primaryEmail"
  | "primaryEmailVerified"
  | "profileImageUrl"
  | "signedUpAt"
  | "clientMetadata"
  | "hasPassword"
  | "emailAuthEnabled"
  | "oauthProviders"
  | "selectedTeam"
  | "toClientJson"
>;

type UserExtra = Omit<User, keyof BaseUser>;

type InternalUserExtra =
  & {
    createProject(newProject: AdminProjectUpdateOptions & { displayName: string }): Promise<AdminProject>,
  }
  & AsyncStoreProperty<"ownedProjects", [], AdminOwnedProject[], true>

export type CurrentUser = Auth & User;

export type CurrentInternalUser = CurrentUser & InternalUserExtra;

type UserUpdateOptions = {
  displayName?: string,
  clientMetadata?: ReadonlyJson,
  selectedTeamId?: string | null,
}

function userUpdateOptionsToCrud(options: UserUpdateOptions): CurrentUserCrud["Client"]["Update"] {
  return {
    display_name: options.displayName,
    client_metadata: options.clientMetadata,
    selected_team_id: options.selectedTeamId,
  };
}

type ___________server_user = never;  // this is a marker for VSCode's outline view

/**
 * A user including sensitive fields that should only be used on the server, never sent to the client
 * (such as sensitive information and serverMetadata).
 */
export type ServerUser =
  & {
    setPrimaryEmail(email: string, options?: { verified?: boolean | undefined }): Promise<void>,

    readonly serverMetadata: any,
    setServerMetadata(metadata: any): Promise<void>,

    updatePassword(options: { oldPassword?: string, newPassword: string}): Promise<KnownErrors["PasswordConfirmationMismatch"] | KnownErrors["PasswordRequirementsNotMet"] | void>,

    update(user: ServerUserUpdateOptions): Promise<void>,
    delete(): Promise<void>,

    grantPermission(scope: Team, permissionId: string): Promise<void>,
    revokePermission(scope: Team, permissionId: string): Promise<void>,

    hasPermission(scope: Team, permissionId: string): Promise<boolean>,
  }
  & AsyncStoreProperty<"team", [id: string], ServerTeam | null, false>
  & AsyncStoreProperty<"teams", [], ServerTeam[], true>
  & AsyncStoreProperty<"permission", [scope: Team, permissionId: string, options?: { direct?: boolean }], AdminTeamPermission | null, false>
  & AsyncStoreProperty<"permissions", [scope: Team, options?: { direct?: boolean }], AdminTeamPermission[], true>
  & User;

type ServerBaseUser = Pick<ServerUser,
  | keyof BaseUser
  | "serverMetadata"
>;

export type CurrentServerUser = Auth & ServerUser;

export type CurrentInternalServerUser = CurrentServerUser & InternalUserExtra;

type ServerUserExtra = Omit<ServerUser, keyof ServerBaseUser>;

type ServerUserUpdateOptions = {
  primaryEmail?: string,
  primaryEmailVerified?: boolean,
  primaryEmailAuthEnabled?: boolean,
  serverMetadata?: ReadonlyJson,
  password?: string,
} & UserUpdateOptions;
function serverUserUpdateOptionsToCrud(options: ServerUserUpdateOptions): CurrentUserCrud["Server"]["Update"] {
  return {
    display_name: options.displayName,
    client_metadata: options.clientMetadata,
    selected_team_id: options.selectedTeamId,
    primary_email: options.primaryEmail,
    primary_email_verified: options.primaryEmailVerified,
    server_metadata: options.serverMetadata,
  };
}


type _______________PROJECT_______________ = never;  // this is a marker for VSCode's outline view

export type Project = {
  readonly id: string,
  readonly config: ProjectConfig,
};

export type AdminProject = {
  readonly id: string,
  readonly displayName: string,
  readonly description: string | null,
  readonly createdAt: Date,
  readonly userCount: number,
  readonly isProductionMode: boolean,
  readonly config: AdminProjectConfig,

  update(this: AdminProject, update: AdminProjectUpdateOptions): Promise<void>,

  getProductionModeErrors(this: AdminProject): Promise<ProductionModeError[]>,
  useProductionModeErrors(this: AdminProject): ProductionModeError[],
} & Project;

export type AdminOwnedProject = {
  readonly app: StackAdminApp<false>,
} & AdminProject;

export type AdminProjectUpdateOptions = {
  displayName?: string,
  description?: string,
  isProductionMode?: boolean,
  config?: AdminProjectConfigUpdateOptions,
};
function adminProjectUpdateOptionsToCrud(options: AdminProjectUpdateOptions): ProjectsCrud["Server"]["Update"] {
  return {
    display_name: options.displayName,
    description: options.description,
    is_production_mode: options.isProductionMode,
    config: {
      domains: options.config?.domains?.map((d) => ({
        domain: d.domain,
        handler_path: d.handlerPath
      })),
      oauth_providers: options.config?.oauthProviders?.map((p) => ({
        id: p.id as any,
        enabled: p.enabled,
        type: p.type,
        ...(p.type === 'standard' && {
          client_id: p.clientId,
          client_secret: p.clientSecret,
        }),
      })),
      email_config: options.config?.emailConfig && (
        options.config.emailConfig.type === 'shared' ? {
          type: 'shared',
        } : {
          type: 'standard',
          host: options.config.emailConfig.host,
          port: options.config.emailConfig.port,
          username: options.config.emailConfig.username,
          password: options.config.emailConfig.password,
          sender_name: options.config.emailConfig.senderName,
          sender_email: options.config.emailConfig.senderEmail,
        }
      ),
      credential_enabled: options.config?.credentialEnabled,
      magic_link_enabled: options.config?.magicLinkEnabled,
      allow_localhost: options.config?.allowLocalhost,
      create_team_on_sign_up: options.config?.createTeamOnSignUp,
      team_creator_default_permissions: options.config?.teamCreatorDefaultPermissions,
      team_member_default_permissions: options.config?.teamMemberDefaultPermissions,
    },
  };
}

export type AdminProjectCreateOptions = Omit<AdminProjectUpdateOptions, 'displayName'> & {
  displayName: string,
};
function adminProjectCreateOptionsToCrud(options: AdminProjectCreateOptions): InternalProjectsCrud["Server"]["Create"] {
  return {
    ...adminProjectUpdateOptionsToCrud(options),
    display_name: options.displayName,
  };
}

type _______________PROJECT_CONFIG_______________ = never;  // this is a marker for VSCode's outline view

export type ProjectConfig = {
  readonly credentialEnabled: boolean,
  readonly magicLinkEnabled: boolean,
  readonly oauthProviders: OAuthProviderConfig[],
};

export type OAuthProviderConfig = {
  readonly id: string,
};

export type AdminProjectConfig = {
  readonly credentialEnabled: boolean,
  readonly magicLinkEnabled: boolean,
  readonly allowLocalhost: boolean,
  readonly oauthProviders: AdminOAuthProviderConfig[],
  readonly emailConfig?: AdminEmailConfig,
  readonly domains: AdminDomainConfig[],
  readonly createTeamOnSignUp: boolean,
  readonly teamCreatorDefaultPermissions: AdminTeamPermission[],
  readonly teamMemberDefaultPermissions: AdminTeamPermission[],
} & OAuthProviderConfig;

export type AdminEmailConfig = (
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

export type AdminDomainConfig = {
  domain: string,
  handlerPath: string,
};

export type AdminOAuthProviderConfig = {
  id: string,
  enabled: boolean,
} & (
  | { type: 'shared' }
  | {
    type: 'standard',
    clientId: string,
    clientSecret: string,
  }
) & OAuthProviderConfig;

export type AdminProjectConfigUpdateOptions = {
  domains?: {
    domain: string,
    handlerPath: string,
  }[],
  oauthProviders?: AdminOAuthProviderConfig[],
  credentialEnabled?: boolean,
  magicLinkEnabled?: boolean,
  allowLocalhost?: boolean,
  createTeamOnSignUp?: boolean,
  emailConfig?: AdminEmailConfig,
  teamCreatorDefaultPermissions?: { id: string }[],
  teamMemberDefaultPermissions?: { id: string }[],
};

type _______________API_KEYS_______________ = never;  // this is a marker for VSCode's outline view

export type ApiKeyBase = {
  id: string,
  description: string,
  expiresAt: Date,
  manuallyRevokedAt: Date | null,
  createdAt: Date,
  isValid(): boolean,
  whyInvalid(): "expired" | "manually-revoked" | null,
  revoke(): Promise<void>,
};

export type ApiKeyBaseCrudRead = Pick<ApiKeysCrud["Admin"]["Read"], "id" | "created_at_millis" | "description" | "expires_at_millis" | "manually_revoked_at_millis">;

export type ApiKeyFirstView = {
  publishableClientKey?: string,
  secretServerKey?: string,
  superSecretAdminKey?: string,
} & ApiKeyBase;

export type ApiKey = {
  publishableClientKey: null | {
    lastFour: string,
  },
  secretServerKey: null | {
    lastFour: string,
  },
  superSecretAdminKey: null | {
    lastFour: string,
  },
} & ApiKeyBase;

export type ApiKeyCreateOptions = {
  description: string,
  expiresAt: Date,
  hasPublishableClientKey: boolean,
  hasSecretServerKey: boolean,
  hasSuperSecretAdminKey: boolean,
};
function apiKeyCreateOptionsToCrud(options: ApiKeyCreateOptions): ApiKeyCreateCrudRequest {
  return {
    description: options.description,
    expires_at_millis: options.expiresAt.getTime(),
    has_publishable_client_key: options.hasPublishableClientKey,
    has_secret_server_key: options.hasSecretServerKey,
    has_super_secret_admin_key: options.hasSuperSecretAdminKey,
  };
}

type _______________TEAM_______________ = never;  // this is a marker for VSCode's outline view
type ___________client_team = never;  // this is a marker for VSCode's outline view

export type Team = {
  id: string,
  displayName: string,
  profileImageUrl: string | null,
};

export type TeamCreateOptions = {
  displayName: string,
  profileImageUrl?: string,
}
function teamCreateOptionsToCrud(options: TeamCreateOptions): TeamsCrud["Client"]["Create"] {
  return {
    display_name: options.displayName,
    profile_image_url: options.profileImageUrl,
  };
}

type ___________server_team = never;  // this is a marker for VSCode's outline view


export type ServerTeam = {
  createdAt: Date,
  listUsers(): Promise<ServerUser[]>,
  useUsers(): ServerUser[],
  update(update: ServerTeamUpdateOptions): Promise<void>,
  delete(): Promise<void>,
  addUser(userId: string): Promise<void>,
  removeUser(userId: string): Promise<void>,
} & Team;

export type ServerTeamCreateOptions = TeamCreateOptions;
function serverTeamCreateOptionsToCrud(options: ServerTeamCreateOptions): TeamsCrud["Server"]["Create"] {
  return teamCreateOptionsToCrud(options);
}

export type ServerTeamUpdateOptions = {
  displayName?: string,
  profileImageUrl?: string | null,
};
function serverTeamUpdateOptionsToCrud(options: ServerTeamUpdateOptions): TeamsCrud["Server"]["Update"] {
  return {
    display_name: options.displayName,
    profile_image_url: options.profileImageUrl,
  };
}

type _______________PERMISSION_______________ = never;  // this is a marker for VSCode's outline view


export type TeamPermission = {
  id: string,
};

export type AdminTeamPermission = TeamPermission;

export type AdminTeamPermissionDefinition = {
  id: string,
  description?: string,
  containedPermissionIds: string[],
};

export type AdminTeamPermissionDefinitionCreateOptions = {
  id: string,
  description?: string,
  containedPermissionIds: string[],
};
export function serverTeamPermissionDefinitionCreateOptionsToCrud(options: AdminTeamPermissionDefinitionCreateOptions): TeamPermissionDefinitionsCrud["Admin"]["Create"] {
  return {
    id: options.id,
    description: options.description,
    contained_permission_ids: options.containedPermissionIds,
  };
}

export type AdminTeamPermissionDefinitionUpdateOptions = Partial<AdminTeamPermissionDefinitionCreateOptions>;
export function serverTeamPermissionDefinitionUpdateOptionsToCrud(options: AdminTeamPermissionDefinitionUpdateOptions): TeamPermissionDefinitionsCrud["Admin"]["Update"] {
  return {
    id: options.id,
    description: options.description,
    contained_permission_ids: options.containedPermissionIds,
  };
}


type _______________CONNECTED_ACCOUNT_______________ = never;  // this is a marker for VSCode's outline view


export type Connection = {
  id: string,
};

export type OAuthConnection = {
  getAccessToken(): Promise<{ accessToken: string }>,
  useAccessToken(): { accessToken: string },
} & Connection;

type _______________STACK_APP_______________ = never;  // this is a marker for VSCode's outline view

export type GetUserOptions<HasTokenStore> =
  & {
    or?: 'redirect' | 'throw' | 'return-null',
    tokenStore?: TokenStoreInit,
  }
  & (HasTokenStore extends false ? {
    tokenStore: TokenStoreInit,
  } : {});

export type StackClientApp<HasTokenStore extends boolean = boolean, ProjectId extends string = string> = (
  & {
    readonly projectId: ProjectId,

    readonly urls: Readonly<HandlerUrls>,

    signInWithOAuth(provider: string): Promise<void>,
    signInWithCredential(options: { email: string, password: string }): Promise<KnownErrors["EmailPasswordMismatch"] | void>,
    signUpWithCredential(options: { email: string, password: string }): Promise<KnownErrors["UserEmailAlreadyExists"] | KnownErrors["PasswordRequirementsNotMet"] | void>,
    callOAuthCallback(): Promise<boolean>,
    sendForgotPasswordEmail(email: string): Promise<KnownErrors["UserNotFound"] | void>,
    sendMagicLinkEmail(email: string): Promise<KnownErrors["RedirectUrlNotWhitelisted"] | void>,
    resetPassword(options: { code: string, password: string }): Promise<KnownErrors["VerificationCodeError"] | void>,
    verifyPasswordResetCode(code: string): Promise<KnownErrors["VerificationCodeError"] | void>,
    verifyEmail(code: string): Promise<KnownErrors["VerificationCodeError"] | void>,
    signInWithMagicLink(code: string): Promise<KnownErrors["VerificationCodeError"] | void>,

    redirectToOAuthCallback(): Promise<void>,
    useUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): ProjectCurrentUser<ProjectId>,
    useUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): ProjectCurrentUser<ProjectId>,
    useUser(options?: GetUserOptions<HasTokenStore>): ProjectCurrentUser<ProjectId> | null,
    getUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): Promise<ProjectCurrentUser<ProjectId>>,
    getUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): Promise<ProjectCurrentUser<ProjectId>>,
    getUser(options?: GetUserOptions<HasTokenStore>): Promise<ProjectCurrentUser<ProjectId> | null>,

    [stackAppInternalsSymbol]: {
      toClientJson(): StackClientAppJson<HasTokenStore, ProjectId>,
      setCurrentUser(userJsonPromise: Promise<CurrentUserCrud['Client']['Read'] | null>): void,
    },
  }
  & AsyncStoreProperty<"project", [], Project, false>
  & { [K in `redirectTo${Capitalize<keyof Omit<HandlerUrls, 'handler' | 'oauthCallback'>>}`]: (options?: RedirectToOptions) => Promise<void> }
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
  & {
    createTeam(data: ServerTeamCreateOptions): Promise<ServerTeam>,
    /**
     * @deprecated use `getUser()` instead
     */
    getServerUser(): Promise<ProjectCurrentServerUser<ProjectId> | null>,

    useUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): ProjectCurrentServerUser<ProjectId>,
    useUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): ProjectCurrentServerUser<ProjectId>,
    useUser(options?: GetUserOptions<HasTokenStore>): ProjectCurrentServerUser<ProjectId> | null,
    getUser(options: GetUserOptions<HasTokenStore> & { or: 'redirect' }): Promise<ProjectCurrentServerUser<ProjectId>>,
    getUser(options: GetUserOptions<HasTokenStore> & { or: 'throw' }): Promise<ProjectCurrentServerUser<ProjectId>>,
    getUser(options?: GetUserOptions<HasTokenStore>): Promise<ProjectCurrentServerUser<ProjectId> | null>,
  }
  & AsyncStoreProperty<"users", [], ServerUser[], true>
  & AsyncStoreProperty<"team", [id: string], ServerTeam | null, false>
  & AsyncStoreProperty<"teams", [], ServerTeam[], true>
  & StackClientApp<HasTokenStore, ProjectId>
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
  & AsyncStoreProperty<"project", [], AdminProject, false>
  & AsyncStoreProperty<"apiKeys", [], ApiKey[], true>
  & AsyncStoreProperty<"teamPermissionDefinitions", [], AdminTeamPermissionDefinition[], true>
  & {
    useEmailTemplates(): AdminEmailTemplate[],
    listEmailTemplates(): Promise<AdminEmailTemplate[]>,
    updateEmailTemplate(type: EmailTemplateType, data: AdminEmailTemplateUpdateOptions): Promise<void>,
    resetEmailTemplate(type: EmailTemplateType): Promise<void>,

    createApiKey(options: ApiKeyCreateOptions): Promise<ApiKeyFirstView>,

    createTeamPermissionDefinition(data: AdminTeamPermissionDefinitionCreateOptions): Promise<AdminTeamPermission>,
    updateTeamPermissionDefinition(permissionId: string, data: AdminTeamPermissionDefinitionUpdateOptions): Promise<void>,
    deleteTeamPermissionDefinition(permissionId: string): Promise<void>,
  }
  & StackServerApp<HasTokenStore, ProjectId>
);
type StackAdminAppConstructor = {
  new <
    HasTokenStore extends boolean,
    ProjectId extends string
  >(options: StackAdminAppConstructorOptions<HasTokenStore, ProjectId>): StackAdminApp<HasTokenStore, ProjectId>,
  new (options: StackAdminAppConstructorOptions<boolean, string>): StackAdminApp<boolean, string>,
};
export const StackAdminApp: StackAdminAppConstructor = _StackAdminAppImpl;

type _______________EMAIL_TEMPLATE_______________ = never;  // this is a marker for VSCode's outline view

type AdminEmailTemplate = {
  type: EmailTemplateType,
  subject: string,
  content: any,
  isDefault: boolean,
}

type AdminEmailTemplateUpdateOptions = {
  subject?: string,
  content?: any,
};
function adminEmailTemplateUpdateOptionsToCrud(options: AdminEmailTemplateUpdateOptions): EmailTemplateCrud['Admin']['Update'] {
  return {
    subject: options.subject,
    content: options.content,
  };
}

type _______________VARIOUS_______________ = never;  // this is a marker for VSCode's outline view

type RedirectToOptions = {
  replace?: boolean,
};

type AsyncStoreProperty<Name extends string, Args extends any[], Value, IsMultiple extends boolean> =
  & { [key in `${IsMultiple extends true ? "list" : "get"}${Capitalize<Name>}`]: (...args: Args) => Promise<Value> }
  & { [key in `use${Capitalize<Name>}`]: (...args: Args) => Value }
