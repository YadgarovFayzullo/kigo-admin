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

// A stale JWT makes the API hang instead of answering 401, which would leave
// callers (e.g. the shared reference dictionaries) pending forever and their
// dropdowns silently empty. Fail loudly instead.
const TIMEOUT_MS = 20_000

async function send(url: string, method: string, headers: Record<string, string>, body: unknown) {
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === 'TimeoutError'
    throw new ApiError(0, [], timedOut ? 'Server javob bermadi (timeout)' : 'Tarmoqqa ulanmadi')
  }
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

// List responses come back in three different shapes, none of which the OpenAPI
// schema describes (it declares `type: array` everywhere):
//   - public reference endpoints: DRF `{count,next,previous,results}`
//   - admin endpoints: `{items:[…]}` (no `next` link)
//   - occasionally a plain array
// The helpers below read the rows and the total out of whichever shape arrived.
const ROW_KEYS = ['results', 'items', 'data', 'rows'] as const
const TOTAL_KEYS = ['count', 'total', 'total_count', 'totalCount'] as const

// The API caps page_size at 100 (`limit` is ignored); asking for it up front
// cuts round-trips (e.g. 208 districts: 3 requests instead of 21 at the
// default size of 10).
const PAGE_SIZE = 100

function envelope(data: unknown): Record<string, unknown> | null {
  return data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null
}

// The rows of a list response, or null when the shape isn't recognized.
function rowsOf<T>(data: unknown): T[] | null {
  if (Array.isArray(data)) return data as T[]
  const obj = envelope(data)
  if (!obj) return null
  for (const k of ROW_KEYS) if (Array.isArray(obj[k])) return obj[k] as T[]
  return null
}

// The declared total of a list response, or null when the envelope omits it.
function totalOf(data: unknown): number | null {
  const obj = envelope(data)
  if (!obj) return null
  for (const k of TOTAL_KEYS) if (typeof obj[k] === 'number') return obj[k] as number
  return null
}

// Total row count for a list endpoint, without pulling the rows when possible:
// asks for a single-item page and reads the declared total.
export async function fetchCount(path: string, query?: Query): Promise<number> {
  const data = await request<unknown>(buildUrl(path, { page_size: 1, ...query }))
  if (Array.isArray(data)) return data.length // unpaginated: the array is everything
  const total = totalOf(data)
  if (total !== null) return total
  // Envelope without a total (the admin `{items:[…]}` shape) — count the rows.
  return (await fetchAll(path, query)).length
}

// Fetches a list endpoint whole, tolerant of every shape above. Follows `next`
// links when present (forcing https, since the API's own next URLs come back as
// http and the redirect trips CORS preflight); otherwise walks `page` numbers
// while pages keep coming back full.
export async function fetchAll<T>(path: string, query?: Query): Promise<T[]> {
  const out: T[] = []
  let page = 1
  // Guard against an endpoint that ignores `page` and keeps replaying page 1,
  // which would otherwise loop forever: stop as soon as a page repeats.
  const seen = new Set<string>()
  let url: string | null = buildUrl(path, { page_size: PAGE_SIZE, ...query })
  while (url) {
    const data = await request<unknown>(url)
    const rows = rowsOf<T>(data)
    if (!rows) break
    const mark = `${rows.length}:${JSON.stringify(rows[0] ?? null)}`
    if (seen.has(mark)) break
    seen.add(mark)
    out.push(...rows)
    if (Array.isArray(data)) break

    const next = envelope(data)?.next
    if (typeof next === 'string' && next) {
      url = next.replace(/^http:\/\//, 'https://')
      continue
    }
    const total = totalOf(data)
    const done = rows.length < PAGE_SIZE || (total !== null && out.length >= total)
    url = done ? null : buildUrl(path, { page_size: PAGE_SIZE, ...query, page: ++page })
  }
  return out
}
