import { BadRequestException } from '@nestjs/common';

/**
 * Sanity limits for user-authored profile CSS. The goal is "MySpace fun,
 * no mischief": no external requests, no escaping the profile card, no
 * script vectors. The frontend additionally scopes every selector to the
 * profile container before injecting.
 */
const MAX_CSS_LENGTH = 2000;

const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /@import/i, label: '@import' },
  { pattern: /@charset/i, label: '@charset' },
  { pattern: /@namespace/i, label: '@namespace' },
  { pattern: /url\s*\(/i, label: 'url(...)' },
  { pattern: /expression\s*\(/i, label: 'expression(...)' },
  { pattern: /javascript\s*:/i, label: 'javascript:' },
  { pattern: /behavior\s*:/i, label: 'behavior:' },
  { pattern: /-moz-binding/i, label: '-moz-binding' },
  { pattern: /position\s*:\s*fixed/i, label: 'position: fixed' },
  { pattern: /<\s*\//, label: 'HTML' },
  { pattern: /<\s*script/i, label: '<script>' },
];

// Validates user CSS, throwing a german BadRequestException naming the first
// forbidden construct. Returns the trimmed CSS. Comments are stripped first —
// splitting a keyword with an inline comment is the classic way to smuggle
// constructs past naive filters.
export function sanitizeProfileCss(css: string): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const trimmed = withoutComments.trim();

  if (trimmed.length > MAX_CSS_LENGTH) {
    throw new BadRequestException(
      `Profil-CSS darf maximal ${MAX_CSS_LENGTH} Zeichen lang sein`,
    );
  }

  for (const { pattern, label } of FORBIDDEN) {
    if (pattern.test(trimmed)) {
      throw new BadRequestException(`Profil-CSS: „${label}“ ist nicht erlaubt`);
    }
  }
  return trimmed;
}
