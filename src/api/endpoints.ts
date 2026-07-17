// Typed endpoint wrappers. Reference lists are public and paginated;
// admin resources require a token (see client.setToken).
import { request, fetchAll, setToken } from './client'
import type {
  ApiSport, ApiRegion, ApiDistrict, ApiStatus, ApiTrustTier,
  ApiProficiency, ApiReportCategory, ApiReportStatus, ApiClubStatus,
  Admin, AdminPlayer, AdminMatch, ApiClub, ApiReport, AdminRegion, AdminSport,
  AdminPlayerWrite, ClubWrite, AdminSportWrite, ApiUserPublic,
  Game, GameDetail, GameCreate, Application, ApplicationAction, ScoreBody,
  AttendanceBody, TeamAssign, User, UserUpdate, Settings, SportPreferenceItem,
  ApiSportPreference, FriendRequest, VerifyOtpResponse, Device, Platform,
  ReportCreate, RatingHistorySeries,
} from './types'

// ---- Public reference dictionaries ----
export const getSports = () => fetchAll<ApiSport>('/api/sports/')
export const getRegions = () => fetchAll<ApiRegion>('/api/regions/')
export const getDistricts = () => fetchAll<ApiDistrict>('/api/districts/')
export const getGameStatuses = () => fetchAll<ApiStatus>('/api/statuses/')
export const getTrustTiers = () => fetchAll<ApiTrustTier>('/api/trust-tiers/')
export const getProficiencies = () => fetchAll<ApiProficiency>('/api/proficiencies/')
export const getReportCategories = () => fetchAll<ApiReportCategory>('/api/report-categories/')
export const getReportStatuses = () => fetchAll<ApiReportStatus>('/api/report-statuses/')
export const getClubStatuses = () => fetchAll<ApiClubStatus>('/api/club-statuses/')

// Single reference rows by id.
export const getSport = (id: number) => request<ApiSport>(`/api/sports/${id}/`)
export const getRegion = (id: number) => request<ApiRegion>(`/api/regions/${id}/`)
export const getDistrict = (id: number) => request<ApiDistrict>(`/api/districts/${id}/`)
export const getGameStatus = (id: number) => request<ApiStatus>(`/api/statuses/${id}/`)
export const getTrustTier = (id: number) => request<ApiTrustTier>(`/api/trust-tiers/${id}/`)
export const getProficiency = (id: number) => request<ApiProficiency>(`/api/proficiencies/${id}/`)
export const getReportCategory = (id: number) => request<ApiReportCategory>(`/api/report-categories/${id}/`)
export const getReportStatus = (id: number) => request<ApiReportStatus>(`/api/report-statuses/${id}/`)
export const getClubStatus = (id: number) => request<ApiClubStatus>(`/api/club-statuses/${id}/`)

// ---- Admin auth ----
export async function adminLogin(email: string, password: string) {
  // The login response body is not described in the schema; capture whatever
  // token-like field comes back so this keeps working once creds are known.
  const data = await request<Record<string, unknown>>('/api/admin/auth/login/', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  // Token may be nested (e.g. { data: { token } }); probe common shapes.
  const nested = (data.data ?? data.result ?? data) as Record<string, unknown>
  const token = (data.token ?? data.access ?? data.key ?? data.access_token ??
    nested.token ?? nested.access ?? nested.key ?? nested.access_token) as string | undefined
  if (!token) {
    throw new Error(
      `Login: token topilmadi. Javob kalitlari: ${Object.keys(data).join(', ') || '(boʻsh)'}`,
    )
  }
  setToken(token)
  return data
}
export const adminMe = () => request<Admin>('/api/admin/auth/me/')
export async function adminLogout() {
  try { await request('/api/admin/auth/logout/', { method: 'POST' }) } finally { setToken(null) }
}

// ---- Admin players (token required) ----
export interface PlayerFilters {
  q?: string; gender?: string; region?: string; sport?: string; status?: string
}
export const getAdminPlayers = (f: PlayerFilters = {}) =>
  fetchAll<AdminPlayer>('/api/admin/players/', { ...f })
export const getAdminPlayer = (id: number) =>
  request<AdminPlayer>(`/api/admin/players/${id}/`)
export const createAdminPlayer = (body: AdminPlayerWrite) =>
  request<AdminPlayer>('/api/admin/players/', { method: 'POST', body })
export const updateAdminPlayer = (id: number, body: Partial<AdminPlayerWrite>) =>
  request<AdminPlayer>(`/api/admin/players/${id}/`, { method: 'PATCH', body })
export const blockAdminPlayer = (id: number) =>
  request<AdminPlayer>(`/api/admin/players/${id}/block/`, { method: 'POST' })
export const unblockAdminPlayer = (id: number) =>
  request<AdminPlayer>(`/api/admin/players/${id}/unblock/`, { method: 'POST' })

// ---- Admin matches ----
export interface MatchFilters { q?: string; region?: string; status?: string }
export const getAdminMatches = (f: MatchFilters = {}) =>
  fetchAll<AdminMatch>('/api/admin/matches/', { ...f })
export const getAdminMatch = (id: number) =>
  request<AdminMatch>(`/api/admin/matches/${id}/`)
export const updateAdminMatchStatus = (id: number, status: string) =>
  request<AdminMatch>(`/api/admin/matches/${id}/`, { method: 'PATCH', body: { status } })

// ---- Admin clubs ----
export const getAdminClubs = (region?: string) =>
  fetchAll<ApiClub>('/api/admin/clubs/', { region })
export const getAdminClub = (id: number) => request<ApiClub>(`/api/admin/clubs/${id}/`)
export const getAdminClubPlayers = (id: number) =>
  fetchAll<ApiUserPublic>(`/api/admin/clubs/${id}/players/`)
export const createAdminClub = (body: ClubWrite) =>
  request<ApiClub>('/api/admin/clubs/', { method: 'POST', body })
export const updateAdminClub = (id: number, body: Partial<ClubWrite>) =>
  request<ApiClub>(`/api/admin/clubs/${id}/`, { method: 'PATCH', body })

// ---- Admin reports ----
export interface ReportFilters { q?: string; region?: string; status?: string }
export const getAdminReports = (f: ReportFilters = {}) =>
  request<ApiReport[]>('/api/admin/reports/', { query: { ...f } })
export const getAdminReport = (id: number) => request<ApiReport>(`/api/admin/reports/${id}/`)
export const updateAdminReportStatus = (id: number, status: string) =>
  request<ApiReport>(`/api/admin/reports/${id}/`, { method: 'PATCH', body: { status } })

// ---- Admin regions / sports ----
export const getAdminRegions = () => request<AdminRegion[]>('/api/admin/regions/')
export const getAdminSports = () => request<AdminSport[]>('/api/admin/sports/')
export const createAdminSport = (body: AdminSportWrite) =>
  request<AdminSport>('/api/admin/sports/', { method: 'POST', body })
export const setAdminSportActive = (id: number, active: boolean) =>
  request<AdminSport>(`/api/admin/sports/${id}/`, { method: 'PATCH', body: { active } })

// Stats endpoints are untyped `object` in the schema — shape known only at runtime.
export const getStatsOverview = () => request<Record<string, unknown>>('/api/admin/stats/overview/')
export const getStatsSummary = () => request<Record<string, unknown>>('/api/admin/stats/summary/')
export const getStatsByRegion = () => request<Record<string, unknown>>('/api/admin/stats/by-region/')
export const getStatsBySport = () => request<Record<string, unknown>>('/api/admin/stats/by-sport/')
export const getMatchesPerMonth = () => request<unknown>('/api/admin/stats/matches-per-month/')

// ---- Games (app-facing, token required) ----
export interface GameFilters {
  date?: string; district_id?: number; region_id?: number; sport_id?: number
}
export const getGames = (f: GameFilters = {}) =>
  request<Game[]>('/api/games/', { query: { ...f } })
export const getGame = (id: number) => request<GameDetail>(`/api/games/${id}/`)
export const createGame = (body: GameCreate) =>
  request<GameDetail>('/api/games/', { method: 'POST', body })
export const updateGame = (id: number, body: Partial<GameCreate>) =>
  request<GameDetail>(`/api/games/${id}/`, { method: 'PATCH', body })
export const deleteGame = (id: number) =>
  request<null>(`/api/games/${id}/`, { method: 'DELETE' })

export const getMyGames = () => request<Game[]>('/api/games/mine/')
export const getGameHistory = () => request<Game[]>('/api/games/history/')
export const searchGames = (f: GameFilters & { q?: string } = {}) =>
  request<Game[]>('/api/games/search/', { query: { ...f } })

// Applications for a game (organizer view).
export const getGameApplications = (id: number) =>
  request<Application[]>(`/api/games/${id}/applications/`)
export const decideApplication = (id: number, applicantId: number, action: ApplicationAction) =>
  request<Application>(`/api/games/${id}/applications/${applicantId}/`, { method: 'PATCH', body: { action } })

// Apply to / withdraw from a game.
export const applyToGame = (id: number) =>
  request<unknown>(`/api/games/${id}/apply/`, { method: 'POST' })
export const withdrawFromGame = (id: number) =>
  request<null>(`/api/games/${id}/apply/`, { method: 'DELETE' })

export const setGameAttendance = (id: number, body: AttendanceBody) =>
  request<unknown>(`/api/games/${id}/attendance/`, { method: 'POST', body })
export const setGameScore = (id: number, body: ScoreBody) =>
  request<unknown>(`/api/games/${id}/score/`, { method: 'POST', body })
export const assignTeams = (id: number, body: TeamAssign) =>
  request<unknown>(`/api/games/${id}/teams/`, { method: 'POST', body })

// ---- Current user / profile (token required) ----
export const getMe = () => request<User>('/api/users/me/')
export const getUser = (id: number) => request<User>(`/api/users/${id}/`)
export const updateMe = (body: UserUpdate) =>
  request<User>('/api/users/me/', { method: 'PATCH', body })
export const deleteMe = () => request<null>('/api/users/me/', { method: 'DELETE' })

export const getMySettings = () => request<Settings>('/api/users/me/settings/')
export const updateMySettings = (body: Settings) =>
  request<Settings>('/api/users/me/settings/', { method: 'PUT', body })

export const getMySportPreferences = () =>
  request<ApiSportPreference[]>('/api/users/me/sport-preferences/')
export const updateMySportPreferences = (preferences: SportPreferenceItem[]) =>
  request<ApiSportPreference[]>('/api/users/me/sport-preferences/', { method: 'PUT', body: { preferences } })

export const getMyRatingHistory = () =>
  request<RatingHistorySeries[]>('/api/users/me/rating-history/')

// ---- Friends ----
export const getFriends = () => request<ApiUserPublic[]>('/api/users/me/friends/')
export const addFriend = (target: { phone: string } | { user_id: number }) =>
  request<unknown>('/api/users/me/friends/', { method: 'POST', body: target })
export const removeFriend = (id: number) =>
  request<null>(`/api/users/me/friends/${id}/`, { method: 'DELETE' })
export const getFriendRequests = () =>
  request<FriendRequest[]>('/api/users/me/friends/requests/')
export const acceptFriendRequest = (id: number) =>
  request<unknown>(`/api/users/me/friends/requests/${id}/accept/`, { method: 'POST' })
export const rejectFriendRequest = (id: number) =>
  request<null>(`/api/users/me/friends/requests/${id}/`, { method: 'DELETE' })

// ---- Phone / OTP + Telegram auth ----
export const sendOtp = (phone: string) =>
  request<unknown>('/api/auth/send-otp/', { method: 'POST', auth: false, body: { phone } })
export const verifyOtp = (phone: string, code: string) =>
  request<VerifyOtpResponse>('/api/auth/verify-otp/', { method: 'POST', auth: false, body: { phone, code } })
export const authLogout = () => request<unknown>('/api/auth/logout/', { method: 'POST' })
export const connectTelegram = (telegram_id: number, telegram_username?: string) =>
  request<unknown>('/api/auth/telegram/', { method: 'POST', body: { telegram_id, telegram_username } })
export const disconnectTelegram = () =>
  request<null>('/api/auth/telegram/', { method: 'DELETE' })

// ---- Push notification devices ----
export const registerDevice = (token: string, platform: Platform) =>
  request<Device>('/api/notifications/devices/', { method: 'POST', body: { token, platform } })
export const unregisterDevice = (token: string) =>
  request<null>(`/api/notifications/devices/${token}/`, { method: 'DELETE' })

// ---- Reports (app-facing, file a report) ----
export const createReport = (body: ReportCreate) =>
  request<unknown>('/api/reports/', { method: 'POST', auth: true, body })
