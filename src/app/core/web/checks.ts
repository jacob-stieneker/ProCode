export const all = (d: Document, selector: string) =>
  Array.from(d.querySelectorAll<HTMLElement>(selector));
export const one = (d: Document, selector: string) => d.querySelector<HTMLElement>(selector);
export const text = (e: Element | null) => (e?.textContent ?? '').trim();
export const style = (e: Element) => e.ownerDocument.defaultView!.getComputedStyle(e);
export function visible(e: Element | null): boolean {
  if (!e || !e.getClientRects().length) return false;
  for (let p: Element | null = e; p; p = p.parentElement) {
    const s = style(p);
    if (
      s.display === 'none' ||
      s.visibility !== 'visible' ||
      Number(s.opacity) === 0 ||
      p.getAttribute('aria-hidden') === 'true'
    )
      return false;
  }
  const rect = e.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
export const readable = (d: Document, selector: string, minimum = 1) => {
  const elements = all(d, selector);
  return elements.length >= minimum && elements.every((e) => visible(e) && text(e).length > 0);
};
export const fits = (d: Document) =>
  d.documentElement.scrollWidth <= d.documentElement.clientWidth + 1;
export const near = (a: number, b: number, tolerance = 2) => Math.abs(a - b) <= tolerance;
export function labelled(d: Document, selector: string): boolean {
  const element = d.querySelector<HTMLInputElement>(selector);
  return (
    !!element &&
    visible(element) &&
    !element.matches(':disabled') &&
    !element.hasAttribute('readonly') &&
    Array.from(element.labels ?? []).some((label) => visible(label) && !!text(label))
  );
}
export function stack(d: Document, selector: string) {
  const items = all(d, selector);
  return (
    items.length >= 2 &&
    items.every(visible) &&
    items
      .slice(1)
      .every((e, i) => e.getBoundingClientRect().top >= items[i].getBoundingClientRect().bottom - 1)
  );
}
export function row(d: Document, selector: string) {
  const items = all(d, selector);
  return (
    items.length >= 2 &&
    items.every(visible) &&
    items.slice(1).every((e, i) => {
      const a = items[i].getBoundingClientRect(),
        b = e.getBoundingClientRect();
      return near(a.top, b.top) && b.left >= a.right - 1;
    })
  );
}
export function focusRing(d: Document, selector: string) {
  const e = one(d, selector);
  if (!e || !visible(e)) return false;
  e.focus();
  const s = style(e);
  return (
    d.activeElement === e &&
    ((parseFloat(s.outlineWidth) >= 2 &&
      s.outlineStyle !== 'none' &&
      s.outlineColor !== 'rgba(0, 0, 0, 0)') ||
      s.boxShadow !== 'none')
  );
}
export function anchored(d: Document, selector: string) {
  const links = all(d, selector);
  return (
    links.length > 0 &&
    links.every((link) => {
      const href = link.getAttribute('href');
      return (
        visible(link) &&
        !!text(link) &&
        !!href?.startsWith('#') &&
        href.length > 1 &&
        visible(d.getElementById(href.slice(1)))
      );
    })
  );
}
