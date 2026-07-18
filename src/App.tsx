import { useEffect, useState } from 'react'
import {
  IcDashboard, IcUsers, IcMatch, IcSport, IcClub,
  IcSearch, IcBell, IcSettings, IcCalendar, IcTrend, IcSun, IcMoon, IcLogout,
} from './icons'
import { type SportId } from './data'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import Matches from './pages/Matches'
import Sports from './pages/Sports'
import Clubs from './pages/Clubs'
import Reports from './pages/Reports'
import Regions from './pages/Regions'
import Login from './pages/Login'
import { useAuth } from './api/auth'
import {
  countAdminPlayers, countAdminMatches, countOpenReports,
  countAdminRegions, countAdminSports, countAdminClubs,
} from './api/endpoints'

type Route = 'dashboard' | 'players' | 'matches' | 'sports' | 'clubs' | 'reports' | 'regions'

const nav: { id: Route; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Boshqaruv paneli', icon: <IcDashboard className="ic" /> },
  { id: 'players', label: 'Oʻyinchilar', icon: <IcUsers className="ic" /> },
  { id: 'matches', label: 'Matchlar', icon: <IcMatch className="ic" /> },
  { id: 'reports', label: 'Shikoyatlar', icon: <IcCalendar className="ic" /> },
  { id: 'regions', label: 'Hududlar', icon: <IcTrend className="ic" /> },
  { id: 'sports', label: 'Sport turlari', icon: <IcSport className="ic" /> },
  { id: 'clubs', label: 'Klublar', icon: <IcClub className="ic" /> },
]

const titles: Record<Route, { h: string; crumb: string }> = {
  dashboard: { h: 'Boshqaruv paneli', crumb: 'Umumiy koʻrsatkichlar' },
  players: { h: 'Oʻyinchilar', crumb: 'Foydalanuvchilarni boshqarish' },
  matches: { h: 'Matchlar', crumb: 'Oʻyinlar va juftlashuvlar' },
  reports: { h: 'Shikoyatlar', crumb: 'Foydalanuvchi reportlari' },
  regions: { h: 'Hududlar', crumb: 'Viloyatlar boʻyicha statistika' },
  sports: { h: 'Sport turlari', crumb: 'Ilovadagi sport turlari' },
  clubs: { h: 'Klublar', crumb: 'Hamkor obyektlar' },
}

export default function App() {
  const { admin, ready, logout } = useAuth()
  const [route, setRoute] = useState<Route>('dashboard')
  const [sportFocus, setSportFocus] = useState<SportId | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('kigo-theme') as 'dark' | 'light') || 'dark',
  )

  const [counts, setCounts] = useState<Partial<Record<Route, number>>>({})

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kigo-theme', theme)
  }, [theme])

  // Sidebar badges — only rendered for the routes whose count resolved.
  useEffect(() => {
    if (!admin) return // signed out: sidebar is unmounted, stale counts are moot
    let alive = true
    ;(async () => {
      const keys: Route[] = ['players', 'matches', 'reports', 'regions', 'sports', 'clubs']
      const res = await Promise.allSettled([
        countAdminPlayers(), countAdminMatches(), countOpenReports(),
        countAdminRegions(), countAdminSports(), countAdminClubs(),
      ])
      if (!alive) return
      const next: Partial<Record<Route, number>> = {}
      res.forEach((r, i) => { if (r.status === 'fulfilled') next[keys[i]] = r.value })
      setCounts(next)
    })()
    return () => { alive = false }
  }, [admin])

  if (!ready) return <div className="login-wrap">Yuklanmoqda…</div>
  if (!admin) return <Login />

  const adminName = [admin.name, admin.surname].filter(Boolean).join(' ') || 'Admin'

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">K</div>
          <div>
            <div className="name">KiGo</div>
            <div className="tag">Admin panel</div>
          </div>
        </div>

        <div className="nav-label">Menyu</div>
        {nav.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${route === n.id ? 'active' : ''}`}
            onClick={() => { setRoute(n.id); if (n.id === 'players') setSportFocus(null) }}
          >
            {n.icon}
            {n.label}
            {counts[n.id] !== undefined && <span className="badge">{counts[n.id]}</span>}
          </button>
        ))}

        <div className="nav-label">Boshqa</div>
        <button className="nav-item"><IcSettings className="ic" /> Sozlamalar</button>

        <div className="spacer" />
        <div className="side-user">
          <div className="av">{adminName.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="who">{adminName}</div>
            <div className="role">{admin.email ?? 'kigo.uz'}</div>
          </div>
          <button className="icon-btn mla" title="Chiqish" onClick={() => void logout()}>
            <IcLogout />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{titles[route].h}</h1>
          <span className="crumb">/ {titles[route].crumb}</span>
          <div className="search">
            <IcSearch className="ic" />
            <input placeholder="Qidirish…" />
          </div>
          <button
            className="icon-btn"
            title={theme === 'dark' ? 'Yorugʻ rejim' : 'Qorongʻi rejim'}
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <IcSun /> : <IcMoon />}
          </button>
          <button className="icon-btn"><IcBell /></button>
        </header>

        <main className="content">
          {route === 'dashboard' && <Dashboard />}
          {route === 'players' && <Players key={sportFocus ?? 'all'} initialSport={sportFocus} />}
          {route === 'matches' && <Matches />}
          {route === 'reports' && <Reports />}
          {route === 'regions' && <Regions />}
          {route === 'sports' && (
            <Sports onOpenSport={(id) => { setSportFocus(id); setRoute('players') }} />
          )}
          {route === 'clubs' && <Clubs />}
        </main>
      </div>
    </div>
  )
}
