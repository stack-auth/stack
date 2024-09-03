export function SiteLoadingIndicator() {
  // Next.js doesn't like a sticky or fixed position element at the root, so wrap it in a span
  // https://github.com/shadcn-ui/ui/issues/1355
  return (
    <span>
      <span className="loader" />
    </span>
  );
}
