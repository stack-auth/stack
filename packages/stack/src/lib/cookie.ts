import { cookies as rscCookies } from '@stackframe/stack-sc/force-react-server';
import Cookies from "js-cookie";
import { calculatePKCECodeChallenge, generateRandomCodeVerifier, generateRandomState } from "oauth4webapi";

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
  const isProd = process.env.NODE_ENV === "production";
  try {
    rscCookies().set(name, value, {
      secure: isProd,
      maxAge: options.maxAge,
    });
  } catch (e: any) {
    if (isRscCookieUnavailableError(e)) {
      if (window.location.protocol !== "https:" && isProd) {
        throw new Error("Attempted to set a secure cookie, but this build was compiled as a production build, but the current page is not served over HTTPS. This is a security risk and is not allowed in production.");
      }
      Cookies.set(name, value, {
        secure: isProd,
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

  setCookie("stack-outer-code-verifier", codeVerifier, { maxAge: 60 * 10 });
  setCookie("stack-outer-state", state, { maxAge: 60 * 10 });

  return {
    codeChallenge,
    state,
  };
}

export function getVerifierAndState() {
  const codeVerifier = getCookie("stack-outer-code-verifier");
  const state = getCookie("stack-outer-state");
  return {
    codeVerifier,
    state,
  };
}
