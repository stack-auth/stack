import { StackClientInterface } from "@stackframe/stack-shared";
import { saveVerifierAndState, getVerifierAndState } from "./cookie";
import { constructRedirectUrl } from "../utils/url";
import { TokenStore } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { neverResolve, wait } from "@stackframe/stack-shared/dist/utils/promises";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";

export async function signInWithOAuth(
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
  const location = await iface.getOAuthUrl(
    provider,
    redirectUrl,
    codeChallenge,
    state,
  );
  window.location.assign(location);
  await neverResolve();
}

/**
 * Checks if the current URL has the query parameters for an OAuth callback, and if so, removes them.
 * 
 * Must be synchronous for the logic in callOAuthCallback to work without race conditions.
 */
function consumeOAuthCallbackQueryParams(expectedState: string): null | URL {
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

  return originalUrl; 
}

export async function callOAuthCallback(
  iface: StackClientInterface,
  tokenStore: TokenStore,
  redirectUrl: string,
) {
  // note: this part of the function (until the return) needs
  // to be synchronous, to prevent race conditions when
  // callOAuthCallback is called multiple times in parallel
  const { codeVerifier, state } = getVerifierAndState();
  if (!codeVerifier || !state) {
    throw new Error("Invalid OAuth callback URL parameters. It seems like the OAuth flow was interrupted, so please try again.");
  }
  const originalUrl = consumeOAuthCallbackQueryParams(state);
  if (!originalUrl) return null;
  console.log("made it through");

  // the rest can be asynchronous (we now know that we are the
  // intended recipient of the callback)
  try {
    return await iface.callOAuthCallback(
      originalUrl.searchParams,
      constructRedirectUrl(redirectUrl),
      codeVerifier,
      state,
      tokenStore,
    );
  } catch (e) {
    throw new StackAssertionError("Error signing in during OAuth callback. Please try again.", { cause: e });
  }
}
