export function autoRedirect() {
  const url = new URL(window.location.href);
  const redirectUrl = url.searchParams.get("auto-redirect-url");
  if (redirectUrl) {
    const urlObject = new URL(redirectUrl);
    if (urlObject.origin !== window.location.origin) {
      throw new Error("auto-redirect-url is not same origin (" + urlObject.origin + " !== " + window.location.origin + ")");
    }
    url.searchParams.delete("auto-redirect-url");
    window.location.replace(urlObject.href);
  }
}

export function constructRedirectUrl(redirectUrl: URL | string | undefined) {
  const url = redirectUrl ? new URL(redirectUrl, window.location.href) : new URL(window.location.href);
  return url.href.split("#")[0];
}
