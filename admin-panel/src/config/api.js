export const API_BASE_URL =
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://car-wash-vbry.onrender.com/api' : 'http://localhost:8000/api')

export const UPLOADS_BASE = API_BASE_URL.replace(/\/api\/?$/, '')

/** R2 and other CDNs store full https URLs; legacy media uses `/uploads/...` relative to the API host. */
export function resolveUploadOrAbsoluteUrl(path) {
  if (path == null || path === '') return ''
  let s = String(path).trim()
  if (!s) return ''

  for (let i = 0; i < 4; i++) {
    const m = s.match(/^(https?:\/\/[^/]+)(?=https:\/\/)/i)
    if (!m) break
    s = s.slice(m[1].length)
  }

  if (/^https\/\//i.test(s)) s = `https://${s.slice('https//'.length)}`
  if (/^http\/\//i.test(s)) s = `http://${s.slice('http//'.length)}`

  if (/^https?:\/\//i.test(s)) return s

  const base = UPLOADS_BASE.replace(/\/$/, '')
  const p = s.startsWith('/') ? s : `/${s}`
  return `${base}${p}`
}
