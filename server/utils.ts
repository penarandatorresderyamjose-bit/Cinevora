export type JsonMap = Record<string, unknown>;
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function textParam(value: unknown, max = 120): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
export function pageParam(value: unknown, max = 150): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.max(1, Math.min(parsed, max)) : 1;
}
export function numericId(value: string): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new ApiError(400, 'INVALID_ID', 'Identificador inválido.');
  return n;
}
export function yearParam(value: unknown): string {
  const s = textParam(value, 40);
  return /^\d{4}$/.test(s) && Number(s) >= 1880 && Number(s) <= new Date().getFullYear() + 5 ? s : '';
}
export function moviePage(data: any) {
  return {
    page: Number(data?.page || 1),
    total_pages: Math.min(Number(data?.total_pages || 1), 500),
    total_results: Number(data?.total_results || 0),
    results: (Array.isArray(data?.results) ? data.results : []).filter((m: any) => m && m.id && !m.adult),
  };
}
const cache = new Map<string, { until: number; value: unknown }>();
export async function cached<T>(key: string, ttlMs: number, run: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.until > Date.now()) return entry.value as T;
  const value = await run();
  if (cache.size > 300) cache.delete(cache.keys().next().value!);
  cache.set(key, { until: Date.now() + ttlMs, value });
  return value;
}
export async function getJson<T = any>(url: URL, headers: Record<string, string> = {}, ms = 11000): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(ms) }); }
  catch { throw new ApiError(502, 'UPSTREAM_UNAVAILABLE', 'La fuente de películas no respondió. Inténtalo de nuevo.'); }
  if (!response.ok) {
    if (response.status === 429) throw new ApiError(429, 'SOURCE_LIMIT', 'La fuente alcanzó su límite de consultas. Inténtalo luego.');
    throw new ApiError(502, 'UPSTREAM_ERROR', `La fuente de datos respondió con error (${response.status}).`);
  }
  try { return await response.json() as T; }
  catch { throw new ApiError(502, 'INVALID_SOURCE_DATA', 'La fuente devolvió datos inesperados.'); }
}
export function compactText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, '').slice(0, 1200);
  if (Array.isArray(value)) return compactText(value[0], fallback);
  return fallback;
}
