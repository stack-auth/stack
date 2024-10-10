import { cookies as rscCookies, headers as rscHeaders } from '@stackframe/stack-sc/force-react-server';
import Cookies from "js-cookie";
import { calculatePKCECodeChallenge, generateRandomCodeVerifier, generateRandomState } from "oauth4webapi";

type SetCookieOptions = { maxAge?: number };

function isRscCookieUnavailableError(e: any) {
  const allowedMessageSnippets = ["was called outside a request scope", "cookies() expects to have requestAsyncStorage"];
  return typeof e?.message === "string" && allowedMessageSnippets.some(msg => e.message.includes(msg));
}

function isRscHeadersUnavailableError(e: any) {
  const allowedMessageSnippets = ["was called outside a request scope"];
  return typeof e?.message === "string" && allowedMessageSnippets.some(msg => e.message.includes(msg));
}

export function getCookie(name: string): string | null {
  try {
    return rscCookies().get(name)?.value ?? null;
  } catch (e: any) {
    if (isRscCookieUnavailableError(e)) {
      return Cookies.get(name) ?? null;
    } else {
      throw e;
    }
  } finally {
    // This is a flag to automatically detect whether we're on https for the next server request
    // Check out the comment in setCookie for more details
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      Cookies.set("stack-is-https", "true");
    }
  }
}

export function setOrDeleteCookie(name: string, value: string | null, options: SetCookieOptions = {}) {
  if (value === null) {
    deleteCookie(name);
  } else {
    setCookie(name, value, options);
  }
}

export function deleteCookie(name: string) {
  try {
    rscCookies().delete(name);
  } catch (e: any) {
    if (isRscCookieUnavailableError(e)) {
      Cookies.remove(name);
    } else {
      throw e;
    }
  }
}

export function setCookie(name: string, value: string, options: SetCookieOptions = {}) {
  // ================================
  // Check if the current page is server over HTTPS with
  // 1. Check if the https cookie is set on the client
  // 2. If on the client, check the protocol directly
  // 3. If on the server, check the X-Forwarded-Proto header
  let isSecureCookie = !!getCookie("stack-is-https");
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    isSecureCookie = true;
  }
  try {
    const proto = rscHeaders().get("x-forwarded-proto");
    if (proto === "https") {
      isSecureCookie = true;
    }
  } catch (e: any) {
    if (isRscHeadersUnavailableError(e)) {
      // Ignore
    } else {
      throw e;
    }
  }
  // ================================

  try {
    rscCookies().set(name, value, {
      secure: isSecureCookie,
      maxAge: options.maxAge,
    });
  } catch (e: any) {
    if (isRscCookieUnavailableError(e)) {
      Cookies.set(name, value, {
        secure: isSecureCookie,
        expires: options.maxAge === undefined ? undefined : new Date(Date.now() + (options.maxAge) * 1000),
        sameSite: "Strict"
      });
    } else {
      throw e;
    }
  }
}

export async function saveVerifierAndState() {
  const codeVerifier = generateRandomCodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  const state = generateRandomState();

  setCookie("stack-oauth-outer-" + state, codeVerifier, { maxAge: 60 * 60 });

  return {
    codeChallenge,
    state,
  };
}

export function consumeVerifierAndStateCookie(state: string) {
  const cookieName = "stack-oauth-outer-" + state;
  const codeVerifier = getCookie(cookieName);
  if (!codeVerifier) {
    return null;
  }
  deleteCookie(cookieName);
  return {
    codeVerifier,
  };
}
