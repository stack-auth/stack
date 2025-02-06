export function SiteLoadingIndicatorDisplay() {
  // Next.js doesn't like a sticky or fixed position element at the root, so wrap it in a span
  // https://github.com/shadcn-ui/ui/issues/1355
  return <span>
    <span className="site-loading-indicator">
      <span className="site-loading-indicator-inner">
        <span className="site-loading-indicator-inner-glow" />
      </span>
    </span>
  </span>;
}

export function SiteLoadingIndicator() {
  return <div className="show-site-loading-indicator" />;
}
