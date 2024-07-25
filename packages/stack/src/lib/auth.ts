import { StackClientInterface } from "@stackframe/stack-shared";
import { InternalSession } from "@stackframe/stack-shared/dist/sessions";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { neverResolve } from "@stackframe/stack-shared/dist/utils/promises";
import { constructRedirectUrl } from "../utils/url";
import { getVerifierAndState, saveVerifierAndState } from "./cookie";

export async function signInWithOAuth(
  iface: StackClientInterface,
  options: {
    provider: string,
    redirectUrl: string,
    errorRedirectUrl: string,
    providerScope?: string,
  }
) {
  const { codeChallenge, state } = await saveVerifierAndState();
  const location = await iface.getOAuthUrl({
    provider: options.provider,
    redirectUrl: constructRedirectUrl(options.redirectUrl),
    errorRedirectUrl: constructRedirectUrl(options.errorRedirectUrl),
    codeChallenge,
    state,
    type: "authenticate",
    providerScope: options.providerScope,
  });
  window.location.assign(location);
  await neverResolve();
}

export async function addNewOAuthProviderOrScope(
  iface: StackClientInterface,
  options: {
    provider: string,
    redirectUrl: string,
    errorRedirectUrl: string,
    providerScope?: string,
  },
  session: InternalSession,
) {
  const { codeChallenge, state } = await saveVerifierAndState();
  const location = await iface.getOAuthUrl({
    provider: options.provider,
    redirectUrl: constructRedirectUrl(options.redirectUrl),
    errorRedirectUrl: constructRedirectUrl(options.errorRedirectUrl),
    afterCallbackRedirectUrl: constructRedirectUrl(window.location.href),
    codeChallenge,
    state,
    type: "link",
    session,
    providerScope: options.providerScope,
  });
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

  // the rest can be asynchronous (we now know that we are the
  // intended recipient of the callback)
  try {
    return await iface.callOAuthCallback({
      oauthParams: originalUrl.searchParams,
      redirectUri: constructRedirectUrl(redirectUrl),
      codeVerifier,
      state,
    });
  } catch (e) {
    throw new StackAssertionError("Error signing in during OAuth callback. Please try again.", { cause: e });
  }
}
