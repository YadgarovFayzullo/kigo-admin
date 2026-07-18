import { useEffect, useState } from 'react'
import { IcUsers, IcMatch, IcClub, IcTrend } from '../icons'
import {
  getAdminSports, getAdminRegions, getAdminMatches, getAdminClubs,
  getMatchesPerMonth, getStatsOverview, getStatsSummary,
} from '../api/endpoints'
import { adaptSport, adaptRegion, adaptMatch, type MatchRow } from '../api/adapters'
import type { Sport } from '../data'
import type { RegionRow } from '../api/adapters'

const nf = new Intl.NumberFormat('ru-RU')

function Tile({ val, lbl, accent }: { val: string; lbl: string; accent?: string }) {
  return (
    <div className="stat-mini">
      <b style={accent ? { color: accent } : undefined}>{val}</b>
      <span>{lbl}</span>
    </div>
  )
}

function StatCard({
  icon, cls, val, lbl, delta,
}: { icon: React.ReactNode; cls?: string; val: string; lbl: string; delta: string }) {
  return (
    <div className="card stat">
      <div className="top">
        <div className={`ic-wrap ${cls ?? ''}`}>{icon}</div>
        <span className="delta up">↑ {delta}</span>
      </div>
      <div className="val">{val}</div>
      <div className="lbl">{lbl}</div>
    </div>
  )
}

interface MonthPoint { month: string; value: number }

// The /admin/stats/* payloads are typed `object` in the OpenAPI schema, so the
// exact field names aren't known ahead of time. We flatten whatever comes back
// into normalized key → number pairs and look tiles up by a list of plausible
// names; anything unmatched renders as "—" rather than a made-up number.
const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function flattenNums(src: unknown, out: Record<string, number> = {}, depth = 0): Record<string, number> {
  if (!src || typeof src !== 'object' || depth > 3) return out
  for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
    const key = normKey(k)
    if (typeof v === 'number') out[key] = v
    else if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) out[key] = Number(v)
    else if (v && typeof v === 'object') flattenNums(v, out, depth + 1)
  }
  return out
}

function pick(stats: Record<string, number>, ...candidates: string[]): number | null {
  for (const c of candidates) {
    const k = normKey(c)
    if (k in stats) return stats[k]
  }
  return null
}

// Best-effort normalization of the untyped /stats/matches-per-month payload.
function normalizeMonths(raw: unknown): MonthPoint[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: MonthPoint[] = []
  for (const item of raw as Record<string, unknown>[]) {
    const month = String(item.month ?? item.label ?? item.date ?? item.period ?? '')
    const value = Number(item.value ?? item.count ?? item.total ?? item.matches ?? 0)
    if (month) out.push({ month, value })
  }
  return out.length ? out : null
}

export default function Dashboard() {
  const [sports, setSports] = useState<Sport[]>([])
  const [regions, setRegions] = useState<RegionRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [clubsCount, setClubsCount] = useState<number | null>(null)
  const [months, setMonths] = useState<MonthPoint[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [s, r, m, c, mm, ov, sm] = await Promise.allSettled([
        getAdminSports(), getAdminRegions(), getAdminMatches(), getAdminClubs(),
        getMatchesPerMonth(), getStatsOverview(), getStatsSummary(),
      ])
      if (!alive) return
      if (s.status === 'fulfilled') setSports(s.value.map((x) => adaptSport(x)))
      if (r.status === 'fulfilled') setRegions(r.value.map((x) => adaptRegion(x)))
      if (m.status === 'fulfilled') setMatches(m.value.map((x) => adaptMatch(x)))
      if (c.status === 'fulfilled') setClubsCount(c.value.length)
      if (mm.status === 'fulfilled') {
        const norm = normalizeMonths(mm.value)
        if (norm) setMonths(norm)
      }
      // Log the raw payloads once so the real field names can be pinned down.
      const merged: Record<string, number> = {}
      if (ov.status === 'fulfilled') {
        console.info('[kigo] /admin/stats/overview/', ov.value)
        Object.assign(merged, flattenNums(ov.value))
      }
      if (sm.status === 'fulfilled') {
        console.info('[kigo] /admin/stats/summary/', sm.value)
        Object.assign(merged, flattenNums(sm.value))
      }
      setStats(merged)
    })()
    return () => { alive = false }
  }, [])

  // Formats a stat looked up by any of the plausible backend field names.
  const stat = (...keys: string[]) => {
    const v = pick(stats, ...keys)
    return v === null ? '—' : nf.format(v)
  }

  const totalPlayers = sports.reduce((s, x) => s + x.players, 0)
  const confirmed = matches.filter((m) => m.statusKey === 'confirmed' || m.statusKey === 'played').length
  const max = Math.max(1, ...months.map((m) => m.value))
  const topSports = [...sports].sort((a, b) => b.players - a.players).slice(0, 6)
  const maxSport = Math.max(1, ...topSports.map((s) => s.players))
  const recent = matches.slice(0, 6)
  const regionStats = [...regions].sort((a, b) => b.users - a.users).slice(0, 6)

  return (
    <>
      <div className="grid cols-4">
        <StatCard icon={<IcUsers />} val={nf.format(totalPlayers)} lbl="Faol oʻyinchilar" delta="12.4%" />
        <StatCard icon={<IcMatch />} cls="blue" val={nf.format(months.at(-1)?.value ?? matches.length)} lbl="Shu oydagi matchlar" delta="9.1%" />
        <StatCard icon={<IcClub />} cls="amber" val={String(clubsCount ?? '—')} lbl="Klublar" delta="2 ta" />
        <StatCard icon={<IcTrend />} cls="green" val="94%" lbl="Match muvaffaqiyati" delta="3.2%" />
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-h" style={{ marginBottom: 12 }}>
            <h3>Foydalanuvchilar oqimi</h3>
            <span className="sub">roʻyxatdan oʻtish va yuklab olishlar</span>
          </div>
          <div className="mini-grid">
            <Tile val={stat('registered_today', 'today_registered', 'new_users_today', 'users_today', 'registrations_today')} lbl="Bugun roʻyxatdan oʻtgan" accent="var(--accent)" />
            <Tile val={stat('installs_7d', 'downloads_7d', 'installs_week', 'installs_last_7_days')} lbl="7 kunda yuklab olishlar" />
            <Tile val={stat('installs_30d', 'downloads_30d', 'installs_month', 'installs_last_30_days')} lbl="30 kunda yuklab olishlar" />
            <Tile val={stat('males', 'male', 'men', 'male_count', 'male_users')} lbl="Erkaklar soni" accent="#4c9dff" />
            <Tile val={stat('females', 'female', 'women', 'female_count', 'female_users')} lbl="Ayollar soni" accent="#ff5c9d" />
            <Tile val={stat('active_requests_now', 'active_requests', 'requests_active', 'open_requests')} lbl="Hozir aktiv soʻrovlar" accent="var(--accent)" />
          </div>
        </div>

        <div className="card">
          <div className="card-h" style={{ marginBottom: 12 }}>
            <h3>Soʻrovlar</h3>
            <span className="sub">yuborilgan · qabul · rad etilgan</span>
          </div>
          <div className="mini-grid">
            <Tile val={stat('requests_sent', 'sent_requests', 'applications_sent', 'applications_total')} lbl="Yuborilgan soʻrovlar" />
            <Tile val={stat('requests_accepted', 'accepted_requests', 'applications_accepted', 'accepted')} lbl="Qabul qilingan" accent="#34d17a" />
            <Tile val={stat('requests_rejected', 'rejected_requests', 'applications_rejected', 'rejected')} lbl="Rad etilgan" accent="#ff5c6a" />
          </div>
          <div className="card-h" style={{ margin: '18px 0 8px' }}>
            <h3 style={{ fontSize: 14 }}>Sherik / raqib qidiruvi</h3>
          </div>
          <div className="table-wrap">
            <table className="matrix">
              <thead>
                <tr><th>Jins</th><th>Sherik</th><th>Raqib</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="rowlbl"><span style={{ color: '#4c9dff' }}>♂</span> Erkaklar</td>
                  <td><b>{stat('men_partner', 'male_partner', 'men_partners')}</b></td>
                  <td><b>{stat('men_opponent', 'male_opponent', 'men_opponents')}</b></td>
                </tr>
                <tr>
                  <td className="rowlbl"><span style={{ color: '#ff5c9d' }}>♀</span> Ayollar</td>
                  <td><b>{stat('women_partner', 'female_partner', 'women_partners')}</b></td>
                  <td><b>{stat('women_opponent', 'female_opponent', 'women_opponents')}</b></td>
                </tr>
                <tr>
                  <td className="rowlbl">Aralash (ayol + erkak)</td>
                  <td colSpan={2}><b>{stat('mixed_partner_opponent', 'mixed', 'mixed_requests')}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Matchlar dinamikasi</h3>
              <span className="sub">Oxirgi oylar · jami oʻtkazilgan oʻyinlar</span>
            </div>
            <span className="delta up">↑ 12.4%</span>
          </div>
          {months.length === 0 ? (
            <div className="empty">Maʼlumot yoʻq</div>
          ) : (
            <div className="chart">
              {months.map((m) => (
                <div className="bar-col" key={m.month} title={`${m.month}: ${nf.format(m.value)}`}>
                  <div className="bar" style={{ height: `${(m.value / max) * 100}%` }} />
                  <span className="bar-x">{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Sport boʻyicha</h3>
            <span className="sub">oʻyinchilar</span>
          </div>
          {topSports.length === 0 && <div className="empty">Yuklanmoqda…</div>}
          {topSports.map((s) => (
            <div className="dist-row" key={s.id}>
              <span className="dname">{s.emoji} {s.name}</span>
              <span className="track">
                <span className="fill" style={{ width: `${(s.players / maxSport) * 100}%` }} />
              </span>
              <span className="dval">{nf.format(s.players)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h">
          <h3>Hududlar boʻyicha</h3>
          <span className="sub">eng faol 6 ta viloyat · oʻyinchi / klub</span>
        </div>
        <div className="region-grid">
          {regionStats.map((r) => (
            <div className="region-card" key={r.id}>
              <div className="pin"><IcClub /></div>
              <div className="rname">{r.name}</div>
              <div className="rnums">
                <div className="rnum"><b>{r.users}</b><span>oʻyinchi</span></div>
                <div className="rnum"><b>{r.clubs}</b><span>klub</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h">
          <h3>Soʻnggi matchlar</h3>
          <span className="sub">{confirmed} ta oʻtkazilgan / tasdiqlangan</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Sport</th><th>Oʻyinchilar</th>
                <th>Hudud</th><th>Vaqt</th><th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td className="cell-sub">MT-{m.id}</td>
                  <td><span className="tag">{m.sportEmoji} {m.sportName}</span></td>
                  <td className="cell-main">{m.a} <span className="cell-sub">vs</span> {m.b}</td>
                  <td>{m.district || m.region}</td>
                  <td className="cell-sub">{m.date} · {m.time}</td>
                  <td><span className={`pill ${m.statusKey}`}>{m.statusLabel}</span></td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6}><div className="empty">Match topilmadi</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
