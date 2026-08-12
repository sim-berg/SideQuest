const OBJECT_ID_RE = /([0-9a-f]{24})$/;

export function toSlug(title: string, id: string): string {
  const kebab = title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${kebab}-${id}`;
}

export function idFromSlug(slug: string): string | null {
  const match = slug.match(OBJECT_ID_RE);
  return match ? match[1] : null;
}
