import React, { use, useCallback } from "react";
import { OauthProviderConfigJson, ServerUserCustomizableJson, ServerUserJson, StackAdminInterface, StackClientInterface, StackServerInterface } from "stack-shared";
import { getCookie, setOrDeleteCookie } from "./cookie";
import { throwErr } from "stack-shared/dist/utils/errors";
import { AsyncValueCache } from "stack-shared/dist/utils/caches";
import { generateUuid } from "stack-shared/dist/utils/uuids";
import { AsyncResult } from "stack-shared/dist/utils/results";
import { suspendIfSsr } from "stack-shared/dist/utils/react";
import { AsyncStore } from "stack-shared/dist/utils/stores";
import { ClientProjectJson, UserCustomizableJson, UserJson, TokenObject, TokenStore, ProjectJson, EmailConfigJson, DomainConfigJson } from "stack-shared/dist/interface/clientInterface";
import { isClient } from "../utils/next";
import { callOauthCallback, signInWithCredential, signInWithOauth, signUpWithCredential } from "./auth";
import { RedirectType, redirect, useRouter } from "next/navigation";
import { ReadonlyJson } from "../utils/types";
import { constructRedirectUrl } from "../utils/url";
import { EmailVerificationLinkErrorCode, PasswordResetLinkErrorCode, SignInErrorCode, SignUpErrorCode } from "stack-shared/dist/utils/types";
import { filterUndefined } from "stack-shared/dist/utils/objects";
import { neverResolve, resolved, runAsynchronously, wait } from "stack-shared/dist/utils/promises";


export type TokenStoreOptions<HasTokenStore extends boolean = boolean> =
  HasTokenStore extends true ? "cookie" | "nextjs-cookie" | "memory" :
  HasTokenStore extends false ? null :
  TokenStoreOptions<true> | TokenStoreOptions<false>;

export type HandlerUrls = {
  handler: string,
  signIn: string,
  signUp: string,
  signOut: string,
  emailVerification: string,
  passwordReset: string,
  forgotPassword: string,
  home: string,
  userHome: string,
  oauthCallback: string,
}

function getUrls(partial: Partial<HandlerUrls>): HandlerUrls {
  const handler = partial.handler ?? "/handler";
  return {
    handler,
    signIn: `${handler}/signin`,
    signUp: `${handler}/signup`,
    signOut: `${handler}/signout`,
    emailVerification: `${handler}/email-verification`,
    passwordReset: `${handler}/password-reset`,
    forgotPassword: `${handler}/forgot-password`,
    oauthCallback: `${handler}/oauth-callback`,
    home: "/",
    userHome: "/",
    ...filterUndefined(partial),
  };
}

function getDefaultProjectId() {
  return process.env.NEXT_PUBLIC_STACK_PROJECT_ID || throwErr("No project ID provided. Please copy your project ID from the Stack dashboard and put it in the NEXT_PUBLIC_STACK_PROJECT_ID environment variable.");
}

function getDefaultPublishableClientKey() {
  return process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || throwErr("No publishable client key provided. Please copy your publishable client key from the Stack dashboard and put it in the NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY environment variable.");
}

function getDefaultSecretServerKey() {
  return process.env.STACK_SECRET_SERVER_KEY || throwErr("No secret server key provided. Please copy your publishable client key from the Stack dashboard and put your it in the STACK_SECRET_SERVER_KEY environment variable.");
}

function getDefaultSuperSecretAdminKey() {
  return process.env.STACK_SUPER_SECRET_ADMIN_KEY || throwErr("No super secret admin key provided. Please copy your publishable client key from the Stack dashboard and put it in the STACK_SUPER_SECRET_ADMIN_KEY environment variable.");
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

export type StackAdminAppConstructorOptions<HasTokenStore extends boolean, ProjectId extends string> = StackServerAppConstructorOptions<HasTokenStore, ProjectId> & {
  superSecretAdminKey?: string,
};

export type StackClientAppJson<HasTokenStore extends boolean, ProjectId extends string> = StackClientAppConstructorOptions<HasTokenStore, ProjectId> & {
  uniqueIdentifier: string,
};

const defaultBaseUrl = "https://api.stackframe.co";

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
        setOrDeleteCookie('stack-refresh', value.refreshToken);
        setOrDeleteCookie('stack-access', value.accessToken);
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
          setOrDeleteCookie('stack-refresh', value.refreshToken);
          setOrDeleteCookie('stack-access', value.accessToken);
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
function useValueCache<T>(cache: AsyncValueCache<T>): T {
  // we explicitly don't want to run this hook in SSR
  suspendIfSsr();

  const subscribe = useCallback((cb: () => void) => {
    const { unsubscribe } = cache.onChange(() => cb());
    return unsubscribe;
  }, [cache]);
  const getSnapshot = useCallback(() => {
    return AsyncResult.or(cache.get(), loadingSentinel);
  }, [cache]);

  // note: we must use React.useSyncExternalStore instead of importing the function directly, as it will otherwise
  // throw an error ("can't import useSyncExternalStore from the server")
  const value = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (value === loadingSentinel) {
    return use(cache.getOrWait());
  } else {
    // still need to call `use` because React expects the control flow to not change
    return use(resolved(value));
  }
}

export const stackAppInternalsSymbol = Symbol.for("StackAppInternals");

const allClientApps = new Map<string, [checkString: string, app: StackClientApp<any, any>]>();

class _StackClientAppImpl<HasTokenStore extends boolean, ProjectId extends string = string> {
  protected readonly _uniqueIdentifier: string;
  protected _interface: StackClientInterface;
  protected readonly _tokenStoreOptions: TokenStoreOptions<HasTokenStore>;
  protected readonly _urlOptions: Partial<HandlerUrls>;

  constructor(options:
    & {
      uniqueIdentifier?: string,
      checkString?: string,
    }
    & (
      | StackClientAppConstructorOptions<HasTokenStore, ProjectId>
      | Pick<StackClientAppConstructorOptions<HasTokenStore, ProjectId>, "tokenStore" | "urls"> & {
        interface: StackClientInterface,
        tokenStore: TokenStoreOptions<HasTokenStore>,
        urls: Partial<HandlerUrls> | undefined,
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
      throw new Error("A Stack client app with the same unique identifier already exists");
    }
    allClientApps.set(this._uniqueIdentifier, [options.checkString ?? "default check string", this]);
  }

  protected _ensurePersistentTokenStore(): asserts this is StackClientApp<true, ProjectId>  {
    if (!this._tokenStoreOptions) {
      throw new Error("Cannot call this function on a Stack app without a persistent token store. Make sure the tokenStore option is set to a non-null value when initializing Stack.");
    }
  }

  protected _ensureInternalProject(): asserts this is { projectId: "internal" } {
    if (this.projectId !== "internal") {
      throw new Error("Cannot call this function on a Stack app with a project ID other than 'internal'.");
    }
  }

  protected _userFromJson(json: UserJson): User {
    return {
      projectId: json.projectId,
      id: json.id,
      displayName: json.displayName,
      primaryEmail: json.primaryEmail,
      primaryEmailVerified: json.primaryEmailVerified,
      profileImageUrl: json.profileImageUrl,
      signedUpAt: new Date(json.signedUpAtMillis),
      clientMetadata: json.clientMetadata,
      toJson() {
        return json;
      }
    };
  }

  protected _currentUserFromJson(json: UserJson, tokenStore: TokenStore): CurrentUser;
  protected _currentUserFromJson(json: UserJson | null, tokenStore: TokenStore): CurrentUser | null;
  protected _currentUserFromJson(json: UserJson | null, tokenStore: TokenStore): CurrentUser | null {
    if (json === null) return null;
    const app = this;
    const res: CurrentUser = {
      ...this._userFromJson(json),
      get accessToken() {
        return AsyncResult.or(tokenStore.get(), null)?.accessToken ?? null;
      },
      get refreshToken() {
        return AsyncResult.or(tokenStore.get(), null)?.refreshToken ?? null;
      },
      update(update) {
        return app._updateUser(update, tokenStore);
      },
      signOut(redirectUrl?: string) {
        return app._signOut(tokenStore, redirectUrl);
      },
    };
    Object.freeze(res);
    return res;
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
    };
  }

  protected _projectAdminFromJson(data: ProjectJson): Project {
    return {
      id: data.id,
      displayName: data.displayName,
      description: data.description,
      createdAt: new Date(data.createdAtMillis),
      userCount: data.userCount,
      isProductionMode: data.isProductionMode,
      evaluatedConfig: {
        id: data.evaluatedConfig.id,
        allowLocalhost: data.evaluatedConfig.allowLocalhost,
        oauthProviders: data.evaluatedConfig.oauthProviders,
        emailConfig: data.evaluatedConfig.emailConfig,
        domains: data.evaluatedConfig.domains,
      },
    };
  }

  get projectId(): ProjectId {
    return this._interface.projectId as ProjectId;
  }

  get urls(): Readonly<HandlerUrls> {
    return getUrls(this._urlOptions);
  }

  protected _redirectTo(handlerName: keyof HandlerUrls) {
    if (!this.urls[handlerName]) {
      throw new Error(`No URL for handler name ${handlerName}`);
    }
    window.location.href = this.urls[handlerName];
    return neverResolve();
  }

  async redirectToHandler() { return await this._redirectTo("handler"); }
  async redirectToSignIn() { return await this._redirectTo("signIn"); }
  async redirectToSignUp() { return await this._redirectTo("signUp"); }
  async redirectToSignOut() { return await this._redirectTo("signOut"); }
  async redirectToEmailVerification() { return await this._redirectTo("emailVerification"); }
  async redirectToPasswordReset() { return await this._redirectTo("passwordReset"); }
  async redirectToForgotPassword() { return await this._redirectTo("forgotPassword"); }
  async redirectToHome() { return await this._redirectTo("home"); }
  async redirectToUserHome() { return await this._redirectTo("userHome"); }
  async redirectToOauthCallback() { return await this._redirectTo("oauthCallback"); }

  async sendForgotPasswordEmail(email: string) {
    const redirectUrl = constructRedirectUrl(this.urls.passwordReset);
    await this._interface.sendForgotPasswordEmail(email, redirectUrl);
  }

  async resetPassword(options: { password: string, code: string }): Promise<PasswordResetLinkErrorCode | undefined> {
    return await this._interface.resetPassword(options);
  }

  async verifyPasswordResetCode(code: string): Promise<PasswordResetLinkErrorCode | undefined> {
    return await this._interface.verifyPasswordResetCode(code);
  }

  async verifyEmail(code: string): Promise<EmailVerificationLinkErrorCode | undefined> {
    return await this._interface.verifyEmail(code);
  }

  async getUser(options: GetUserOptions & { or: 'redirect' }): Promise<CurrentUser>;
  async getUser(options: GetUserOptions & { or: 'throw' }): Promise<CurrentUser>;
  async getUser(options?: GetUserOptions): Promise<CurrentUser | null>;
  async getUser(options?: GetUserOptions): Promise<CurrentUser | null> {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = await this._interface.currentUserCache.getOrWait(tokenStore);

    if (userJson === null) {
      switch (options?.or) {
        case 'redirect': {
          redirect(this.urls.signIn, RedirectType.replace);
          throw new Error("redirect should never return!");
        }
        case 'throw': {
          throw new Error("User is not signed in");
        }
        default: {
          return null;
        }
      }
    }

    return this._currentUserFromJson(userJson, tokenStore);
  }

  useUser(options: GetUserOptions & { or: 'redirect' }): CurrentUser;
  useUser(options: GetUserOptions & { or: 'throw' }): CurrentUser;
  useUser(options?: GetUserOptions): CurrentUser | null;
  useUser(options?: GetUserOptions): CurrentUser | null {
    this._ensurePersistentTokenStore();

    const router = useRouter();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = useValueCache(this._interface.currentUserCache.getValueCache(tokenStore));

    if (userJson === null) {
      switch (options?.or) {
        case 'redirect': {
          router.replace(this.urls.signIn);
          break;
        }
        case 'throw': {
          throw new Error("User is not signed in");
        }
        default: {
          return null;
        }
      }
    }

    return this._currentUserFromJson(userJson, tokenStore);
  }

  onUserChange(callback: (user: CurrentUser | null) => void) {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    return this._interface.currentUserCache.getValueCache(tokenStore).onChange((userJson) => {
      callback(this._currentUserFromJson(userJson, tokenStore));
    });
  }

  protected async _updateUser(update: Partial<UserCustomizableJson>, tokenStore: TokenStore) {
    return await this._interface.setClientUserCustomizableData(update, tokenStore);
  }

  async signInWithOauth(provider: string) {
    this._ensurePersistentTokenStore();
    await signInWithOauth(this._interface, { provider, redirectUrl: this.urls.oauthCallback });
  }

  async signInWithCredential(options: {
    email: string,
    password: string,
    redirectUrl?: string,
  }): Promise<SignInErrorCode | undefined> {
    if (!options.redirectUrl) {
      options.redirectUrl = constructRedirectUrl(options.redirectUrl);
    }
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    return await signInWithCredential(this._interface, tokenStore, options);
  }

  async signUpWithCredential(options: {
    email: string,
    password: string,
    redirectUrl?: string,
  }): Promise<SignUpErrorCode | undefined>{
    if (!options.redirectUrl) {
      options.redirectUrl = constructRedirectUrl(options.redirectUrl);
    }
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    return await signUpWithCredential(this._interface, tokenStore, options);
  }

  async callOauthCallback(options: {
    redirectUrl?: string,
  } = {}) {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    await callOauthCallback(this._interface, tokenStore, options.redirectUrl);
  }

  protected async _signOut(tokenStore: TokenStore, redirectUrl?: string): Promise<never> {
    redirectUrl = constructRedirectUrl(redirectUrl);
    await this._interface.signOut(tokenStore);
    window.location.assign(redirectUrl);
    return await neverResolve();
  }

  async signOut(redirectUrl: string): Promise<never> {
    const user = await this.getUser();
    if (user) {
      await user.signOut(redirectUrl);
    }
    window.location.assign(redirectUrl);
    return await neverResolve();
  }

  async getProject(): Promise<ClientProjectJson> {
    return await this._interface.clientProjectCache.getOrWait();
  }

  useProject(): ClientProjectJson {
    return useValueCache(this._interface.clientProjectCache);
  }

  onProjectChange(callback: (project: ClientProjectJson) => void) {
    return this._interface.clientProjectCache.onChange(callback);
  }

  async listOwnedProjects(): Promise<Project[]> {
    this._ensureInternalProject();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const json = await this._interface.listProjects(tokenStore);
    return json.map((j) => this._projectAdminFromJson(j));
  }

  async createProject(newProject: Pick<Project, "displayName" | "description">): Promise<Project> {
    this._ensureInternalProject();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const json = await this._interface.createProject(newProject, tokenStore);
    return this._projectAdminFromJson(json);
  }

  static get [stackAppInternalsSymbol]() {
    return {
      fromClientJson: async <HasTokenStore extends boolean, ProjectId extends string>(
        json: StackClientAppJson<HasTokenStore, ProjectId>
      ): Promise<StackClientApp<HasTokenStore, ProjectId>> => {
        const existing = allClientApps.get(json.uniqueIdentifier);
        if (existing) {
          const [checkString, clientApp] = existing;
          if (checkString !== JSON.stringify(json)) {
            throw new Error("The provided app JSON does not match the configuration of the existing client app with the same unique identifier");
          }
          return clientApp as any;
        }

        return new _StackClientAppImpl<HasTokenStore, ProjectId>({
          ...json,
          checkString: JSON.stringify(json),
        });
      }
    };
  }

  get [stackAppInternalsSymbol]() {
    return {
      toClientJson: async (): Promise<StackClientAppJson<HasTokenStore, ProjectId>> => {
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
      }
    };
  };
}

class _StackServerAppImpl<HasTokenStore extends boolean, ProjectId extends string> extends _StackClientAppImpl<HasTokenStore, ProjectId>
{
  declare protected _interface: StackServerInterface;

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
        await app._interface.deleteServerUser(this.id);
      },
      async update(update: ServerUserCustomizableJson) {
        await app._interface.setServerUserCustomizableData(this.id, update);
      },
      getClientUser() {
        return {
          ...app._userFromJson(json),
        };
      },
      toJson() {
        return app._serverUserToJson(this);
      },
    };
  }

  protected _currentServerUserFromJson(json: ServerUserJson, tokenStore: TokenStore): CurrentServerUser;
  protected _currentServerUserFromJson(json: ServerUserJson | null, tokenStore: TokenStore): CurrentServerUser | null;
  protected _currentServerUserFromJson(json: ServerUserJson | null, tokenStore: TokenStore): CurrentServerUser | null {
    if (json === null) return null;
    const app = this;
    const res: CurrentServerUser = {
      ...this._serverUserFromJson(json),
      get accessToken() {
        return AsyncResult.or(tokenStore.get(), null)?.accessToken ?? null;
      },
      get refreshToken() {
        return AsyncResult.or(tokenStore.get(), null)?.refreshToken ?? null;
      },
      signOut(redirectUrl?: string) {
        return app._signOut(tokenStore, redirectUrl);
      },
      getClientUser() {
        const serverUser = this;
        return {
          ...app._userFromJson(json),
          get accessToken() {
            return serverUser.accessToken;
          },
          get refreshToken() {
            return serverUser.refreshToken;
          },
          update(update: Partial<ServerUserCustomizableJson>) {
            return serverUser.update(update);
          },
          signOut(redirectUrl?: string) {
            return serverUser.signOut(redirectUrl);
          },
        };
      },
    };
    Object.freeze(res);
    return res;
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
    };
  }

  async getServerUser(): Promise<CurrentServerUser | null> {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = await this._interface.currentServerUserCache.getOrWait(tokenStore);
    return this._currentServerUserFromJson(userJson, tokenStore);
  }

  useServerUser(options?: { required: boolean }): CurrentServerUser | null {
    this._ensurePersistentTokenStore();

    const router = useRouter();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    const userJson = useValueCache(this._interface.currentServerUserCache.getValueCache(tokenStore));

    if (options?.required && userJson === null) {
      use(this.redirectToSignIn());
    }

    return this._currentServerUserFromJson(userJson, tokenStore);
  }

  onServerUserChange(callback: (user: CurrentServerUser | null) => void) {
    this._ensurePersistentTokenStore();
    const tokenStore = getTokenStore(this._tokenStoreOptions);
    return this._interface.currentServerUserCache.getValueCache(tokenStore).onChange((userJson) => {
      callback(this._currentServerUserFromJson(userJson, tokenStore));
    });
  }
}

class _StackAdminAppImpl<HasTokenStore extends boolean, ProjectId extends string> extends _StackServerAppImpl<HasTokenStore, ProjectId>
{
  declare protected _interface: StackAdminInterface;

  constructor(options: StackAdminAppConstructorOptions<HasTokenStore, ProjectId>) {
    super({
      interface: new StackAdminInterface({
        baseUrl: options.baseUrl ?? getDefaultBaseUrl(),
        projectId: options.projectId ?? getDefaultProjectId(),
        publishableClientKey: options.publishableClientKey ?? getDefaultPublishableClientKey(),
        secretServerKey: options.secretServerKey ?? getDefaultSecretServerKey(),
        superSecretAdminKey: options.superSecretAdminKey ?? getDefaultSuperSecretAdminKey(),
      }),
      tokenStore: options.tokenStore,
      urls: options.urls,
    });
  }

  async getProjectAdmin(): Promise<Project> {
    return this._projectAdminFromJson(await this._interface.projectCache.getOrWait());
  }

  useProjectAdmin(): Project {
    return this._projectAdminFromJson(useValueCache(this._interface.projectCache));
  }

  onProjectAdminChange(callback: (project: Project) => void) {
    return this._interface.projectCache.onChange((j) => callback(this._projectAdminFromJson(j)));
  }
}

type Auth<T, C> = {
  readonly accessToken: string | null,
  readonly refreshToken: string | null,
  update(this: T, user: Partial<C>): Promise<void>,
  signOut(this: T, redirectUrl?: string): Promise<never>,
};

export type User = {
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

  toJson(this: CurrentUser): UserJson,
};

export type CurrentUser = Auth<User, UserCustomizableJson> & User;


/**
 * A user including sensitive fields that should only be used on the server, never sent to the client
 * (such as sensitive information and serverMetadata).
 */
export type ServerUser = Omit<User, "toJson"> & {
  readonly serverMetadata: ReadonlyJson,

  /**
   * Returns a new user object with the sensitive fields removed.
   */
  getClientUser(this: ServerUser): User,

  toJson(this: ServerUser): ServerUserJson,

  update(this: ServerUser, user: Partial<ServerUserCustomizableJson>): Promise<void>,
  delete(this: ServerUser): Promise<void>,
};

export type CurrentServerUser = Auth<ServerUser, ServerUserCustomizableJson> & Omit<ServerUser, "getClientUser"> & {
  getClientUser(this: CurrentServerUser): CurrentUser,
};

export type Project = Readonly<{
  id: string,
  displayName: string,
  description?: string,
  createdAt: Date,
  userCount: number,
  isProductionMode: boolean,
  evaluatedConfig: {
    id: string,
    allowLocalhost: boolean,
    oauthProviders: OauthProviderConfig[],
    emailConfig?: EmailConfig,
    domains: DomainConfig[],
  },
}>;

export type EmailConfig = EmailConfigJson;

export type DomainConfig = DomainConfigJson;

export type OauthProviderConfig = OauthProviderConfigJson;

export type GetUserOptions = {
  or?: 'redirect' | 'throw',
};

type AsyncStoreProperty<Name extends string, Value> =
  & { [key in `get${Capitalize<Name>}`]: () => Promise<Value> }
  & { [key in `on${Capitalize<Name>}Change`]: (callback: (value: Value) => void) => void }
  & { [key in `use${Capitalize<Name>}`]: () => Value }

export type StackClientApp<HasTokenStore extends boolean, ProjectId extends string = string> = (
  & {
    readonly projectId: ProjectId,

    readonly urls: Readonly<HandlerUrls>,

    signInWithOauth(provider: string): Promise<void>,
    signInWithCredential(options: { email: string, password: string, redirectUrl?: string }): Promise<SignInErrorCode | undefined>,
    signUpWithCredential(options: { email: string, password: string, redirectUrl?: string }): Promise<SignUpErrorCode | undefined>,
    callOauthCallback(options?: { redirectUrl?: string }): Promise<void>,
    sendForgotPasswordEmail(email: string): Promise<void>,
    resetPassword(options: { code: string, password: string }): Promise<PasswordResetLinkErrorCode | undefined>,
    verifyPasswordResetCode(code: string): Promise<PasswordResetLinkErrorCode | undefined>,
    verifyEmail(code: string): Promise<EmailVerificationLinkErrorCode | undefined>,

    [stackAppInternalsSymbol]: {
      toClientJson(): Promise<StackClientAppJson<HasTokenStore, ProjectId>>,
    },
  }
  & AsyncStoreProperty<"project", ClientProjectJson>
  & { [K in `redirectTo${Capitalize<keyof HandlerUrls>}`]: () => Promise<never> }
  & (HasTokenStore extends false
    ? {}
    : {
      useUser(options: GetUserOptions & { or: 'redirect' }): CurrentUser,
      useUser(options: GetUserOptions & { or: 'throw' }): CurrentUser,
      useUser(options?: GetUserOptions): CurrentUser | null,
      getUser(options: GetUserOptions & { or: 'redirect' }): Promise<CurrentUser>,
      getUser(options: GetUserOptions & { or: 'throw' }): Promise<CurrentUser>,
      getUser(options?: GetUserOptions): Promise<CurrentUser | null>,
      onUserChange: AsyncStoreProperty<"user", CurrentUser | null>["onUserChange"],
    })
  & (
    ProjectId extends "internal" ? {
      listOwnedProjects(): Promise<Project[]>,
      createProject(project: Pick<Project, "displayName" | "description">): Promise<Project>,
    } : {}
  )
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
    ): Promise<StackClientApp<HasTokenStore, ProjectId>>,
  },
};
export const StackClientApp: StackClientAppConstructor = _StackClientAppImpl;

export type StackServerApp<HasTokenStore extends boolean, ProjectId extends string = string> = (
  & StackClientApp<HasTokenStore, ProjectId>
  & AsyncStoreProperty<"serverUser", CurrentServerUser | null>
  & {}
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

export type StackAdminApp<HasTokenStore extends boolean, ProjectId extends string = string> = (
  & StackServerApp<HasTokenStore, ProjectId>
  & AsyncStoreProperty<"projectAdmin", Project>
);
type StackAdminAppConstructor = {
  new <
    TokenStoreType extends string,
    HasTokenStore extends (TokenStoreType extends {} ? true : boolean),
    ProjectId extends string
  >(options: StackAdminAppConstructorOptions<HasTokenStore, ProjectId>): StackAdminApp<HasTokenStore, ProjectId>,
  new (options: StackAdminAppConstructorOptions<boolean, string>): StackAdminApp<boolean, string>,
};
export const StackAdminApp: StackAdminAppConstructor = _StackAdminAppImpl;
