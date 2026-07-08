// KiGo admin — mock data layer.
// Swap these arrays for real API calls (fetch/axios) when the backend is ready.

export type SportId =
  | 'football'
  | 'tennis'
  | 'basketball'
  | 'gameclub'
  | 'volleyball'
  | 'badminton'
  | 'pingpong'
  | 'squash'
  | 'padel'

export interface Sport {
  id: SportId
  name: string
  emoji: string
  kind: 'team' | 'solo'
  players: number
  active: boolean
}

export type Gender = 'male' | 'female'

export interface Player {
  id: string
  name: string
  phone: string
  gender: Gender
  age: number
  region: string // viloyat / область
  district: string
  avatar: [string, string] // gradient stops used to render the logo/avatar
  sport: SportId
  level: number // 1.0 – 10.0
  matches: number
  rating: number // 0 – 5
  status: 'active' | 'blocked' | 'pending'
  joined: string // ISO date
}

export interface Match {
  id: string
  type: 'solo' | 'team' // yakkama-yakka / jamoa
  sport: SportId
  a: string // player name
  b: string // player / team name
  region: string
  district: string
  time: string // HH:MM
  date: string // ISO date
  status: 'confirmed' | 'searching' | 'played' | 'cancelled'
}

export interface ClubAdmin {
  name: string
  phone: string
  email: string
}

export interface Club {
  id: string
  name: string
  sport: SportId
  region: string
  district: string
  address: string // koʻcha / manzil
  geo: [number, number] // [lat, lng]
  courts: number
  bookings: number
  admin: ClubAdmin
  status: 'active' | 'pending' | 'paused'
  since: string
}

export interface Report {
  id: string
  targetId: string // reported player id
  target: string // reported player name
  reporterId: string
  reporter: string
  category: 'no-show' | 'behavior' | 'fake' | 'cheating' | 'spam'
  region: string
  note: string
  date: string
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
}

export const sports: Sport[] = [
  { id: 'football', name: 'Futbol', emoji: '⚽️', kind: 'team', players: 1840, active: true },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', kind: 'solo', players: 962, active: true },
  { id: 'basketball', name: 'Basketbol', emoji: '🏀', kind: 'team', players: 733, active: true },
  { id: 'gameclub', name: 'Game club', emoji: '🎮', kind: 'solo', players: 611, active: true },
  { id: 'volleyball', name: 'Voleybol', emoji: '🏐', kind: 'team', players: 498, active: true },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', kind: 'solo', players: 355, active: true },
  { id: 'pingpong', name: 'Ping-pong', emoji: '🏓', kind: 'solo', players: 287, active: true },
  { id: 'squash', name: 'Squash', emoji: '🎯', kind: 'solo', players: 141, active: false },
  { id: 'padel', name: 'Padel', emoji: '🥎', kind: 'solo', players: 98, active: false },
]

export const sportName = (id: SportId) => sports.find((s) => s.id === id)?.name ?? id
export const sportEmoji = (id: SportId) => sports.find((s) => s.id === id)?.emoji ?? '•'

// Oʻzbekiston viloyatlari (regions of Uzbekistan)
export const regions = [
  'Toshkent shahri', 'Toshkent viloyati', 'Samarqand', 'Fargʻona',
  'Andijon', 'Namangan', 'Buxoro', 'Qashqadaryo', 'Surxondaryo',
  'Xorazm', 'Navoiy', 'Jizzax', 'Sirdaryo', 'Qoraqalpogʻiston',
]

const districts = [
  'Yunusobod', 'Chilonzor', 'Mirzo Ulugʻbek', 'Yakkasaroy',
  'Shayxontohur', 'Olmazor', 'Sergeli', 'Bektemir', 'Mirobod',
]

// Deterministic gradient palettes → used to render each player's round logo/avatar.
const avatarPairs: [string, string][] = [
  ['#c6ff3d', '#34d17a'], ['#4c9dff', '#8f6bff'], ['#ff8a4c', '#ff5c6a'],
  ['#34d17a', '#4c9dff'], ['#ffb84c', '#ff5c6a'], ['#8f6bff', '#4c9dff'],
  ['#ff5c9d', '#8f6bff'], ['#3dd1c6', '#4c9dff'], ['#c6ff3d', '#4c9dff'],
]

const femaleNames = [
  'Nilufar', 'Malika', 'Dilnoza', 'Sevara', 'Kamila', 'Gulnora',
  'Zarina', 'Madina', 'Feruza', 'Shaxnoza',
]

const firstNames = [
  'Sardor', 'Jasur', 'Aziz', 'Bekzod', 'Diyor', 'Otabek', 'Rustam',
  'Sarvar', 'Ulugʻbek', 'Farrux', 'Kamron', 'Sherzod', 'Nodir',
  'Islom', 'Behruz', 'Doston', 'Javohir', 'Temur', 'Anvar', 'Muhammad',
]
const lastInitials = ['U.', 'K.', 'R.', 'T.', 'S.', 'N.', 'A.', 'X.', 'M.', 'B.']

function rnd<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

export const players: Player[] = Array.from({ length: 48 }, (_, i) => {
  const sport = rnd(sports, i * 3).id
  const statusRoll = i % 11
  const status: Player['status'] =
    statusRoll === 0 ? 'blocked' : statusRoll === 1 ? 'pending' : 'active'
  const gender: Gender = i % 4 === 0 ? 'female' : 'male'
  const first = gender === 'female' ? rnd(femaleNames, i * 3) : rnd(firstNames, i * 7)
  return {
    id: `PL-${(1000 + i).toString()}`,
    name: `${first} ${rnd(lastInitials, i * 5)}`,
    phone: `+998 9${(i % 9)} ${(100 + i * 7) % 900 + 100} ${(10 + i) % 90 + 10} ${(20 + i * 3) % 90 + 10}`,
    gender,
    age: 16 + ((i * 5) % 40), // 16 – 55
    region: rnd(regions, i * 3 + 1),
    district: rnd(districts, i * 2),
    avatar: rnd(avatarPairs, i * 4 + 1),
    sport,
    level: Number((3 + ((i * 13) % 70) / 10).toFixed(1)),
    matches: (i * 17) % 120,
    rating: Number((3.6 + ((i * 7) % 14) / 10).toFixed(1)),
    status,
    joined: new Date(2025, 6 + (i % 12), 1 + (i % 27)).toISOString().slice(0, 10),
  }
})

export const matches: Match[] = Array.from({ length: 32 }, (_, i) => {
  const sport = rnd(sports, i * 2).id
  const isTeam = sports.find((s) => s.id === sport)?.kind === 'team'
  const statusRoll = i % 4
  const status: Match['status'] =
    statusRoll === 0 ? 'confirmed' : statusRoll === 1 ? 'searching'
    : statusRoll === 2 ? 'played' : 'cancelled'
  return {
    id: `MT-${(2000 + i).toString()}`,
    type: isTeam ? 'team' : 'solo',
    sport,
    a: `${rnd(firstNames, i * 3)} ${rnd(lastInitials, i)}`,
    b: isTeam ? `Jamoa #${(i % 12) + 1}` : `${rnd(firstNames, i * 5 + 1)} ${rnd(lastInitials, i + 2)}`,
    region: rnd(regions, i * 2),
    district: rnd(districts, i),
    time: `${(17 + (i % 6)).toString().padStart(2, '0')}:00`,
    date: new Date(2026, 6, 3 + (i % 20)).toISOString().slice(0, 10),
    status,
  }
})

export const clubs: Club[] = [
  { id: 'CL-01', name: 'Yunusobod Arena', sport: 'football', region: 'Toshkent shahri', district: 'Yunusobod', address: 'Amir Temur koʻch. 108', geo: [41.364, 69.289], courts: 4, bookings: 312, admin: { name: 'Otabek Karimov', phone: '+998 90 123 45 67', email: 'otabek@yunusobod-arena.uz' }, status: 'active', since: '2025-09-12' },
  { id: 'CL-02', name: 'Tennis Park', sport: 'tennis', region: 'Toshkent shahri', district: 'Mirzo Ulugʻbek', address: 'Buyuk Ipak Yoʻli 45', geo: [41.325, 69.334], courts: 6, bookings: 268, admin: { name: 'Dilnoza Rashidova', phone: '+998 91 234 56 78', email: 'dilnoza@tennispark.uz' }, status: 'active', since: '2025-10-03' },
  { id: 'CL-03', name: 'Cyber Zone', sport: 'gameclub', region: 'Toshkent shahri', district: 'Chilonzor', address: 'Bunyodkor shoh koʻch. 12', geo: [41.285, 69.204], courts: 20, bookings: 540, admin: { name: 'Sardor Yusupov', phone: '+998 93 345 67 89', email: 'sardor@cyberzone.uz' }, status: 'active', since: '2025-08-21' },
  { id: 'CL-04', name: 'Olmazor Court', sport: 'basketball', region: 'Toshkent shahri', district: 'Olmazor', address: 'Sebzor koʻch. 7', geo: [41.371, 69.240], courts: 2, bookings: 97, admin: { name: 'Jasur Toʻxtayev', phone: '+998 94 456 78 90', email: 'jasur@olmazorcourt.uz' }, status: 'paused', since: '2026-01-15' },
  { id: 'CL-05', name: 'Padel Club UZ', sport: 'padel', region: 'Samarqand', district: 'Markaz', address: 'Registon koʻch. 3', geo: [39.654, 66.975], courts: 3, bookings: 41, admin: { name: 'Kamila Ismoilova', phone: '+998 95 567 89 01', email: 'kamila@padelclub.uz' }, status: 'pending', since: '2026-06-28' },
  { id: 'CL-06', name: 'Sergeli Sport Hall', sport: 'volleyball', region: 'Toshkent shahri', district: 'Sergeli', address: 'Yangi Sergeli 21', geo: [41.226, 69.221], courts: 2, bookings: 134, admin: { name: 'Bekzod Aliyev', phone: '+998 97 678 90 12', email: 'bekzod@sergeli-hall.uz' }, status: 'active', since: '2025-11-30' },
  { id: 'CL-07', name: 'Smash Badminton', sport: 'badminton', region: 'Fargʻona', district: 'Markaz', address: 'Mustaqillik koʻch. 55', geo: [40.386, 71.787], courts: 5, bookings: 176, admin: { name: 'Feruza Ubaydullayeva', phone: '+998 99 789 01 23', email: 'feruza@smash.uz' }, status: 'active', since: '2025-12-19' },
]

export const reports: Report[] = Array.from({ length: 18 }, (_, i) => {
  const cats: Report['category'][] = ['no-show', 'behavior', 'fake', 'cheating', 'spam']
  const cat = cats[i % cats.length]
  const notes: Record<Report['category'], string> = {
    'no-show': 'Oʻyinga kelmadi, oldindan ogohlantirmadi',
    behavior: 'Maydonda haqoratli muomala qildi',
    fake: 'Soxta profil, rasmi boshqa odamniki',
    cheating: 'Darajasini past koʻrsatgan',
    spam: 'Chatda reklama tarqatmoqda',
  }
  const statusRoll = i % 4
  const status: Report['status'] =
    statusRoll === 0 ? 'open' : statusRoll === 1 ? 'reviewing'
    : statusRoll === 2 ? 'resolved' : 'dismissed'
  const target = players[(i * 5 + 3) % players.length]
  const reporter = players[(i * 7 + 1) % players.length]
  return {
    id: `RP-${(3000 + i).toString()}`,
    targetId: target.id,
    target: target.name,
    reporterId: reporter.id,
    reporter: reporter.name,
    category: cat,
    region: target.region,
    note: notes[cat],
    date: new Date(2026, 6, 1 + (i % 6)).toISOString().slice(0, 10),
    status,
  }
})

// ---- Dashboard KPI snapshot (mock aggregates) ----
// Swap `overview` for a real /stats endpoint later.
export interface Overview {
  registeredToday: number
  installs7d: number
  installs30d: number
  males: number
  females: number
  requestsSent: number
  requestsAccepted: number
  requestsRejected: number
  activeRequestsNow: number
  // "sherik" = partner/teammate, "raqib" = opponent
  menPartner: number
  menOpponent: number
  womenPartner: number
  womenOpponent: number
  mixedPartnerOpponent: number
}

export const overview: Overview = {
  registeredToday: 47,
  installs7d: 1240,
  installs30d: 4890,
  males: 3900,
  females: 1625,
  requestsSent: 8640,
  requestsAccepted: 5210,
  requestsRejected: 1830,
  activeRequestsNow: 412,
  menPartner: 1420,
  menOpponent: 1980,
  womenPartner: 640,
  womenOpponent: 510,
  mixedPartnerOpponent: 380,
}

// 12-month activity series for the dashboard chart.
export const matchesPerMonth = [
  { month: 'Iyul', value: 210 },
  { month: 'Avg', value: 340 },
  { month: 'Sen', value: 520 },
  { month: 'Okt', value: 690 },
  { month: 'Noy', value: 880 },
  { month: 'Dek', value: 1020 },
  { month: 'Yan', value: 1180 },
  { month: 'Fev', value: 1340 },
  { month: 'Mar', value: 1610 },
  { month: 'Apr', value: 1920 },
  { month: 'May', value: 2210 },
  { month: 'Iyun', value: 2480 },
]
