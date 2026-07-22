import { useEffect, useMemo, useState } from 'react'
import { IcPlus, IcArrowLeft } from '../icons'
import { Select, Pager, usePagination, Modal, Avatar } from '../ui'
import {
  getAdminClubs, getAdminClubPlayers, createAdminClub,
} from '../api/endpoints'
import {
  adaptClub, localized, userName, avatarFor, type ClubRow,
} from '../api/adapters'
import { useRefData, districtOptionsForRegion } from '../api/refData'
import type { ApiUserPublic, ClubWrite } from '../api/types'

const nf = new Intl.NumberFormat('ru-RU')

const statusLabel: Record<string, string> = {
  active: 'Faol', pending: 'Kutilmoqda', paused: 'Toʻxtatilgan',
}

interface Draft {
  name: string
  sport_id: number | ''
  region_id: number | ''
  district_id: number | ''
  address: string
  latitude: string
  longitude: string
  courts: number
  admin_name: string
  admin_phone: string
  admin_email: string
}

const emptyDraft: Draft = {
  name: '', sport_id: '', region_id: '', district_id: '', address: '',
  latitude: '', longitude: '', courts: 1,
  admin_name: '', admin_phone: '', admin_email: '',
}

export default function Clubs() {
  const { sports, regions, districts } = useRefData()
  const [list, setList] = useState<ClubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [region, setRegion] = useState('all')
  const [district, setDistrict] = useState('all')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<ClubRow | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = (await getAdminClubs()).map((c) => adaptClub(c))
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
  const districtFilterOpts = useMemo(() => [
    { value: 'all', label: 'Barcha tumanlar' },
    ...districtOptionsForRegion(regions, districts, region),
  ], [regions, districts, region])

  const rows = useMemo(
    () => list.filter((c) =>
      (region === 'all' || c.region === region) &&
      (district === 'all' || c.district === district)),
    [list, region, district],
  )
  const { slice, page, pages, total, setPage } = usePagination(rows)

  const totalBookings = rows.reduce((s, c) => s + c.bookings, 0)
  const totalCourts = rows.reduce((s, c) => s + c.courts, 0)

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const formDistrictOpts = useMemo(
    () => districts.filter((d) => d.region_id === draft.region_id),
    [districts, draft.region_id],
  )

  const valid = draft.name.trim() && draft.address.trim() && draft.sport_id !== '' &&
    draft.admin_name.trim() && draft.admin_phone.trim()

  const save = async () => {
    if (!valid) return
    setSaving(true)
    setSaveErr(null)
    try {
      const body: ClubWrite = {
        name: draft.name.trim(),
        sport_id: Number(draft.sport_id),
        address: draft.address.trim(),
        courts: draft.courts,
        admin_name: draft.admin_name.trim(),
        admin_phone: draft.admin_phone.trim(),
        admin_email: draft.admin_email.trim() || undefined,
        ...(draft.region_id !== '' ? { region_id: Number(draft.region_id) } : {}),
        ...(draft.district_id !== '' ? { district_id: Number(draft.district_id) } : {}),
        ...(draft.latitude ? { latitude: draft.latitude } : {}),
        ...(draft.longitude ? { longitude: draft.longitude } : {}),
      }
      const created = adaptClub(await createAdminClub(body))
      setList((l) => [created, ...l])
      setAdding(false)
      setDraft(emptyDraft)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  // ---- Club detail page ----
  if (selected) return <ClubDetail club={selected} onBack={() => setSelected(null)} />

  return (
    <>
      <div className="toolbar">
        <Select label="Hudud" value={region} onChange={(v) => { setRegion(v); setDistrict('all'); setPage(1) }} options={regionOpts} />
        <Select label="Tuman" value={district} onChange={(v) => { setDistrict(v); setPage(1) }} options={districtFilterOpts} />
        <span className="count-note" style={{ alignSelf: 'flex-end', paddingBottom: 9 }}>
          {rows.length} ta klub · {totalCourts} ta maydon · {nf.format(totalBookings)} ta bron
        </span>
        <div className="field mla" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={() => { setDraft(emptyDraft); setSaveErr(null); setAdding(true) }}>
            <IcPlus /> Klub qoʻshish
          </button>
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
                <th>Klub</th><th>Sport</th><th>Hudud</th><th>Manzil</th>
                <th>Admin</th><th>Maydon</th><th>Bronlar</th><th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => setSelected(c)}>
                  <td>
                    <div className="cell-main">{c.name}</div>
                    <div className="cell-sub">CL-{c.id} · {c.since}</div>
                  </td>
                  <td><span className="tag">{c.sportName}</span></td>
                  <td className="cell-sub">{c.region}</td>
                  <td>
                    <div>{c.district}</div>
                    <div className="cell-sub">{c.address}</div>
                    {c.lat && c.lng && <div className="cell-sub" style={{ fontSize: 11 }}>{c.lat}, {c.lng}</div>}
                  </td>
                  <td>
                    <div className="cell-main">{c.admin.name || '—'}</div>
                    <div className="cell-sub">{c.admin.phone}</div>
                    <div className="cell-sub">{c.admin.email}</div>
                  </td>
                  <td>{c.courts}</td>
                  <td className="cell-main">{nf.format(c.bookings)}</td>
                  <td><span className={`pill ${c.status}`}>{c.statusLabel || statusLabel[c.status] || c.status}</span></td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty">{loading ? 'Yuklanmoqda…' : 'Klub topilmadi'}</div>
                </td></tr>
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
              <button className="btn primary" disabled={!valid || saving} onClick={save}>
                {saving ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
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
              <label>Sport turi *</label>
              <select className="select" value={draft.sport_id} onChange={(e) => set({ sport_id: e.target.value ? Number(e.target.value) : '' })}>
                <option value="">— tanlang —</option>
                {sports.map((s) => <option key={s.id} value={s.id}>{localized(s)}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Maydonlar soni</label>
              <input className="input" type="number" min={1} value={draft.courts} onChange={(e) => set({ courts: Number(e.target.value) })} />
            </div>

            <div className="form-section">Lokatsiya</div>
            <div className="field">
              <label>Viloyat (hudud)</label>
              <select className="select" value={draft.region_id} onChange={(e) => set({ region_id: e.target.value ? Number(e.target.value) : '', district_id: '' })}>
                <option value="">— tanlang —</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{localized(r)}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tuman</label>
              <select className="select" value={draft.district_id} disabled={draft.region_id === ''} onChange={(e) => set({ district_id: e.target.value ? Number(e.target.value) : '' })}>
                <option value="">— tanlang —</option>
                {formDistrictOpts.map((d) => <option key={d.id} value={d.id}>{localized(d)}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>Manzil (koʻcha, uy) *</label>
              <input className="input" value={draft.address} onChange={(e) => set({ address: e.target.value })} placeholder="Amir Temur koʻch. 108" />
            </div>
            <div className="field">
              <label>Kenglik (lat)</label>
              <input className="input" value={draft.latitude} onChange={(e) => set({ latitude: e.target.value })} placeholder="41.3111" />
            </div>
            <div className="field">
              <label>Uzunlik (lng)</label>
              <input className="input" value={draft.longitude} onChange={(e) => set({ longitude: e.target.value })} placeholder="69.2797" />
            </div>

            <div className="form-section">Admin kontaktlari</div>
            <div className="field full">
              <label>Admin F.I.Sh. *</label>
              <input className="input" value={draft.admin_name} onChange={(e) => set({ admin_name: e.target.value })} placeholder="Masʼul shaxs ismi" />
            </div>
            <div className="field">
              <label>Telefon *</label>
              <input className="input" value={draft.admin_phone} onChange={(e) => set({ admin_phone: e.target.value })} placeholder="+998 90 123 45 67" />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={draft.admin_email} onChange={(e) => set({ admin_email: e.target.value })} placeholder="admin@club.uz" />
            </div>
            {saveErr && <div className="field full"><div className="login-error">{saveErr}</div></div>}
          </div>
        </Modal>
      )}
    </>
  )
}

// ---- Club detail sub-view (loads real club members) ----
function ClubDetail({ club: c, onBack }: { club: ClubRow; onBack: () => void }) {
  const [members, setMembers] = useState<ApiUserPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const m = await getAdminClubPlayers(c.id)
        if (alive) setMembers(m)
      } catch {
        if (alive) setMembers([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [c.id])

  return (
    <>
      <button className="back-btn" onClick={onBack}>
        <IcArrowLeft /> Klublar roʻyxatiga qaytish
      </button>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="detail-head">
          <div className="pin" style={{
            width: 56, height: 56, borderRadius: 14, flex: 'none',
            display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700,
            background: 'var(--panel-2)', border: '1px solid var(--border-2)',
          }}>{c.name.charAt(0).toUpperCase()}</div>
          <div className="dh-main">
            <div className="dh-name">{c.name}</div>
            <div className="dh-sub">
              CL-{c.id} · <span className={`pill ${c.status}`}>{c.statusLabel}</span> · {c.sportName}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '18px 0' }}>
          <div className="stat-mini"><b>{c.courts}</b><span>Maydonlar</span></div>
          <div className="stat-mini"><b>{nf.format(c.bookings)}</b><span>Bronlar</span></div>
          <div className="stat-mini"><b>{c.since || '—'}</b><span>Hamkorlikdan beri</span></div>
        </div>

        <div className="section-label">Lokatsiya</div>
        <div className="kv" style={{ margin: '8px 0 20px' }}>
          <div><div className="k">Viloyat</div><div className="v">{c.region}</div></div>
          <div><div className="k">Tuman</div><div className="v">{c.district || '—'}</div></div>
          <div className="full"><div className="k">Manzil</div><div className="v">{c.address}</div></div>
          {c.lat && c.lng && <div><div className="k">Koordinatalar</div><div className="v">{c.lat}, {c.lng}</div></div>}
        </div>

        <div className="section-label">Admin kontaktlari</div>
        <div className="kv" style={{ margin: '8px 0 4px' }}>
          <div><div className="k">Masʼul shaxs</div><div className="v">{c.admin.name || '—'}</div></div>
          <div><div className="k">Telefon</div><div className="v">{c.admin.phone || '—'}</div></div>
          <div className="full"><div className="k">Email</div><div className="v">{c.admin.email || '—'}</div></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-h" style={{ marginBottom: 12 }}>
          <h3>Klub oʻyinchilari</h3>
          <span className="sub">{members.length} ta</span>
        </div>
        {loading ? (
          <div className="empty">Yuklanmoqda…</div>
        ) : members.length === 0 ? (
          <div className="empty">Oʻyinchi topilmadi</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {members.map((p) => (
              <div key={p.id} className="name-cell">
                <Avatar name={userName(p)} colors={avatarFor(p.id)} size={30} />
                <div style={{ marginLeft: 10 }}>
                  <div className="cell-main">{userName(p)}</div>
                  <div className="cell-sub">#{p.id}{p.username ? ` · @${p.username}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
