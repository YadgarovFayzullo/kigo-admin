import { useMemo, useState } from 'react'
import { players as seed, regions, sports, sportEmoji, sportName, type Player, type SportId } from '../data'
import { IcSearch, IcDownload, IcPlus, IcBlock, IcUnlock } from '../icons'
import { statusUz } from './Dashboard'
import { Avatar, Select, Pager, usePagination, Modal } from '../ui'

const regionOpts = [{ value: 'all', label: 'Barcha hududlar' },
  ...regions.map((r) => ({ value: r, label: r }))]
const sportOpts = [{ value: 'all', label: 'Barcha sportlar' },
  ...sports.map((s) => ({ value: s.id, label: `${s.emoji} ${s.name}` }))]

const emptyPlayer: Omit<Player, 'id'> = {
  name: '', phone: '', gender: 'male', age: 18,
  region: regions[0], district: '', avatar: ['#c6ff3d', '#34d17a'],
  sport: 'football', level: 5, matches: 0, rating: 5,
  status: 'pending', joined: new Date().toISOString().slice(0, 10),
}

export default function Players({ initialSport = null }: { initialSport?: SportId | null }) {
  const [list, setList] = useState<Player[]>(seed)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [region, setRegion] = useState('all')
  const [gender, setGender] = useState('all')
  const [sport, setSport] = useState<string>(initialSport ?? 'all')
  const [confirm, setConfirm] = useState<Player | null>(null) // player pending block
  const [profile, setProfile] = useState<Player | null>(null) // player card view
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(emptyPlayer)

  const setD = (patch: Partial<Player>) => setDraft((d) => ({ ...d, ...patch }))
  const savePlayer = () => {
    setList((l) => [
      { ...draft, id: `PL-${1000 + l.length}` },
      ...l,
    ])
    setAdding(false)
    setDraft(emptyPlayer)
  }
  const validPlayer = draft.name.trim() && draft.phone.trim()

  // Block a user, or restore a blocked one back to active.
  const toggleBlock = (id: string) =>
    setList((l) => l.map((p) =>
      p.id === id
        ? { ...p, status: p.status === 'blocked' ? 'active' : 'blocked' }
        : p,
    ))

  const rows = useMemo(() => {
    return list.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (region !== 'all' && p.region !== region) return false
      if (gender !== 'all' && p.gender !== gender) return false
      if (sport !== 'all' && p.sport !== sport) return false
      if (q && !`${p.name} ${p.phone} ${p.district} ${p.id}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [list, q, status, region, gender, sport])

  const { slice, page, pages, total, setPage } = usePagination(rows)

  return (
    <>
      <div className="toolbar">
        <Select label="Holat" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[
          { value: 'all', label: 'Hammasi' },
          { value: 'active', label: 'Faol' },
          { value: 'pending', label: 'Kutilmoqda' },
          { value: 'blocked', label: 'Bloklangan' },
        ]} />
        <Select label="Sport" value={sport} onChange={(v) => { setSport(v); setPage(1) }} options={sportOpts} />
        <Select label="Hudud" value={region} onChange={(v) => { setRegion(v); setPage(1) }} options={regionOpts} />
        <Select label="Jins" value={gender} onChange={(v) => { setGender(v); setPage(1) }} options={[
          { value: 'all', label: 'Barchasi' },
          { value: 'male', label: 'Erkak' },
          { value: 'female', label: 'Ayol' },
        ]} />
        <div className="field">
          <label>Qidiruv</label>
          <div className="search" style={{ margin: 0, width: 230 }}>
            <IcSearch className="ic" />
            <input placeholder="Ism, ID (PL-1000), telefon…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
        </div>
        <div className="field mla" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost"><IcDownload /> Eksport</button>
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={() => setAdding(true)}><IcPlus /> Qoʻshish</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Oʻyinchi</th><th>Jins</th><th>Yosh</th><th>Telefon</th>
                <th>Sport</th><th>Daraja</th><th>Matchlar</th><th>Reyting</th>
                <th>Hudud</th><th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="name-cell linkish" onClick={() => setProfile(p)} title="Profilni koʻrish">
                      <Avatar name={p.name} colors={p.avatar} size={32} />
                      <div style={{ marginLeft: 10 }}>
                        <div className="cell-main">{p.name}</div>
                        <div className="cell-sub">{p.id} · {p.joined}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: p.gender === 'female' ? '#ff5c9d' : '#4c9dff', fontWeight: 700 }}>
                      {p.gender === 'female' ? '♀' : '♂'}
                    </span>{' '}
                    {p.gender === 'female' ? 'Ayol' : 'Erkak'}
                  </td>
                  <td>{p.age}</td>
                  <td className="cell-sub">{p.phone}</td>
                  <td><span className="tag">{sportEmoji(p.sport)} {sportName(p.sport)}</span></td>
                  <td><span className="lvl">{p.level.toFixed(1)}</span></td>
                  <td>{p.matches}</td>
                  <td>⭐ {p.rating.toFixed(1)}</td>
                  <td className="cell-sub">{p.region}<br /><span style={{ fontSize: 11 }}>{p.district}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`pill ${p.status}`}>{statusUz(p.status)}</span>
                      {p.status === 'blocked' ? (
                        <button className="icon-act" title="Blokdan chiqarish" onClick={() => setConfirm(p)}>
                          <IcUnlock />
                        </button>
                      ) : (
                        <button className="icon-act danger" title="Bloklash" onClick={() => setConfirm(p)}>
                          <IcBlock />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={10}><div className="empty">Hech narsa topilmadi</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} total={total} onChange={setPage} />
      </div>

      {adding && (
        <Modal
          title="Yangi oʻyinchi qoʻshish"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setAdding(false)}>Bekor qilish</button>
              <button className="btn primary" disabled={!validPlayer} onClick={savePlayer}>Saqlash</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="field full">
              <label>Ism familiya *</label>
              <input className="input" value={draft.name} onChange={(e) => setD({ name: e.target.value })} placeholder="Masalan: Sardor U." />
            </div>
            <div className="field">
              <label>Telefon *</label>
              <input className="input" value={draft.phone} onChange={(e) => setD({ phone: e.target.value })} placeholder="+998 90 123 45 67" />
            </div>
            <div className="field">
              <label>Jins</label>
              <select className="select" value={draft.gender} onChange={(e) => setD({ gender: e.target.value as Player['gender'] })}>
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
            </div>
            <div className="field">
              <label>Yosh</label>
              <input className="input" type="number" min={10} max={90} value={draft.age} onChange={(e) => setD({ age: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Sport turi</label>
              <select className="select" value={draft.sport} onChange={(e) => setD({ sport: e.target.value as Player['sport'] })}>
                {sports.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Daraja (1–10)</label>
              <input className="input" type="number" min={1} max={10} step={0.1} value={draft.level} onChange={(e) => setD({ level: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label>Viloyat</label>
              <select className="select" value={draft.region} onChange={(e) => setD({ region: e.target.value })}>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tuman</label>
              <input className="input" value={draft.district} onChange={(e) => setD({ district: e.target.value })} placeholder="Tuman nomi" />
            </div>
            <div className="field full">
              <label>Holat</label>
              <select className="select" value={draft.status} onChange={(e) => setD({ status: e.target.value as Player['status'] })}>
                <option value="pending">Kutilmoqda</option>
                <option value="active">Faol</option>
                <option value="blocked">Bloklangan</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {profile && (
        <Modal
          title="Oʻyinchi profili"
          onClose={() => setProfile(null)}
          footer={
            <>
              {profile.status === 'blocked' ? (
                <button className="btn primary" onClick={() => { setConfirm(profile); setProfile(null) }}>
                  <IcUnlock /> Blokdan chiqarish
                </button>
              ) : (
                <button className="btn danger-solid" onClick={() => { setConfirm(profile); setProfile(null) }}>
                  <IcBlock /> Bloklash
                </button>
              )}
            </>
          }
        >
          <div className="detail-head">
            <Avatar name={profile.name} colors={profile.avatar} size={56} />
            <div className="dh-main">
              <div className="dh-name">{profile.name}</div>
              <div className="dh-sub">
                {profile.id} · <span className={`pill ${profile.status}`}>{statusUz(profile.status)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '16px 0' }}>
            <div className="stat-mini"><b>{profile.matches}</b><span>Matchlar</span></div>
            <div className="stat-mini"><b>{profile.level.toFixed(1)}</b><span>Daraja</span></div>
            <div className="stat-mini"><b>⭐ {profile.rating.toFixed(1)}</b><span>Reyting</span></div>
          </div>

          <div className="kv">
            <div>
              <div className="k">Sport turi</div>
              <div className="v">{sportEmoji(profile.sport)} {sportName(profile.sport)}</div>
            </div>
            <div>
              <div className="k">Jins</div>
              <div className="v">
                <span style={{ color: profile.gender === 'female' ? '#ff5c9d' : '#4c9dff' }}>
                  {profile.gender === 'female' ? '♀' : '♂'}
                </span>{' '}
                {profile.gender === 'female' ? 'Ayol' : 'Erkak'}
              </div>
            </div>
            <div>
              <div className="k">Yosh</div>
              <div className="v">{profile.age}</div>
            </div>
            <div>
              <div className="k">Telefon</div>
              <div className="v">{profile.phone}</div>
            </div>
            <div>
              <div className="k">Hudud</div>
              <div className="v">{profile.region}</div>
            </div>
            <div>
              <div className="k">Tuman</div>
              <div className="v">{profile.district || '—'}</div>
            </div>
            <div>
              <div className="k">Roʻyxatdan oʻtgan</div>
              <div className="v">{profile.joined}</div>
            </div>
          </div>
        </Modal>
      )}

      {confirm && (() => {
        const isBlocked = confirm.status === 'blocked'
        return (
          <Modal
            title={isBlocked ? 'Oʻyinchini blokdan chiqarish' : 'Oʻyinchini bloklash'}
            onClose={() => setConfirm(null)}
            footer={
              <>
                <button className="btn ghost" onClick={() => setConfirm(null)}>Bekor qilish</button>
                {isBlocked ? (
                  <button
                    className="btn primary"
                    onClick={() => { toggleBlock(confirm.id); setConfirm(null) }}
                  >
                    <IcUnlock /> Ha, blokdan chiqarish
                  </button>
                ) : (
                  <button
                    className="btn danger-solid"
                    onClick={() => { toggleBlock(confirm.id); setConfirm(null) }}
                  >
                    <IcBlock /> Ha, bloklash
                  </button>
                )}
              </>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={confirm.name} colors={confirm.avatar} size={40} />
              <div>
                <div className="cell-main">{confirm.name}</div>
                <div className="cell-sub">{confirm.id} · {confirm.phone}</div>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 0, marginTop: 16 }}>
              {isBlocked
                ? 'Ushbu oʻyinchini blokdan chiqarmoqchimisiz? U yana ilovaga kira oladi va matchlarda koʻrinadi.'
                : 'Ushbu oʻyinchini bloklamoqchimisiz? U ilovaga kira olmaydi va matchlarda koʻrinmaydi. Bu amalni keyinroq bekor qilishingiz mumkin.'}
            </p>
          </Modal>
        )
      })()}
    </>
  )
}
