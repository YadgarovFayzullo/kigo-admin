import { matches, clubs, sports, players, regions, matchesPerMonth, overview } from '../data'
import { IcUsers, IcMatch, IcClub, IcTrend } from '../icons'

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

export default function Dashboard() {
  const totalPlayers = sports.reduce((s, x) => s + x.players, 0)
  const confirmed = matches.filter((m) => m.status === 'confirmed').length
  const max = Math.max(...matchesPerMonth.map((m) => m.value))
  const topSports = [...sports].sort((a, b) => b.players - a.players).slice(0, 6)
  const maxSport = topSports[0].players
  const recent = matches.slice(0, 6)

  const regionStats = regions
    .map((r) => ({
      name: r,
      users: players.filter((p) => p.region === r).length,
      clubs: clubs.filter((c) => c.region === r).length,
    }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 6)

  return (
    <>
      <div className="grid cols-4">
        <StatCard icon={<IcUsers />} val={nf.format(totalPlayers)} lbl="Faol oʻyinchilar" delta="12.4%" />
        <StatCard icon={<IcMatch />} cls="blue" val={nf.format(matchesPerMonth.at(-1)!.value)} lbl="Shu oydagi matchlar" delta="9.1%" />
        <StatCard icon={<IcClub />} cls="amber" val={String(clubs.length)} lbl="Klublar" delta="2 ta" />
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
              <span className="sub">Oxirgi 12 oy · jami oʻ​tkazilgan oʻyinlar</span>
            </div>
            <span className="delta up">↑ 12.4%</span>
          </div>
          <div className="chart">
            {matchesPerMonth.map((m, i) => (
              <div className="bar-col" key={m.month} title={`${m.month}: ${nf.format(m.value)}`}>
                <div
                  className={`bar ${i === matchesPerMonth.length - 1 ? '' : ''}`}
                  style={{ height: `${(m.value / max) * 100}%` }}
                />
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
            <div className="region-card" key={r.name}>
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
          <span className="sub">{confirmed} ta tasdiqlangan bugun</span>
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
                  <td className="cell-sub">{m.id}</td>
                  <td><span className="tag">{sports.find((s) => s.id === m.sport)?.emoji} {sports.find((s) => s.id === m.sport)?.name}</span></td>
                  <td className="cell-main">{m.a} <span className="cell-sub">vs</span> {m.b}</td>
                  <td>{m.district}</td>
                  <td className="cell-sub">{m.date} · {m.time}</td>
                  <td><span className={`pill ${m.status}`}>{statusUz(m.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export function statusUz(s: string) {
  return ({
    confirmed: 'Tasdiqlangan', searching: 'Qidirilmoqda',
    played: 'Oʻtkazilgan', cancelled: 'Bekor qilingan',
    active: 'Faol', blocked: 'Bloklangan', pending: 'Kutilmoqda', paused: 'Toʻxtatilgan',
  } as Record<string, string>)[s] ?? s
}
