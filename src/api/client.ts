// KiGo backend HTTP client.
// Base URL is configurable via VITE_API_BASE; defaults to the public API.
// HTTP redirects to HTTPS, so we point straight at https.
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ||
  'https://api.kigo.uz'

const TOKEN_KEY = 'kigo-token'
const SCHEME_KEY = 'kigo-token-scheme'

// The OpenAPI schema documents no auth scheme, so the login response's token
// prefix is unknown. We default to Bearer and auto-fall back to Token (DRF
// TokenAuthentication) on the first 401, persisting whichever works.
type Scheme = 'Bearer' | 'Token'
const SCHEMES: Scheme[] = ['Bearer', 'Token']

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SCHEME_KEY) }
}
const getScheme = (): Scheme =>
  (localStorage.getItem(SCHEME_KEY) as Scheme) || 'Bearer'
const setScheme = (s: Scheme) => localStorage.setItem(SCHEME_KEY, s)

// The backend returns errors as an envelope:
// [{ key, code, show, icon_type, type, messages: [...] }]
interface ApiErrorItem {
  key: string | null
  code: number
  type: string
  messages: string[]
}

export class ApiError extends Error {
  status: number
  code?: number
  items: ApiErrorItem[]
  constructor(status: number, items: ApiErrorItem[], fallback: string) {
    const msg = items[0]?.messages?.[0] ?? fallback
    super(msg)
    this.name = 'ApiError'
    this.status = status
    this.code = items[0]?.code
    this.items = items
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

function buildUrl(path: string, query?: Query) {
  const url = new URL(path.startsWith('http') ? path : API_BASE + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  query?: Query
  body?: unknown
  auth?: boolean // attach the stored token; defaults to true when a token exists
}

async function send(url: string, method: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return { res, data: null }
  const text = await res.text()
  return { res, data: text ? JSON.parse(text) : null }
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = true } = opts
  const url = buildUrl(path, query)
  const base: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) base['Content-Type'] = 'application/json'

  const token = getToken()
  const authed = auth && !!token

  // Try the remembered scheme; on 401 with a token, try the other one once and
  // remember it. Reference/unauth calls run straight through.
  const order: (Scheme | null)[] = authed ? [getScheme(), SCHEMES.find((s) => s !== getScheme())!] : [null]

  let last!: { res: Response; data: unknown }
  for (const scheme of order) {
    const headers = { ...base }
    if (scheme && token) headers.Authorization = `${scheme} ${token}`
    last = await send(url, method, headers, body)
    if (last.res.ok) {
      if (scheme) setScheme(scheme)
      return last.data as T
    }
    if (last.res.status !== 401) break
  }

  const items = Array.isArray(last.data) ? (last.data as ApiErrorItem[]) : []
  throw new ApiError(last.res.status, items, last.res.statusText)
}

// Django REST Framework pagination envelope.
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Total row count for a list endpoint, without pulling the rows: asks for a
// single-item page and reads the paginated `count`.
export async function fetchCount(path: string, query?: Query): Promise<number> {
  const data = await request<unknown>(buildUrl(path, { page_size: 1, ...query }))
  if (Array.isArray(data)) return data.length
  const count = (data as Paginated<unknown> | null)?.count
  return typeof count === 'number' ? count : 0
}

// Fetches a list endpoint tolerant of both shapes DRF may return: a plain array
// or a paginated envelope. Follows `next` links (forcing https, since the API's
// own next URLs come back as http and the redirect trips CORS preflight).
export async function fetchAll<T>(path: string, query?: Query): Promise<T[]> {
  const out: T[] = []
  // The API caps page_size at 100; asking for it up front cuts round-trips
  // (e.g. 208 districts: 3 requests instead of 21 at the default size of 10).
  let url: string | null = buildUrl(path, { page_size: 100, ...query })
  while (url) {
    const data: T[] | Paginated<T> = await request<T[] | Paginated<T>>(url)
    if (Array.isArray(data)) { out.push(...data); break }
    out.push(...(data.results ?? []))
    url = data.next ? data.next.replace(/^http:\/\//, 'https://') : null
  }
  return out
}
