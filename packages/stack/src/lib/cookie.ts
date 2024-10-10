import { cookies as rscCookies, headers as rscHeaders } from '@stackframe/stack-sc/force-react-server';
import Cookies from "js-cookie";
import { calculatePKCECodeChallenge, generateRandomCodeVerifier, generateRandomState } from "oauth4webapi";

type SetCookieOptions = { maxAge?: number };

export function getCookie(name: string): string | null {
  if (typeof window !== "undefined") {
    // This is a flag to automatically detect whether we're on https for the next server request
    // Check out the comment in setCookie for more details
    Cookies.set("stack-is-https", "true");
    return Cookies.get(name) ?? null;
  } else {
    return rscCookies().get(name)?.value ?? null;
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
  if (typeof window !== "undefined") {
    Cookies.remove(name);
  } else {
    rscCookies().delete(name);
  }
}

export function setCookie(name: string, value: string, options: SetCookieOptions = {}) {
  // Check if the current page is server over HTTPS with:
  // 1. Check if the https cookie is set on the client (see comment above)
  // 2. If on the client, check the protocol directly
  // 3. If on the server, check the X-Forwarded-Proto header
  let isSecureCookie = !!getCookie("stack-is-https");

  if (typeof window !== "undefined") {
    if (window.location.protocol === "https:") {
      isSecureCookie = true;
    }
    Cookies.set(name, value, {
      secure: isSecureCookie,
      expires: options.maxAge === undefined ? undefined : new Date(Date.now() + (options.maxAge) * 1000),
      sameSite: "Strict"
    });
  } else {
    if (rscHeaders().get("x-forwarded-proto") === "https") {
      isSecureCookie = true;
    }

    rscCookies().set(name, value, {
      secure: isSecureCookie,
      maxAge: options.maxAge,
    });
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
