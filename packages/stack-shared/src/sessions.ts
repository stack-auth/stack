import { StackAssertionError } from "./utils/errors";
import { Store } from "./utils/stores";

export class AccessToken {
  constructor(public readonly token: string) {
    if (token === "undefined") {
      throw new StackAssertionError(
        "Access token is the string 'undefined'; it's unlikely this is the correct value. They're supposed to be unguessable!",
      );
    }
  }
}

export class RefreshToken {
  constructor(public readonly token: string) {
    if (token === "undefined") {
      throw new StackAssertionError(
        "Refresh token is the string 'undefined'; it's unlikely this is the correct value. They're supposed to be unguessable!",
      );
    }
  }
}

/**
 * An InternalSession represents a user's session, which may or may not be valid. It may contain an access token, a refresh token, or both.
 *
 * A session never changes which user or session it belongs to, but the tokens in it may change over time.
 */
export class InternalSession {
  /**
   * Each session has a session key that depends on the tokens inside. If the session has a refresh token, the session key depends only on the refresh token. If the session does not have a refresh token, the session key depends only on the access token.
   *
   * Multiple Session objects may have the same session key, which implies that they represent the same session by the same user. Furthermore, a session's key never changes over the lifetime of a session object.
   *
   * This is useful for caching and indexing sessions.
   */
  public readonly sessionKey: string;

  /**
   * An access token that is not known to be invalid (ie. may be valid, but may have expired).
   */
  private _accessToken: Store<AccessToken | null>;
  private readonly _refreshToken: RefreshToken | null;

  /**
   * Whether the session as a whole is known to be invalid. Used as a cache to avoid making multiple requests to the server (sessions never go back to being valid after being invalidated).
   *
   * Applies to both the access token and the refresh token (it is possible for the access token to be invalid but the refresh token to be valid, in which case the session is still valid).
   */
  private _knownToBeInvalid = new Store<boolean>(false);

  private _refreshPromise: Promise<AccessToken | null> | null = null;

  constructor(
    private readonly _options: {
      refreshAccessTokenCallback(refreshToken: RefreshToken): Promise<AccessToken | null>;
      refreshToken: string | null;
      accessToken?: string | null;
    },
  ) {
    this._accessToken = new Store(_options.accessToken ? new AccessToken(_options.accessToken) : null);
    this._refreshToken = _options.refreshToken ? new RefreshToken(_options.refreshToken) : null;
    this.sessionKey = InternalSession.calculateSessionKey({
      accessToken: _options.accessToken ?? null,
      refreshToken: _options.refreshToken,
    });
  }

  static calculateSessionKey(ofTokens: { refreshToken: string | null; accessToken?: string | null }): string {
    if (ofTokens.refreshToken) {
      return `refresh-${ofTokens.refreshToken}`;
    } else if (ofTokens.accessToken) {
      return `access-${ofTokens.accessToken}`;
    } else {
      return "not-logged-in";
    }
  }

  isKnownToBeInvalid() {
    return this._knownToBeInvalid.get();
  }

  /**
   * Marks the session object as invalid, meaning that the refresh and access tokens can no longer be used.
   */
  markInvalid() {
    this._accessToken.set(null);
    this._knownToBeInvalid.set(true);
  }

  onInvalidate(callback: () => void): { unsubscribe: () => void } {
    return this._knownToBeInvalid.onChange(() => callback());
  }

  /**
   * Returns the access token if it is found in the cache, fetching it otherwise.
   *
   * This is usually the function you want to call to get an access token. When using the access token, you should catch errors that occur if it expires, and call `markAccessTokenExpired` to mark the token as expired if so (after which a call to this function will always refetch the token).
   *
   * @returns null if the session is known to be invalid, cached tokens if they exist in the cache (which may or may not be valid still), or new tokens otherwise.
   */
  async getPotentiallyExpiredTokens(): Promise<{ accessToken: AccessToken; refreshToken: RefreshToken | null } | null> {
    const accessToken = await this._getPotentiallyExpiredAccessToken();
    return accessToken ? { accessToken, refreshToken: this._refreshToken } : null;
  }

  /**
   * Fetches new tokens that are, at the time of fetching, guaranteed to be valid.
   *
   * The newly generated tokens are shortlived, so it's good practice not to rely on their validity (if possible). However, this function is useful in some cases where you only want to pass access tokens to a service, and you want to make sure said access token has the longest possible lifetime.
   *
   * In most cases, you should prefer `getPotentiallyExpiredTokens` with a fallback to `markAccessTokenExpired` and a retry mechanism if the endpoint rejects the token.
   *
   * @returns null if the session is known to be invalid, or new tokens otherwise (which, at the time of fetching, are guaranteed to be valid).
   */
  async fetchNewTokens(): Promise<{ accessToken: AccessToken; refreshToken: RefreshToken | null } | null> {
    const accessToken = await this._getNewlyFetchedAccessToken();
    return accessToken ? { accessToken, refreshToken: this._refreshToken } : null;
  }

  markAccessTokenExpired(accessToken: AccessToken) {
    if (this._accessToken.get() === accessToken) {
      this._accessToken.set(null);
    }
  }

  /**
   * Note that a callback invocation with `null` does not mean the session has been invalidated; the access token may just have expired. Use `onInvalidate` to detect invalidation.
   */
  onAccessTokenChange(callback: (newAccessToken: AccessToken | null) => void): { unsubscribe: () => void } {
    return this._accessToken.onChange(callback);
  }

  /**
   * @returns An access token (cached if possible), or null if the session either does not represent a user or the session is invalid.
   */
  private async _getPotentiallyExpiredAccessToken(): Promise<AccessToken | null> {
    if (!this._refreshToken) return null;
    if (this._knownToBeInvalid.get()) return null;
    const oldAccessToken = this._accessToken.get();
    if (oldAccessToken) return oldAccessToken;

    // refresh access token
    if (!this._refreshPromise) {
      this._refreshAndSetRefreshPromise(this._refreshToken);
    }
    return await this._refreshPromise;
  }

  /**
   * You should prefer `getPotentiallyExpiredAccessToken` in almost all cases.
   *
   * @returns A newly fetched access token (never read from cache), or null if the session either does not represent a user or the session is invalid.
   */
  private async _getNewlyFetchedAccessToken(): Promise<AccessToken | null> {
    if (!this._refreshToken) return null;
    if (this._knownToBeInvalid.get()) return null;

    this._refreshAndSetRefreshPromise(this._refreshToken);
    return await this._refreshPromise;
  }

  private _refreshAndSetRefreshPromise(refreshToken: RefreshToken) {
    const refreshPromise: Promise<AccessToken | null> = this._options.refreshAccessTokenCallback(refreshToken).then((accessToken) => {
      if (refreshPromise === this._refreshPromise) {
        this._refreshPromise = null;
        this._accessToken.set(accessToken);
        if (!accessToken) {
          this.markInvalid();
        }
      }
      return accessToken;
    });
    this._refreshPromise = refreshPromise;
  }
}
