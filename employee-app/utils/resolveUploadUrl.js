import { API_BASE_URL } from '../config/api';

const UPLOADS_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

/** Full https URL from R2, or relative `/uploads/...` path from local disk. */
export function resolveUploadUrl(path) {
  if (path == null || path === '') return '';
  const s = String(path).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = UPLOADS_BASE.replace(/\/$/, '');
  const p = s.startsWith('/') ? s : `/${s}`;
  return `${base}${p}`;
}
