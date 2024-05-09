import { generateRandomCodeVerifier, generateRandomState, calculatePKCECodeChallenge } from "oauth4webapi";
import Cookies from "js-cookie";
import { cookies as rscCookies } from '@stackframe/stack-sc/force-server';

type SetCookieOptions = { maxAge?: number };

function isRscCookieUnavailableError(e: any) {
  const allowedMessageSnippets = ["was called outside a request scope", "cookies() expects to have requestAsyncStorage"];
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
  try {
    rscCookies().set(name, value, {
      maxAge: options.maxAge,
    });
  } catch (e: any) {
    if (isRscCookieUnavailableError(e)) {
      Cookies.set(name, value, {
        secure: window.location.protocol === "https:",
        expires: options.maxAge === undefined ? undefined : new Date(Date.now() + (options.maxAge) * 1000),
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

  setCookie("stack-code-verifier", codeVerifier, { maxAge: 60 * 10 });
  setCookie("stack-state", state, { maxAge: 60 * 10 });

  return {
    codeChallenge,
    state,
  };
}

export function getVerifierAndState() {
  const codeVerifier = getCookie("stack-code-verifier");
  const state = getCookie("stack-state");
  return {
    codeVerifier,
    state,
  };
}
