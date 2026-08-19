const API_ORIGIN = (
  (import.meta.env.VITE_API_URL as string | undefined) || '/api'
).replace(/\/api\/?$/, '');

/**
 * Backend-generated images (pets, emblems, quest scenes) are persisted as
 * absolute URLs frozen at generation time via APP_URL — so a document written
 * on one host can point at another, e.g. http://localhost:3000/uploads/… in
 * production. Rebase anything under /uploads/ onto the current API origin;
 * in the production build that origin is '' (same origin), where nginx
 * proxies /uploads/ to the backend.
 */
export function rebaseUploadUrl(value: string): string {
  if (value.startsWith('/uploads/')) return API_ORIGIN + value;
  const m = /^https?:\/\/[^/]+(\/uploads\/.+)$/.exec(value);
  return m ? API_ORIGIN + m[1] : value;
}

/** JSON.parse reviver applying rebaseUploadUrl to every string field. */
export function uploadsReviver(_key: string, value: unknown): unknown {
  return typeof value === 'string' ? rebaseUploadUrl(value) : value;
}
