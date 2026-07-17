import { useEffect, useMemo, useState } from 'react'
import { IcClub } from '../icons'
import { getAdminRegions, getRegions } from '../api/endpoints'
import { adaptRegion, type RegionRow } from '../api/adapters'

const nf = new Intl.NumberFormat('ru-RU')

export default function Regions() {
  const [rows, setRows] = useState<RegionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // Admin endpoint includes user/club aggregates; the public one is
        // names only, so counts stay 0 until a token is available.
        let list: RegionRow[]
        try {
          list = (await getAdminRegions()).map((r) => adaptRegion(r))
        } catch {
          list = (await getRegions()).map((r) => adaptRegion(r))
        }
        if (alive) { setRows(list); setError(null) }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Yuklashda xatolik')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const stats = useMemo(
    () => [...rows].sort((a, b) => b.users - a.users),
    [rows],
  )

  const totalUsers = rows.reduce((n, r) => n + r.users, 0)
  const totalClubs = rows.reduce((n, r) => n + r.clubs, 0)
  const covered = stats.filter((s) => s.users > 0).length

  return (
    <>
      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <div className="card stat">
          <div className="val">{rows.length}</div>
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

      {loading && <div className="count-note" style={{ padding: '24px 4px' }}>Yuklanmoqda…</div>}
      {error && !loading && (
        <div className="count-note" style={{ padding: '24px 4px', color: '#ff5c6a' }}>
          Xatolik: {error}
        </div>
      )}

      <div className="region-grid">
        {stats.map((s) => (
          <div className="region-card" key={s.id}>
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
