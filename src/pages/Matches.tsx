import { useEffect, useMemo, useState } from 'react'
import { IcSearch } from '../icons'
import { Select, Pager, usePagination, Modal } from '../ui'
import { getAdminMatches } from '../api/endpoints'
import { adaptMatch, localized, type MatchRow } from '../api/adapters'
import { useRefData, districtOptionsForRegion } from '../api/refData'

export default function Matches() {
  const { regions, districts } = useRefData()
  const [list, setList] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [region, setRegion] = useState('all')
  const [district, setDistrict] = useState('all')
  const [detail, setDetail] = useState<MatchRow | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = (await getAdminMatches()).map((m) => adaptMatch(m))
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
  const districtOpts = useMemo(() => [
    { value: 'all', label: 'Barcha tumanlar' },
    ...districtOptionsForRegion(regions, districts, region),
  ], [regions, districts, region])

  const rows = useMemo(() => list.filter((m) => {
    if (status !== 'all' && m.statusKey !== status) return false
    if (type !== 'all' && m.type !== type) return false
    if (region !== 'all' && m.region !== region) return false
    if (district !== 'all' && m.district !== district) return false
    if (q && !`${m.a} ${m.b} ${m.district} ${m.id}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [list, q, status, type, region, district])

  const { slice, page, pages, total, setPage } = usePagination(rows)

  return (
    <>
      <div className="toolbar">
        <Select label="Holat" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[
          { value: 'all', label: 'Hammasi' },
          { value: 'searching', label: 'Ochiq / qidirilmoqda' },
          { value: 'confirmed', label: 'Tasdiqlangan' },
          { value: 'played', label: 'Oʻtkazilgan' },
          { value: 'cancelled', label: 'Bekor / muddati tugagan' },
        ]} />
        <Select label="Turi" value={type} onChange={(v) => { setType(v); setPage(1) }} options={[
          { value: 'all', label: 'Barchasi' },
          { value: 'solo', label: 'Yakkama-yakka' },
          { value: 'team', label: 'Jamoa' },
        ]} />
        <Select label="Hudud" value={region} onChange={(v) => { setRegion(v); setDistrict('all'); setPage(1) }} options={regionOpts} />
        <Select label="Tuman" value={district} onChange={(v) => { setDistrict(v); setPage(1) }} options={districtOpts} />
        <div className="field">
          <label>Qidiruv</label>
          <div className="search" style={{ margin: 0, width: 200 }}>
            <IcSearch className="ic" />
            <input placeholder="Ishtirokchi, ID…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
        </div>
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
                <th>ID</th><th>Turi</th><th>Sport</th><th>Ishtirokchilar</th>
                <th>Hudud</th><th>Sana / vaqt</th><th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((m) => (
                <tr key={m.id} className="clickable" onClick={() => setDetail(m)}>
                  <td className="cell-sub">MT-{m.id}</td>
                  <td><span className="tag">{m.type === 'team' ? 'Jamoa' : '1v1'}</span></td>
                  <td><span className="tag">{m.sportName}</span></td>
                  <td className="cell-main">{m.a} <span className="cell-sub">vs</span> {m.b}</td>
                  <td className="cell-sub">{m.region} · {m.district}</td>
                  <td className="cell-sub">{m.date} · {m.time}</td>
                  <td><span className={`pill ${m.statusKey}`}>{m.statusLabel}</span></td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty">{loading ? 'Yuklanmoqda…' : 'Match topilmadi'}</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} total={total} onChange={setPage} />
      </div>

      {detail && (
        <Modal title="Match tafsilotlari" onClose={() => setDetail(null)}>
          <div className="detail-head">
            <div className="dh-main">
              <div className="dh-name">{detail.a} <span style={{ color: 'var(--faint)' }}>vs</span> {detail.b}</div>
              <div className="dh-sub">
                MT-{detail.id} · <span className={`pill ${detail.statusKey}`}>{detail.statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="kv" style={{ marginTop: 16 }}>
            <div>
              <div className="k">Sport turi</div>
              <div className="v">{detail.sportName}</div>
            </div>
            <div>
              <div className="k">Turi</div>
              <div className="v">{detail.type === 'team' ? 'Jamoa' : 'Yakkama-yakka'}</div>
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
              <div className="v">{detail.district || '—'}</div>
            </div>
            <div>
              <div className="k">Oʻyinchilar</div>
              <div className="v">{detail.players.length} / {detail.playersTotal}</div>
            </div>
            <div>
              <div className="k">Hisob</div>
              <div className="v">{detail.scoreA ?? '—'} : {detail.scoreB ?? '—'}</div>
            </div>
          </div>

          {detail.players.length > 0 && (
            <>
              <div className="section-label" style={{ marginTop: 16 }}>Ishtirokchilar</div>
              <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                {detail.players.map((p) => (
                  <div key={p.id} className="name-cell" style={{ justifyContent: 'space-between' }}>
                    <span className="cell-main">
                      {p.name}{p.isOrganizer && <span className="tag" style={{ marginLeft: 8 }}>Tashkilotchi</span>}
                    </span>
                    <span className="cell-sub">
                      {p.side ? `Jamoa ${p.side.toUpperCase()}` : ''}
                      {p.attended === true ? ' · keldi' : p.attended === false ? ' · kelmadi' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
