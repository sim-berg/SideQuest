/**
 * Scope user-authored profile CSS to a container so it can style the profile
 * card freely without leaking into the rest of the app. The backend already
 * sanitized the CSS (no url(), @import, position:fixed, ...); this adds
 * client-side defense in depth plus the actual selector scoping.
 *
 * Supported subset (documented in the editor UI):
 *  - bare declarations ("background: hotpink;") → applied to the card itself
 *  - simple rules (".bio { ... }", "h2, p { ... }") → selectors get prefixed
 * At-rules other than @media are dropped.
 */
const FORBIDDEN = [
  /@import/i,
  /@charset/i,
  /@namespace/i,
  /url\s*\(/i,
  /expression\s*\(/i,
  /javascript\s*:/i,
  /behavior\s*:/i,
  /-moz-binding/i,
  /position\s*:\s*fixed/i,
  /<\s*\//,
  /<\s*script/i,
];

export function isCssSafe(css: string): boolean {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return !FORBIDDEN.some((p) => p.test(noComments));
}

export function scopeCss(css: string, scope: string): string {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!clean || !isCssSafe(clean)) return '';

  // No braces at all → treat the whole thing as declarations for the card.
  if (!clean.includes('{')) {
    return `${scope} { ${clean} }`;
  }

  let out = '';
  let rest = clean;
  while (rest.length > 0) {
    const braceIdx = rest.indexOf('{');
    if (braceIdx === -1) break;
    const selector = rest.slice(0, braceIdx).trim();
    const closeIdx = findMatchingBrace(rest, braceIdx);
    if (closeIdx === -1) break;
    const body = rest.slice(braceIdx + 1, closeIdx);
    rest = rest.slice(closeIdx + 1);

    if (selector.startsWith('@media')) {
      // Recurse into the media query's body.
      out += `${selector} { ${scopeCss(body, scope)} } `;
    } else if (selector.startsWith('@')) {
      // Other at-rules (keyframes etc.) are dropped for now.
      continue;
    } else {
      const scoped = selector
        .split(',')
        .map((s) => `${scope} ${s.trim()}`)
        .join(', ');
      out += `${scoped} { ${body} } `;
    }
  }
  return out.trim();
}

function findMatchingBrace(text: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
