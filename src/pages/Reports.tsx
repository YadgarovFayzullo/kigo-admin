import { useEffect, useMemo, useState } from 'react'
import { IcSearch } from '../icons'
import { Select, Pager, usePagination } from '../ui'
import { getAdminReports } from '../api/endpoints'
import { adaptReport, localized, type ReportRow } from '../api/adapters'
import { useRefData } from '../api/refData'

// Report-status code → pill color class reused from the shared stylesheet.
const pillOf: Record<string, string> = {
  open: 'blocked', reviewing: 'searching', resolved: 'confirmed', dismissed: 'played',
}

export default function Reports() {
  const { regions } = useRefData()
  const [list, setList] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [region, setRegion] = useState('all')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = (await getAdminReports()).map((r) => adaptReport(r))
        if (alive) { setList(rows); setError(null) }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Yuklashda xatolik')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const regionOpts = useMemo(() => [
    { value: 'all', label: 'Barcha hududlar' },
    ...regions.map((r) => ({ value: localized(r), label: localized(r) })),
  ], [regions])

  const rows = useMemo(() => list.filter((r) => {
    if (status !== 'all' && r.status !== status) return false
    if (region !== 'all' && r.region !== region) return false
    if (q && !`${r.target} ${r.reporter} ${r.id} ${r.targetId}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [list, q, status, region])

  const { slice, page, pages, total, setPage } = usePagination(rows)
  const open = list.filter((r) => r.status === 'open').length

  return (
    <>
      <div className="toolbar">
        <Select label="Holat" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[
          { value: 'all', label: 'Hammasi' },
          { value: 'open', label: 'Ochiq' },
          { value: 'reviewing', label: 'Koʻrilmoqda' },
          { value: 'resolved', label: 'Hal qilindi' },
          { value: 'dismissed', label: 'Rad etildi' },
        ]} />
        <Select label="Hudud" value={region} onChange={(v) => { setRegion(v); setPage(1) }} options={regionOpts} />
        <div className="field">
          <label>Qidiruv</label>
          <div className="search" style={{ margin: 0, width: 220 }}>
            <IcSearch className="ic" />
            <input placeholder="Oʻyinchi, ID…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
        </div>
        <span className="count-note mla" style={{ alignSelf: 'flex-end', paddingBottom: 9 }}>
          {open} ta ochiq shikoyat
        </span>
      </div>

      {error && (
        <div className="count-note" style={{ padding: '16px 4px', color: '#ff5c6a' }}>
          Xatolik: {error}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Kimga</th><th>Kimdan</th><th>Sabab</th>
                <th>Izoh</th><th>Hudud</th><th>Sana</th><th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr key={r.id}>
                  <td className="cell-sub">RP-{r.id}</td>
                  <td>
                    <div className="cell-main">{r.target}</div>
                    <div className="cell-sub">#{r.targetId}</div>
                  </td>
                  <td>
                    <div>{r.reporter}</div>
                    <div className="cell-sub">#{r.reporterId}</div>
                  </td>
                  <td><span className="tag">{r.categoryLabel}</span></td>
                  <td className="cell-sub" style={{ whiteSpace: 'normal', maxWidth: 240 }}>{r.note}</td>
                  <td className="cell-sub">{r.region}</td>
                  <td className="cell-sub">{r.date}</td>
                  <td><span className={`pill ${pillOf[r.status] ?? 'searching'}`}>{r.statusLabel}</span></td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty">{loading ? 'Yuklanmoqda…' : 'Shikoyat topilmadi'}</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} total={total} onChange={setPage} />
      </div>
    </>
  )
}
