import { useMemo, useState } from 'react'
import { reports, regions } from '../data'
import { IcSearch } from '../icons'
import { Select, Pager, usePagination } from '../ui'

const catUz: Record<string, string> = {
  'no-show': 'Kelmadi', behavior: 'Xatti-harakat', fake: 'Soxta profil',
  cheating: 'Aldash', spam: 'Spam',
}
const statusUz: Record<string, string> = {
  open: 'Ochiq', reviewing: 'Koʻrilmoqda', resolved: 'Hal qilindi', dismissed: 'Rad etildi',
}
// map report status -> existing pill colors
const pillOf: Record<string, string> = {
  open: 'blocked', reviewing: 'searching', resolved: 'confirmed', dismissed: 'played',
}
const regionOpts = [{ value: 'all', label: 'Barcha hududlar' },
  ...regions.map((r) => ({ value: r, label: r }))]

export default function Reports() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [region, setRegion] = useState('all')

  const rows = useMemo(() => reports.filter((r) => {
    if (status !== 'all' && r.status !== status) return false
    if (region !== 'all' && r.region !== region) return false
    if (q && !`${r.target} ${r.reporter} ${r.id} ${r.targetId}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [q, status, region])

  const { slice, page, pages, total, setPage } = usePagination(rows)
  const open = reports.filter((r) => r.status === 'open').length

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
                  <td className="cell-sub">{r.id}</td>
                  <td>
                    <div className="cell-main">{r.target}</div>
                    <div className="cell-sub">{r.targetId}</div>
                  </td>
                  <td>
                    <div>{r.reporter}</div>
                    <div className="cell-sub">{r.reporterId}</div>
                  </td>
                  <td><span className="tag">{catUz[r.category]}</span></td>
                  <td className="cell-sub" style={{ whiteSpace: 'normal', maxWidth: 240 }}>{r.note}</td>
                  <td className="cell-sub">{r.region}</td>
                  <td className="cell-sub">{r.date}</td>
                  <td><span className={`pill ${pillOf[r.status]}`}>{statusUz[r.status]}</span></td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={8}><div className="empty">Shikoyat topilmadi</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} total={total} onChange={setPage} />
      </div>
    </>
  )
}
