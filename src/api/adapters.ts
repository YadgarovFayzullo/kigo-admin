// Maps backend DTOs onto the view types the pages already render, and fills the
// gaps the backend doesn't cover (sport emoji + team/solo kind live only here).
import type { Sport, SportId } from '../data'
import type {
  ApiSport, ApiRegion, LocalizedRef, AdminRegion, AdminPlayer, AdminMatch,
  ApiClub, ApiReport, ApiUserPublic,
} from './types'

export type Lang = 'uz' | 'ru' | 'en'

/** Pick a localized name from a reference row, falling back across languages. */
export function localized(ref: LocalizedRef, lang: Lang = 'uz'): string {
  const order: Lang[] = [lang, 'uz', 'ru', 'en']
  for (const l of order) {
    const v = ref[`name_${l}` as const]
    if (v) return v
  }
  return ref.code
}

// Frontend-only metadata: the backend Sport has no team/solo flag. (Emoji were
// removed from the UI, so only `kind` remains here.)
const sportKind: Record<string, Sport['kind']> = {
  football: 'team', futbol: 'team', basketball: 'team', volleyball: 'team',
  tennis: 'solo', badminton: 'solo', pingpong: 'solo', 'ping-pong': 'solo',
  table_tennis: 'solo', squash: 'solo', padel: 'solo', gameclub: 'solo',
}

/** Accepts the public Sport or the richer AdminSport (players/is_active). */
export function adaptSport(
  api: ApiSport & { players?: number; is_active?: boolean },
  lang: Lang = 'uz',
): Sport {
  return {
    id: api.code as SportId,
    name: localized(api, lang),
    emoji: '',
    kind: sportKind[api.code] ?? 'solo',
    players: api.players ?? 0,
    active: api.is_active ?? true,
  }
}

export interface RegionRow {
  id: number
  name: string
  users: number
  clubs: number
}

/** Public region (no counts) or AdminRegion (with users/clubs).
 *  AdminRegion.name is Russian-only, so pass `localizedById` (from the public
 *  /regions/ reference) to render the Uzbek name instead. */
export function adaptRegion(
  api: ApiRegion | AdminRegion,
  lang: Lang = 'uz',
  localizedById?: Map<number, string>,
): RegionRow {
  if ('users' in api) {
    return { id: api.id, name: localizedById?.get(api.id) ?? api.name, users: api.users, clubs: api.clubs }
  }
  return { id: api.id, name: localized(api, lang), users: 0, clubs: 0 }
}

// ---- Shared helpers -------------------------------------------------------

// Deterministic gradient palettes → each row's round avatar (backend avatars are
// URLs; the panel renders initials on a gradient chosen by id).
const avatarPairs: [string, string][] = [
  ['#c6ff3d', '#34d17a'], ['#4c9dff', '#8f6bff'], ['#ff8a4c', '#ff5c6a'],
  ['#34d17a', '#4c9dff'], ['#ffb84c', '#ff5c6a'], ['#8f6bff', '#4c9dff'],
  ['#ff5c9d', '#8f6bff'], ['#3dd1c6', '#4c9dff'], ['#c6ff3d', '#4c9dff'],
]
export const avatarFor = (seed: number): [string, string] =>
  avatarPairs[Math.abs(seed) % avatarPairs.length]

/** Display name for a public user: "Name Surname" › username › "#id". */
export function userName(u: ApiUserPublic): string {
  const full = [u.name, u.surname].filter(Boolean).join(' ').trim()
  return full || u.username || `#${u.id}`
}

/** Sport code → { name, kind }, tolerant of a missing sport. */
export function sportDisplay(api: ApiSport | undefined | null, lang: Lang = 'uz') {
  if (!api) return { code: '', name: '—', kind: 'solo' as const }
  return { code: api.code, name: localized(api, lang), kind: sportKind[api.code] ?? 'solo' }
}

// ---- Players --------------------------------------------------------------

export type PlayerStatus = 'active' | 'blocked' | 'pending'

function playerStatus(api: AdminPlayer): PlayerStatus {
  if (api.locked_until) return 'blocked'
  const v = (api.status || '').toLowerCase()
  if (v.includes('block') || v.includes('lock')) return 'blocked'
  if (v.includes('pend')) return 'pending'
  return 'active'
}

export interface PlayerRow {
  id: number
  name: string
  username: string | null
  phone: string
  gender: 'male' | 'female'
  age: number
  region: string
  district: string
  avatar: [string, string]
  sport: string // sport code (empty when no preferences)
  sportName: string
  level: number // proficiency skill level (0–9)
  matches: number // games played
  noShows: number
  rating: number // ELO-style rating of the primary sport
  trust: string
  status: PlayerStatus
  joined: string // ISO date
}

export function adaptPlayer(api: AdminPlayer, lang: Lang = 'uz'): PlayerRow {
  const pref = api.sport_preferences?.[0]
  const sp = sportDisplay(pref?.sport, lang)
  const full = [api.name, api.surname].filter(Boolean).join(' ').trim()
  return {
    id: api.id,
    name: full || api.username || `#${api.id}`,
    username: api.username ?? null,
    phone: api.phone,
    gender: api.gender === 'female' ? 'female' : 'male',
    age: api.age ?? 0,
    region: api.region ? localized(api.region, lang) : '—',
    district: api.district ? localized(api.district, lang) : '',
    avatar: avatarFor(api.id),
    sport: sp.code,
    sportName: sp.name,
    level: pref ? Number(pref.proficiency.initial_rating) || 0 : 0,
    matches: api.games_played ?? 0,
    noShows: api.no_shows ?? 0,
    rating: pref ? Number(pref.rating) || 0 : 0,
    trust: api.trust_tier ? localized(api.trust_tier, lang) : '',
    status: playerStatus(api),
    joined: (api.created_at || '').slice(0, 10),
  }
}

// ---- Matches --------------------------------------------------------------

export type MatchStatusKey = 'confirmed' | 'searching' | 'played' | 'cancelled'

// Backend game-status codes: open / completed / cancelled / expired.
function matchStatusKey(code: string): MatchStatusKey {
  switch (code) {
    case 'completed': return 'played'
    case 'cancelled':
    case 'expired': return 'cancelled'
    case 'confirmed': return 'confirmed'
    default: return 'searching' // open + anything unknown
  }
}

export interface MatchRow {
  id: number
  type: 'team' | 'solo'
  sport: string
  sportName: string
  organizer: string
  a: string
  b: string
  players: { id: number; name: string; attended: boolean | null; side: string | null; isOrganizer: boolean }[]
  region: string
  district: string
  time: string
  date: string
  statusKey: MatchStatusKey
  statusLabel: string
  playersTotal: number
  playersNeeded: number
  scoreA: number | null
  scoreB: number | null
}

export function adaptMatch(api: AdminMatch, lang: Lang = 'uz'): MatchRow {
  const sp = sportDisplay(api.sport, lang)
  const organizer = userName(api.organizer)
  const players = (api.players || []).map((p) => ({
    id: p.user.id,
    name: userName(p.user),
    attended: p.attended,
    side: p.side ?? null,
    isOrganizer: !!p.is_organizer,
  }))
  const others = players.filter((p) => p.name !== organizer)
  return {
    id: api.id,
    type: sp.kind === 'team' ? 'team' : 'solo',
    sport: sp.code,
    sportName: sp.name,
    organizer,
    a: organizer,
    b: others[0]?.name ?? `${players.length}/${api.players_total} ishtirokchi`,
    players,
    region: api.region ? localized(api.region, lang) : '—',
    district: api.district ? localized(api.district, lang) : '',
    time: (api.time || '').slice(0, 5),
    date: api.date,
    statusKey: matchStatusKey(api.status?.code ?? ''),
    statusLabel: api.status ? localized(api.status, lang) : '—',
    playersTotal: api.players_total,
    playersNeeded: api.players_needed,
    scoreA: api.score_a,
    scoreB: api.score_b,
  }
}

// ---- Clubs ----------------------------------------------------------------

export interface ClubRow {
  id: number
  name: string
  sport: string
  sportName: string
  region: string
  district: string
  address: string
  lat: string | null
  lng: string | null
  courts: number
  bookings: number
  admin: { name: string; phone: string; email: string }
  status: string // status code: active / pending / paused
  statusLabel: string
  since: string
}

export function adaptClub(api: ApiClub, lang: Lang = 'uz'): ClubRow {
  const sp = sportDisplay(api.sport, lang)
  return {
    id: api.id,
    name: api.name,
    sport: sp.code,
    sportName: sp.name,
    region: api.region ? localized(api.region, lang) : '—',
    district: api.district ? localized(api.district, lang) : '',
    address: api.address,
    lat: api.latitude,
    lng: api.longitude,
    courts: api.courts ?? 0,
    bookings: api.bookings ?? 0,
    admin: {
      name: api.admin_name ?? '',
      phone: api.admin_phone ?? '',
      email: api.admin_email ?? '',
    },
    status: api.status?.code ?? 'pending',
    statusLabel: api.status ? localized(api.status, lang) : '—',
    since: (api.created_at || '').slice(0, 10),
  }
}

// ---- Reports --------------------------------------------------------------

export interface ReportRow {
  id: number
  targetId: number
  target: string
  reporterId: number
  reporter: string
  category: string // category code
  categoryLabel: string
  region: string
  note: string
  date: string
  status: string // status code: open / reviewing / resolved / dismissed
  statusLabel: string
}

export function adaptReport(api: ApiReport, lang: Lang = 'uz'): ReportRow {
  return {
    id: api.id,
    targetId: api.target.id,
    target: userName(api.target),
    reporterId: api.reporter.id,
    reporter: userName(api.reporter),
    category: api.category?.code ?? '',
    categoryLabel: api.category ? localized(api.category, lang) : '—',
    region: api.region ? localized(api.region, lang) : '—',
    note: api.note ?? '',
    date: (api.created_at || '').slice(0, 10),
    status: api.status?.code ?? 'open',
    statusLabel: api.status ? localized(api.status, lang) : '—',
  }
}
