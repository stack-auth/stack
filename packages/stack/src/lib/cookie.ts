import { generateRandomCodeVerifier, generateRandomState, calculatePKCECodeChallenge } from "oauth4webapi";
import Cookies from "js-cookie";
import { isClient } from "../utils/next";
import { cookies } from '@stackframe/stack-sc';

export function getCookie(name: string): string | null {
  // TODO the differentiating factor should be RCC vs. RSC, not whether it's a client
  if (isClient()) {
    return Cookies.get(name) ?? null;
  } else {
    return cookies().get(name)?.value ?? null;
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
  // TODO the differentiating factor should be RCC vs. RSC, not whether it's a client
  if (isClient()) {
    Cookies.remove(name);
  } else {
    cookies().delete(name);
  }
}

export function setCookie(name: string, value: string) {
  // TODO the differentiating factor should be RCC vs. RSC, not whether it's a client
  if (isClient()) {
    Cookies.set(name, value);
  } else {
    cookies().set(name, value);
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
