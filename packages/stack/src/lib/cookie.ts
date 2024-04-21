import { generateRandomCodeVerifier, generateRandomState, calculatePKCECodeChallenge } from "oauth4webapi";
import Cookies from "js-cookie";
import { cookies as rscCookies } from '@stackframe/stack-sc';

export function getCookie(name: string): string | null {
  // TODO the differentiating factor should be RCC vs. RSC, not whether it's a client
  if (rscCookies) {
    return rscCookies().get(name)?.value ?? null;
  } else {
    return Cookies.get(name) ?? null;
  }
}

export function setOrDeleteCookie(name: string, value: string | null) {
  if (value === null) {
    deleteCookie(name);
  } else {
    setCookie(name, value);
  }
}

export function deleteCookie(name: string) {
  if (rscCookies) {
    rscCookies().delete(name);
  } else {
    Cookies.remove(name);
  }
}

export function setCookie(name: string, value: string) {
  if (rscCookies) {
    rscCookies().set(name, value);
  } else {
    Cookies.set(name, value, { secure: window.location.protocol === "https:" });
  }
}

export async function saveVerifierAndState() {
  const codeVerifier = generateRandomCodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  const state = generateRandomState();

  setCookie("stack-code-verifier", codeVerifier);
  setCookie("stack-state", state);

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
