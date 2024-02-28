/**
 * https://n2d4.github.io/frontend-starter/guides/advanced-concepts#clickable-parents
 */
export function hasClickableParent(element: HTMLElement): boolean {
  const parent = element.parentElement;
  if (!parent) return false;
  if (parent.dataset.n2Clickable) return true;

  return !!element.parentElement && hasClickableParent(element.parentElement);
}
