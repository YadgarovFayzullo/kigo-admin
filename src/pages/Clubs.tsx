import { useMemo, useState } from 'react'
import { clubs as seed, regions, sports, players, sportEmoji, sportName, type Club } from '../data'
import { IcPlus, IcArrowLeft } from '../icons'
import { statusUz } from './Dashboard'
import { Select, Pager, usePagination, Modal, Avatar } from '../ui'

const nf = new Intl.NumberFormat('ru-RU')
const regionOpts = [{ value: 'all', label: 'Barcha hududlar' },
  ...regions.map((r) => ({ value: r, label: r }))]

const empty: Omit<Club, 'id'> = {
  name: '', sport: 'football', region: regions[0], district: '', address: '',
  geo: [41.311, 69.279], courts: 1, bookings: 0,
  admin: { name: '', phone: '', email: '' },
  status: 'pending', since: new Date().toISOString().slice(0, 10),
}

export default function Clubs() {
  const [list, setList] = useState<Club[]>(seed)
  const [region, setRegion] = useState('all')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(empty)
  const [selected, setSelected] = useState<Club | null>(null)

  const rows = useMemo(
    () => list.filter((c) => region === 'all' || c.region === region),
    [list, region],
  )
  const { slice, page, pages, total, setPage } = usePagination(rows)

  const totalBookings = rows.reduce((s, c) => s + c.bookings, 0)
  const totalCourts = rows.reduce((s, c) => s + c.courts, 0)

  const save = () => {
    setList((l) => [
      { ...draft, id: `CL-${String(l.length + 1).padStart(2, '0')}` },
      ...l,
    ])
    setAdding(false)
    setDraft(empty)
  }
  const set = (patch: Partial<Club>) => setDraft((d) => ({ ...d, ...patch }))
  const setAdmin = (patch: Partial<Club['admin']>) =>
    setDraft((d) => ({ ...d, admin: { ...d.admin, ...patch } }))

  const valid = draft.name && draft.address && draft.admin.name && draft.admin.phone

  // ---- Club detail page ----
  if (selected) {
    const c = selected
    const related = players
      .filter((p) => p.sport === c.sport && p.region === c.region)
      .slice(0, 6)
    return (
      <>
        <button className="back-btn" onClick={() => setSelected(null)}>
          <IcArrowLeft /> Klublar roʻyxatiga qaytish
        </button>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="detail-head">
            <div className="pin" style={{
              width: 56, height: 56, borderRadius: 14, flex: 'none',
              display: 'grid', placeItems: 'center', fontSize: 26,
              background: 'var(--panel-2)', border: '1px solid var(--border-2)',
            }}>{sportEmoji(c.sport)}</div>
            <div className="dh-main">
              <div className="dh-name">{c.name}</div>
              <div className="dh-sub">
                {c.id} · <span className={`pill ${c.status}`}>{statusUz(c.status)}</span> · {sportName(c.sport)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '18px 0' }}>
            <div className="stat-mini"><b>{c.courts}</b><span>Maydonlar</span></div>
            <div className="stat-mini"><b>{nf.format(c.bookings)}</b><span>Bronlar</span></div>
            <div className="stat-mini"><b>{c.since}</b><span>Hamkorlikdan beri</span></div>
          </div>

          <div className="section-label">Lokatsiya</div>
          <div className="kv" style={{ margin: '8px 0 20px' }}>
            <div><div className="k">Viloyat</div><div className="v">{c.region}</div></div>
            <div><div className="k">Tuman</div><div className="v">{c.district}</div></div>
            <div className="full"><div className="k">Manzil</div><div className="v">{c.address}</div></div>
            <div><div className="k">Koordinatalar</div><div className="v">📍 {c.geo[0]}, {c.geo[1]}</div></div>
          </div>

          <div className="section-label">Admin kontaktlari</div>
          <div className="kv" style={{ margin: '8px 0 4px' }}>
            <div><div className="k">Masʼul shaxs</div><div className="v">{c.admin.name}</div></div>
            <div><div className="k">Telefon</div><div className="v">{c.admin.phone}</div></div>
            <div className="full"><div className="k">Email</div><div className="v">{c.admin.email || '—'}</div></div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-h" style={{ marginBottom: 12 }}>
            <h3>Shu hududdagi {sportName(c.sport)} oʻyinchilari</h3>
            <span className="sub">{related.length} ta</span>
          </div>
          {related.length === 0 ? (
            <div className="empty">Oʻyinchi topilmadi</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {related.map((p) => (
                <div key={p.id} className="name-cell">
                  <Avatar name={p.name} colors={p.avatar} size={30} />
                  <div style={{ marginLeft: 10 }}>
                    <div className="cell-main">{p.name}</div>
                    <div className="cell-sub">{p.id} · {p.district} · ⭐ {p.rating.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="toolbar">
        <Select label="Hudud" value={region} onChange={(v) => { setRegion(v); setPage(1) }} options={regionOpts} />
        <span className="count-note" style={{ alignSelf: 'flex-end', paddingBottom: 9 }}>
          {rows.length} ta klub · {totalCourts} ta maydon · {nf.format(totalBookings)} ta bron
        </span>
        <div className="field mla" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={() => setAdding(true)}><IcPlus /> Klub qoʻshish</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Klub</th><th>Sport</th><th>Hudud</th><th>Manzil</th>
                <th>Admin</th><th>Maydon</th><th>Bronlar</th><th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => setSelected(c)}>
                  <td>
                    <div className="cell-main">{c.name}</div>
                    <div className="cell-sub">{c.id} · {c.since}</div>
                  </td>
                  <td><span className="tag">{sportEmoji(c.sport)} {sportName(c.sport)}</span></td>
                  <td className="cell-sub">{c.region}</td>
                  <td>
                    <div>{c.district}</div>
                    <div className="cell-sub">{c.address}</div>
                    <div className="cell-sub" style={{ fontSize: 11 }}>📍 {c.geo[0]}, {c.geo[1]}</div>
                  </td>
                  <td>
                    <div className="cell-main">{c.admin.name}</div>
                    <div className="cell-sub">{c.admin.phone}</div>
                    <div className="cell-sub">{c.admin.email}</div>
                  </td>
                  <td>{c.courts}</td>
                  <td className="cell-main">{nf.format(c.bookings)}</td>
                  <td><span className={`pill ${c.status}`}>{statusUz(c.status)}</span></td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={8}><div className="empty">Klub topilmadi</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} total={total} onChange={setPage} />
      </div>

      {adding && (
        <Modal
          title="Yangi klub / kompaniya qoʻshish"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setAdding(false)}>Bekor qilish</button>
              <button className="btn primary" disabled={!valid} onClick={save}>Saqlash</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-section">Asosiy maʼlumot</div>
            <div className="field full">
              <label>Klub / kompaniya nomi *</label>
              <input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Masalan: Yunusobod Arena" />
            </div>
            <div className="field">
              <label>Sport turi</label>
              <select className="select" value={draft.sport} onChange={(e) => set({ sport: e.target.value as Club['sport'] })}>
                {sports.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Maydonlar soni</label>
              <input className="input" type="number" min={1} value={draft.courts} onChange={(e) => set({ courts: Number(e.target.value) })} />
            </div>

            <div className="form-section">Lokatsiya</div>
            <div className="field">
              <label>Viloyat (hudud)</label>
              <select className="select" value={draft.region} onChange={(e) => set({ region: e.target.value })}>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tuman</label>
              <input className="input" value={draft.district} onChange={(e) => set({ district: e.target.value })} placeholder="Tuman nomi" />
            </div>
            <div className="field full">
              <label>Manzil (koʻcha, uy) *</label>
              <input className="input" value={draft.address} onChange={(e) => set({ address: e.target.value })} placeholder="Amir Temur koʻch. 108" />
            </div>
            <div className="field">
              <label>Kenglik (lat)</label>
              <input className="input" type="number" step="0.0001" value={draft.geo[0]} onChange={(e) => set({ geo: [Number(e.target.value), draft.geo[1]] })} />
            </div>
            <div className="field">
              <label>Uzunlik (lng)</label>
              <input className="input" type="number" step="0.0001" value={draft.geo[1]} onChange={(e) => set({ geo: [draft.geo[0], Number(e.target.value)] })} />
            </div>

            <div className="form-section">Admin kontaktlari</div>
            <div className="field full">
              <label>Admin F.I.Sh. *</label>
              <input className="input" value={draft.admin.name} onChange={(e) => setAdmin({ name: e.target.value })} placeholder="Masʼul shaxs ismi" />
            </div>
            <div className="field">
              <label>Telefon *</label>
              <input className="input" value={draft.admin.phone} onChange={(e) => setAdmin({ phone: e.target.value })} placeholder="+998 90 123 45 67" />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={draft.admin.email} onChange={(e) => setAdmin({ email: e.target.value })} placeholder="admin@club.uz" />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
