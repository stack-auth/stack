import { cookies as rscCookies, headers as rscHeaders } from '@stackframe/stack-sc/force-react-server';
import { isBrowserLike } from '@stackframe/stack-shared/dist/utils/env';
import Cookies from "js-cookie";
import { calculatePKCECodeChallenge, generateRandomCodeVerifier, generateRandomState } from "oauth4webapi";

type SetCookieOptions = { maxAge?: number };

function ensureClient() {
  if (!isBrowserLike()) {
    throw new Error("cookieClient functions can only be called in a browser environment, yet window is undefined");
  }
}

export type CookieHelper = {
  get: (name: string) => string | null,
  set: (name: string, value: string, options: SetCookieOptions) => void,
  setOrDelete: (name: string, value: string | null, options: SetCookieOptions) => void,
  delete: (name: string) => void,
};

export async function createCookieHelper(): Promise<CookieHelper> {
  if (isBrowserLike()) {
    return createBrowserCookieHelper();
  } else {
    return createNextCookieHelper(
      await rscCookies(),
      await rscHeaders(),
    );
  }
}

// TODO next-release: don't export this
export function createBrowserCookieHelper(): CookieHelper {
  return {
    get: getCookieClient,
    set: setCookieClient,
    setOrDelete: setOrDeleteCookieClient,
    delete: deleteCookieClient,
  };
}

// TODO next-release: delete this
export function createNextCookieHelperHack() {
  return createNextCookieHelper(
    rscCookies() as any,
    rscHeaders() as any,
  );
}

function createNextCookieHelper(
  rscCookiesAwaited: Awaited<ReturnType<typeof rscCookies>>,
  rscHeadersAwaited: Awaited<ReturnType<typeof rscHeaders>>,
) {
  const cookieHelper = {
    get: (name: string) => {
      // set a helper cookie, see comment in `NextCookieHelper.set` below
      try {
          rscCookiesAwaited.set("stack-is-https", "true", { secure: true });
      } catch (e) {
        if (
          typeof e === 'object'
            && e !== null
            && 'message' in e
            && typeof e.message === 'string'
            && e.message.includes('Cookies can only be modified in a Server Action or Route Handler')
        ) {
          // ignore
        } else {
          throw e;
        }
      }
      return rscCookiesAwaited.get(name)?.value ?? null;
    },
    set: (name: string, value: string, options: SetCookieOptions) => {
      // Whenever the client is on HTTPS, we want to set the Secure flag on the cookie.
      //
      // This is not easy to find out on a Next.js server, so we use the following steps:
      //
      // 1. If we're on the client, we can check window.location.protocol which is the ground-truth
      // 2. Check whether the stack-is-https cookie exists. This cookie is set in various places on
      //      the client if the protocol is known to be HTTPS
      // 3. Check the X-Forwarded-Proto header
      // 4. Otherwise, assume HTTP without the S
      //
      // Note that malicious clients could theoretically manipulate the `stack-is-https` cookie or
      // the `X-Forwarded-Proto` header; that wouldn't cause any trouble except for themselves,
      // though.
      let isSecureCookie = !!rscCookiesAwaited.get("stack-is-https");
      if (rscHeadersAwaited.get("x-forwarded-proto") === "https") {
        isSecureCookie = true;
      }

      rscCookiesAwaited.set(name, value, {
        secure: isSecureCookie,
        maxAge: options.maxAge,
      });
    },
    setOrDelete(name: string, value: string | null, options: SetCookieOptions) {
      if (value === null) {
        this.delete(name);
      } else {
        this.set(name, value, options);
      }
    },
    delete(name: string) {
      rscCookiesAwaited.delete(name);
    },
  };
  return cookieHelper;
}

export function getCookieClient(name: string): string | null {
  ensureClient();
  // set a helper cookie, see comment in `NextCookieHelper.set` above
  Cookies.set("stack-is-https", "true", { secure: true });
  return Cookies.get(name) ?? null;
}

export async function getCookie(name: string): Promise<string | null> {
  const cookieHelper = await createCookieHelper();
  return cookieHelper.get(name);
}

export function setOrDeleteCookieClient(name: string, value: string | null, options: SetCookieOptions = {}) {
  ensureClient();
  if (value === null) {
    deleteCookieClient(name);
  } else {
    setCookieClient(name, value, options);
  }
}

export async function setOrDeleteCookie(name: string, value: string | null, options: SetCookieOptions = {}) {
  const cookieHelper = await createCookieHelper();
  cookieHelper.setOrDelete(name, value, options);
}

export function deleteCookieClient(name: string) {
  ensureClient();
  Cookies.remove(name);
}

export async function deleteCookie(name: string) {
  const cookieHelper = await createCookieHelper();
  cookieHelper.delete(name);
}

export function setCookieClient(name: string, value: string, options: SetCookieOptions = {}) {
  ensureClient();
  Cookies.set(name, value, {
    expires: options.maxAge === undefined ? undefined : new Date(Date.now() + (options.maxAge) * 1000),
  });
}

export async function setCookie(name: string, value: string, options: SetCookieOptions = {}) {
  const cookieHelper = await createCookieHelper();
  cookieHelper.set(name, value, options);
}

export async function saveVerifierAndState() {
  const codeVerifier = generateRandomCodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  const state = generateRandomState();

  await setCookie("stack-oauth-outer-" + state, codeVerifier, { maxAge: 60 * 60 });

  return {
    codeChallenge,
    state,
  };
}

export function consumeVerifierAndStateCookie(state: string) {
  ensureClient();
  const cookieName = "stack-oauth-outer-" + state;
  const codeVerifier = getCookieClient(cookieName);
  if (!codeVerifier) {
    return null;
  }
  deleteCookieClient(cookieName);
  return {
    codeVerifier,
  };
}
