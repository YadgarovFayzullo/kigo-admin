import { useMemo } from 'react'
import { players, clubs, regions } from '../data'
import { IcClub } from '../icons'

const nf = new Intl.NumberFormat('ru-RU')

export default function Regions() {
  const stats = useMemo(() => regions
    .map((r) => ({
      name: r,
      users: players.filter((p) => p.region === r).length,
      clubs: clubs.filter((c) => c.region === r).length,
    }))
    .sort((a, b) => b.users - a.users), [])

  const totalUsers = players.length
  const totalClubs = clubs.length
  const covered = stats.filter((s) => s.users > 0).length

  return (
    <>
      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <div className="card stat">
          <div className="val">{regions.length}</div>
          <div className="lbl">Jami hududlar</div>
        </div>
        <div className="card stat">
          <div className="val">{covered}</div>
          <div className="lbl">Qamrab olingan hududlar</div>
        </div>
        <div className="card stat">
          <div className="val">{nf.format(totalUsers)}</div>
          <div className="lbl">Roʻyxatdagi oʻyinchilar</div>
        </div>
      </div>

      <div className="card-h" style={{ marginBottom: 12 }}>
        <h3>Hududlar boʻyicha</h3>
        <span className="sub">jami {nf.format(totalUsers)} oʻyinchi · {totalClubs} klub</span>
      </div>

      <div className="region-grid">
        {stats.map((s) => (
          <div className="region-card" key={s.name}>
            <div className="pin"><IcClub /></div>
            <div>
              <div className="rname">{s.name}</div>
              <div className="cell-sub" style={{ fontSize: 12 }}>Oʻzbekiston</div>
            </div>
            <div className="rnums">
              <div className="rnum"><b>{s.users}</b><span>oʻyinchi</span></div>
              <div className="rnum"><b>{s.clubs}</b><span>klub</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
