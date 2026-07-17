// DTOs mirrored from the KiGo OpenAPI schema (https://api.kigo.uz/api/schema/).
// Reference dictionaries are public; the Admin* shapes require an auth token.

/** Multilingual reference row shared by most dictionaries. */
export interface LocalizedRef {
  id: number
  code: string
  name_ru: string | null
  name_uz: string | null
  name_en: string | null
}

export type ApiSport = LocalizedRef
/** GET /api/admin/sports/ — adds player count + active flag (auth required). */
export interface AdminSport extends LocalizedRef {
  players: number
  is_active: boolean
}
export type ApiRegion = LocalizedRef
export interface ApiDistrict extends LocalizedRef {
  region_id: number | null
}
export type ApiStatus = LocalizedRef // game statuses
export type ApiTrustTier = LocalizedRef
export type ApiReportCategory = LocalizedRef
export type ApiReportStatus = LocalizedRef
export type ApiClubStatus = LocalizedRef
export interface ApiProficiency extends LocalizedRef {
  initial_rating: string // decimal
}

export interface ApiUserPublic {
  id: number
  username: string | null
  name?: string
  surname?: string
  avatar: string | null
}

export interface ApiSportPreference {
  id: number
  sport: ApiSport
  proficiency: ApiProficiency
  rating: string // decimal
}

// ---- Admin (token required) ----

export interface AdminPlayer {
  id: number
  username: string | null
  name?: string
  surname?: string
  phone: string
  gender: 'male' | 'female' | null
  age: number | null
  region: ApiRegion
  district: ApiDistrict
  avatar: string | null
  sport_preferences: ApiSportPreference[]
  games_played?: number
  no_shows?: number
  trust_tier: ApiTrustTier
  locked_until: string | null
  status: string
  created_at: string
}

export interface AdminMatch {
  id: number
  organizer: ApiUserPublic
  sport: ApiSport
  status: LocalizedRef
  region: ApiRegion
  district: ApiDistrict
  date: string
  time: string
  address: string
  players_total: number
  players_needed: number
  players: { id: number; user: ApiUserPublic; is_organizer?: boolean; attended: boolean | null; side: string | null }[]
  score_a: number | null
  score_b: number | null
  created_at: string
}

export interface ApiClub {
  id: number
  name: string
  sport: ApiSport
  region: ApiRegion
  district: ApiDistrict
  address: string
  latitude: string | null
  longitude: string | null
  courts?: number
  bookings?: number
  admin_name?: string
  admin_phone?: string
  admin_email?: string
  status: ApiClubStatus
  created_at: string
}

export interface ApiReport {
  id: number
  target: ApiUserPublic
  reporter: ApiUserPublic
  category: ApiReportCategory
  region: ApiRegion
  note: string
  status: ApiReportStatus
  created_at: string
}

/** GET /api/admin/regions/ — includes aggregate counts (auth required). */
export interface AdminRegion {
  id: number
  code: string
  name: string
  users: number
  clubs: number
}

export interface Admin {
  id: number
  name?: string
  surname?: string
  email: string | null
}

// ---- Shared enums ----
export type Gender = 'male' | 'female'
export type ApplicationAction = 'accept' | 'reject'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type Side = 'a' | 'b'
export type Theme = 'white' | 'black' | 'system'
export type Language = 'ru' | 'uz' | 'en'
export type Platform = 'ios' | 'android'

// ---- Admin write bodies ----
/** POST /api/admin/players/ body. PATCH uses Partial<AdminPlayerWrite>. */
export interface AdminPlayerWrite {
  username?: string
  name?: string
  surname?: string
  phone: string
  gender?: Gender | '' | null
  age?: number
  region_id?: number
  district_id?: number
}

/** POST /api/admin/clubs/ body. PATCH uses Partial<ClubWrite>. */
export interface ClubWrite {
  name: string
  sport_id: number
  region_id?: number
  district_id?: number
  address: string
  latitude?: string
  longitude?: string
  courts?: number
  bookings?: number
  admin_name?: string
  admin_phone?: string
  admin_email?: string
  status_id?: number
}

/** POST /api/admin/sports/ body. */
export interface AdminSportWrite {
  code: string
  name_ru?: string
  name_uz?: string
  name_en?: string
  is_active?: boolean
}

// ---- Games (app-facing) ----
export interface Game {
  id: number
  organizer: ApiUserPublic
  sport: ApiSport
  status: ApiStatus
  region: ApiRegion
  district: ApiDistrict
  date: string
  time: string
  address: string
  latitude: string | null
  longitude: string | null
  players_total: number
  players_needed: number
  players_count: number
  requirements: string | null
  score_a: number | null
  score_b: number | null
  created_at: string
}

export interface GamePlayer {
  id: number
  user: ApiUserPublic
  is_organizer?: boolean
  attended: boolean | null
  side: Side | '' | null
}

export interface GameDetail extends Game {
  players: GamePlayer[]
}

/** POST /api/games/ body. PATCH uses Partial<GameCreate>. */
export interface GameCreate {
  sport_id: number
  region_id?: number
  district_id?: number
  date: string
  time: string
  address: string
  latitude?: string
  longitude?: string
  players_total: number
  requirements?: string
}

export interface Application {
  id: number
  applicant: ApiUserPublic
  status: ApplicationStatus
  created_at: string
}

export interface ScoreBody {
  score_a: number
  score_b: number
}

export interface AttendanceBody {
  user_id: number
  attended: boolean
}

export interface TeamAssign {
  a: number[]
  b: number[]
}

// ---- Users / profile ----
export interface User {
  id: number
  phone: string
  username?: string
  name?: string
  surname?: string
  gender?: Gender | '' | null
  age?: number
  region: ApiRegion
  district: ApiDistrict
  telegram_username?: string
  language?: Language
  theme?: Theme
  avatar?: string | null
  games_played: number
  no_shows: number
  attendance_streak: number
  trust_tier: ApiTrustTier
  locked_until: string | null
  sport_preferences: ApiSportPreference[]
  created_games: number
}

/** PATCH /api/users/me/ body. */
export interface UserUpdate {
  username?: string
  name?: string
  surname?: string
  gender?: Gender | '' | null
  age?: number
  region_id?: number
  district_id?: number
  language?: Language
  theme?: Theme
  avatar?: string
}

export interface Settings {
  push_enabled: boolean
  telegram_enabled: boolean
}

export interface SportPreferenceItem {
  sport_code: string
  proficiency_code: string
}

export interface FriendRequest {
  id: number
  requester: ApiUserPublic
  created_at: string
}

// ---- Auth (phone/OTP + Telegram) ----
export interface VerifyOtpResponse {
  access: string
  is_new: boolean
  is_registered: boolean
  user: User
}

// ---- Notifications ----
export interface Device {
  id: number
  token: string
  platform: Platform
  created_at: string
}

// ---- Reports (app-facing) ----
/** POST /api/reports/ body. */
export interface ReportCreate {
  target_id: number
  category: string
  note?: string
}

// ---- Rating history ----
export interface RatingHistoryPoint {
  game_id: number
  rating: string
  created_at: string
}
export interface RatingHistorySeries {
  sport: ApiSport
  points: RatingHistoryPoint[]
}
