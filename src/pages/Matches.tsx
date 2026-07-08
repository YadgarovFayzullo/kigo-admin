import { useMemo, useState } from 'react'
import { matches, regions, sportEmoji, sportName, type Match } from '../data'
import { IcSearch } from '../icons'
import { statusUz } from './Dashboard'
import { Select, Pager, usePagination, Modal } from '../ui'

const regionOpts = [{ value: 'all', label: 'Barcha hududlar' },
  ...regions.map((r) => ({ value: r, label: r }))]

export default function Matches() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [region, setRegion] = useState('all')
  const [detail, setDetail] = useState<Match | null>(null)

  const rows = useMemo(() => {
    return matches.filter((m) => {
      if (status !== 'all' && m.status !== status) return false
      if (type !== 'all' && m.type !== type) return false
      if (region !== 'all' && m.region !== region) return false
      if (q && !`${m.a} ${m.b} ${m.district} ${m.id}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [q, status, type, region])

  const { slice, page, pages, total, setPage } = usePagination(rows)

  return (
    <>
      <div className="toolbar">
        <Select label="Holat" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[
          { value: 'all', label: 'Hammasi' },
          { value: 'confirmed', label: 'Tasdiqlangan' },
          { value: 'searching', label: 'Qidirilmoqda' },
          { value: 'played', label: 'Oʻtkazilgan' },
          { value: 'cancelled', label: 'Bekor qilingan' },
        ]} />
        <Select label="Turi" value={type} onChange={(v) => { setType(v); setPage(1) }} options={[
          { value: 'all', label: 'Barchasi' },
          { value: 'solo', label: 'Yakkama-yakka' },
          { value: 'team', label: 'Jamoa' },
        ]} />
        <Select label="Hudud" value={region} onChange={(v) => { setRegion(v); setPage(1) }} options={regionOpts} />
        <div className="field">
          <label>Qidiruv</label>
          <div className="search" style={{ margin: 0, width: 200 }}>
            <IcSearch className="ic" />
            <input placeholder="Match, ID (MT-2000)…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Turi</th><th>Sport</th><th>Ishtirokchilar</th>
                <th>Hudud</th><th>Sana / vaqt</th><th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((m) => (
                <tr key={m.id} className="clickable" onClick={() => setDetail(m)}>
                  <td className="cell-sub">{m.id}</td>
                  <td><span className="tag">{m.type === 'team' ? '👥 Jamoa' : '⚔️ 1v1'}</span></td>
                  <td><span className="tag">{sportEmoji(m.sport)} {sportName(m.sport)}</span></td>
                  <td className="cell-main">{m.a} <span className="cell-sub">vs</span> {m.b}</td>
                  <td className="cell-sub">{m.region} · {m.district}</td>
                  <td className="cell-sub">{m.date} · {m.time}</td>
                  <td><span className={`pill ${m.status}`}>{statusUz(m.status)}</span></td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={7}><div className="empty">Match topilmadi</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} total={total} onChange={setPage} />
      </div>

      {detail && (
        <Modal
          title="Match tafsilotlari"
          onClose={() => setDetail(null)}
        >
          <div className="detail-head">
            <div className="dh-main">
              <div className="dh-name">{sportEmoji(detail.sport)} {detail.a} <span style={{ color: 'var(--faint)' }}>vs</span> {detail.b}</div>
              <div className="dh-sub">
                {detail.id} · <span className={`pill ${detail.status}`}>{statusUz(detail.status)}</span>
              </div>
            </div>
          </div>

          <div className="kv" style={{ marginTop: 16 }}>
            <div>
              <div className="k">Sport turi</div>
              <div className="v">{sportEmoji(detail.sport)} {sportName(detail.sport)}</div>
            </div>
            <div>
              <div className="k">Turi</div>
              <div className="v">{detail.type === 'team' ? '👥 Jamoa' : '⚔️ Yakkama-yakka'}</div>
            </div>
            <div>
              <div className="k">Sana</div>
              <div className="v">{detail.date}</div>
            </div>
            <div>
              <div className="k">Vaqt</div>
              <div className="v">{detail.time}</div>
            </div>
            <div>
              <div className="k">Hudud</div>
              <div className="v">{detail.region}</div>
            </div>
            <div>
              <div className="k">Tuman</div>
              <div className="v">{detail.district}</div>
            </div>
            <div className="full">
              <div className="k">Ishtirokchilar</div>
              <div className="v">{detail.a} · {detail.b}</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
