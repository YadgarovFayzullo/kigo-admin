import { useEffect, useState } from 'react'
import { matchesPerMonth as mockMonths, overview } from '../data'
import { IcUsers, IcMatch, IcClub, IcTrend } from '../icons'
import {
  getAdminSports, getAdminRegions, getAdminMatches, getAdminClubs,
  getMatchesPerMonth,
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
  const [months, setMonths] = useState<MonthPoint[]>(mockMonths)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [s, r, m, c, mm] = await Promise.allSettled([
        getAdminSports(), getAdminRegions(), getAdminMatches(), getAdminClubs(),
        getMatchesPerMonth(),
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
    })()
    return () => { alive = false }
  }, [])

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
            <Tile val={nf.format(overview.registeredToday)} lbl="Bugun roʻyxatdan oʻtgan" accent="var(--accent)" />
            <Tile val={nf.format(overview.installs7d)} lbl="7 kunda yuklab olishlar" />
            <Tile val={nf.format(overview.installs30d)} lbl="30 kunda yuklab olishlar" />
            <Tile val={nf.format(overview.males)} lbl="Erkaklar soni" accent="#4c9dff" />
            <Tile val={nf.format(overview.females)} lbl="Ayollar soni" accent="#ff5c9d" />
            <Tile val={nf.format(overview.activeRequestsNow)} lbl="Hozir aktiv soʻrovlar" accent="var(--accent)" />
          </div>
        </div>

        <div className="card">
          <div className="card-h" style={{ marginBottom: 12 }}>
            <h3>Soʻrovlar</h3>
            <span className="sub">yuborilgan · qabul · rad etilgan</span>
          </div>
          <div className="mini-grid">
            <Tile val={nf.format(overview.requestsSent)} lbl="Yuborilgan soʻrovlar" />
            <Tile val={nf.format(overview.requestsAccepted)} lbl="Qabul qilingan" accent="#34d17a" />
            <Tile val={nf.format(overview.requestsRejected)} lbl="Rad etilgan" accent="#ff5c6a" />
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
                  <td><b>{nf.format(overview.menPartner)}</b></td>
                  <td><b>{nf.format(overview.menOpponent)}</b></td>
                </tr>
                <tr>
                  <td className="rowlbl"><span style={{ color: '#ff5c9d' }}>♀</span> Ayollar</td>
                  <td><b>{nf.format(overview.womenPartner)}</b></td>
                  <td><b>{nf.format(overview.womenOpponent)}</b></td>
                </tr>
                <tr>
                  <td className="rowlbl">Aralash (ayol + erkak)</td>
                  <td colSpan={2}><b>{nf.format(overview.mixedPartnerOpponent)}</b></td>
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
          <div className="chart">
            {months.map((m) => (
              <div className="bar-col" key={m.month} title={`${m.month}: ${nf.format(m.value)}`}>
                <div className="bar" style={{ height: `${(m.value / max) * 100}%` }} />
                <span className="bar-x">{m.month}</span>
              </div>
            ))}
          </div>
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
