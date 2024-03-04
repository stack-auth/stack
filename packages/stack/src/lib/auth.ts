import { StackClientInterface } from "@stackframe/stack-shared";
import { saveVerifierAndState, getVerifierAndState } from "./cookie";
import { constructRedirectUrl } from "../utils/url";
import { TokenStore } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { SignInErrorCode, SignUpErrorCode } from "@stackframe/stack-shared/dist/utils/types";

export async function signInWithOauth(
  iface: StackClientInterface,
  {
    provider,
    redirectUrl,
  } : { 
    provider: string,
    redirectUrl?: string,
  }
) {
  redirectUrl = constructRedirectUrl(redirectUrl);
  const { codeChallenge, state } = await saveVerifierAndState();
  const location = await iface.getOauthUrl(
    provider,
    redirectUrl,
    codeChallenge,
    state,
  );
  window.location.assign(location);
}

/**
 * Checks if the current URL has the query parameters for an OAuth callback, and if so, removes them.
 * 
 * Must be synchronous for the logic in callOauthCallback to work without race conditions.
 */
function consumeOauthCallbackQueryParams(expectedState: string | null): null | {
  newUrl: URL,
  originalUrl: URL,
} {
  const requiredParams = ["code", "state"];
  const originalUrl = new URL(window.location.href);
  for (const param of requiredParams) {
    if (!originalUrl.searchParams.has(param)) {
      return null;
    }
  }

  if (expectedState !== originalUrl.searchParams.get("state")) {
    // If the state doesn't match, then the callback wasn't meant for us.
    // Maybe the website uses another OAuth library?
    return null;
  }


  const newUrl = new URL(originalUrl);
  for (const param of requiredParams) {
    newUrl.searchParams.delete(param);
  }

  // let's get rid of the authorization code in the history as we
  // don't redirect to `redirectUrl` if there's a validation error
  // (as the redirectUrl might be malicious!).
  //
  // We use history.replaceState instead of location.assign(...) to
  // prevent an unnecessary reload
  window.history.replaceState({}, "", newUrl.toString());

  return { newUrl, originalUrl };
}

export async function callOauthCallback(
  iface: StackClientInterface,
  tokenStore: TokenStore,
  redirectUrl?: string,
) {
  // note: this part of the function (until the return) needs
  // to be synchronous, to prevent race conditions when
  // callOauthCallback is called multiple times in parallel
  const { codeVerifier, state } = getVerifierAndState();
  const consumeResult = consumeOauthCallbackQueryParams(state);
  if (!consumeResult) {
    return;
  }

  if (!codeVerifier || !state) {
    return;
  }

  // the rest can be asynchronous (we now know that we are the
  // intended recipient of the callback)

  const { newUrl, originalUrl } = consumeResult;

  if (!redirectUrl) {
    redirectUrl = newUrl.toString();
  }

  redirectUrl = redirectUrl.split("#")[0]; // remove hash

  try {
    await iface.callOauthCallback(
      originalUrl.searchParams,
      redirectUrl,
      codeVerifier,
      state,
      tokenStore,
    );

    // reload/redirect so the server can update now that the user is signed in
    window.location.assign(redirectUrl);
  } catch (e) {
    console.error("Error signing in during OAuth callback", e);
    throw new Error("Error signing in. Please try again.");
  }
}

export async function signInWithCredential(
  iface: StackClientInterface,
  tokenStore: TokenStore,
  {
    email,
    password,
    redirectUrl,
  }: {
    email: string,
    password: string,
    redirectUrl?: string,
  }
): Promise<SignInErrorCode | undefined>{
  const errorCode = await iface.signInWithCredential(email, password, tokenStore);
  if (!errorCode) {
    redirectUrl = constructRedirectUrl(redirectUrl);
    window.location.assign(redirectUrl);
  }
  return errorCode;
}

export async function signUpWithCredential(
  iface: StackClientInterface,
  tokenStore: TokenStore,
  {
    email,
    password,
    redirectUrl,
    emailVerificationRedirectUrl = "/"
  }: {
    email: string,
    password: string,
    redirectUrl?: string,
    emailVerificationRedirectUrl?: string,
  }
): Promise<SignUpErrorCode | undefined>{
  emailVerificationRedirectUrl = constructRedirectUrl(emailVerificationRedirectUrl);
  const errorCode = await iface.signUpWithCredential(email, password, emailVerificationRedirectUrl, tokenStore);
  if (!errorCode) {
    redirectUrl = constructRedirectUrl(redirectUrl);
    window.location.assign(redirectUrl);
  }
  return errorCode;
}
