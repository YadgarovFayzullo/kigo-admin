import { useEffect, useMemo, useState } from 'react'
import { type SportId } from '../data'
import { IcSearch, IcDownload, IcBlock, IcUnlock } from '../icons'
import { Avatar, Select, Pager, usePagination, Modal } from '../ui'
import {
  getAdminPlayers, blockAdminPlayer, unblockAdminPlayer,
} from '../api/endpoints'
import {
  adaptPlayer, sportDisplay, localized, type PlayerRow, type PlayerStatus,
} from '../api/adapters'
import { useRefData, districtOptionsForRegion } from '../api/refData'

const statusUz: Record<PlayerStatus, string> = {
  active: 'Faol', blocked: 'Bloklangan', pending: 'Kutilmoqda',
}

export default function Players({ initialSport = null }: { initialSport?: SportId | null }) {
  const { sports, regions, districts } = useRefData()
  const [list, setList] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [region, setRegion] = useState('all')
  const [district, setDistrict] = useState('all')
  const [gender, setGender] = useState('all')
  const [sport, setSport] = useState<string>(initialSport ?? 'all')
  const [confirm, setConfirm] = useState<PlayerRow | null>(null) // pending block/unblock
  const [busyId, setBusyId] = useState<number | null>(null)
  const [profile, setProfile] = useState<PlayerRow | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const rows = (await getAdminPlayers()).map((p) => adaptPlayer(p))
        if (alive) { setList(rows); setError(null) }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Yuklashda xatolik')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const sportOpts = useMemo(() => [
    { value: 'all', label: 'Barcha sportlar' },
    ...sports.map((s) => { const d = sportDisplay(s); return { value: d.code, label: d.name } }),
  ], [sports])
  const regionOpts = useMemo(() => [
    { value: 'all', label: 'Barcha hududlar' },
    ...regions.map((r) => ({ value: localized(r), label: localized(r) })),
  ], [regions])
  const districtOpts = useMemo(() => [
    { value: 'all', label: 'Barcha tumanlar' },
    ...districtOptionsForRegion(regions, districts, region),
  ], [regions, districts, region])

  // Block a user, or restore a blocked one — persisted server-side.
  const toggleBlock = async (p: PlayerRow) => {
    setBusyId(p.id)
    try {
      const updated = p.status === 'blocked'
        ? await unblockAdminPlayer(p.id)
        : await blockAdminPlayer(p.id)
      const row = adaptPlayer(updated)
      setList((l) => l.map((x) => (x.id === row.id ? row : x)))
      setConfirm(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Amalni bajarishda xatolik')
    } finally {
      setBusyId(null)
    }
  }

  const rows = useMemo(() => list.filter((p) => {
    if (status !== 'all' && p.status !== status) return false
    if (region !== 'all' && p.region !== region) return false
    if (district !== 'all' && p.district !== district) return false
    if (gender !== 'all' && p.gender !== gender) return false
    if (sport !== 'all' && p.sport !== sport) return false
    if (q && !`${p.name} ${p.phone} ${p.district} ${p.id}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [list, q, status, region, district, gender, sport])

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
        <Select label="Hudud" value={region} onChange={(v) => { setRegion(v); setDistrict('all'); setPage(1) }} options={regionOpts} />
        <Select label="Tuman" value={district} onChange={(v) => { setDistrict(v); setPage(1) }} options={districtOpts} />
        <Select label="Jins" value={gender} onChange={(v) => { setGender(v); setPage(1) }} options={[
          { value: 'all', label: 'Barchasi' },
          { value: 'male', label: 'Erkak' },
          { value: 'female', label: 'Ayol' },
        ]} />
        <div className="field">
          <label>Qidiruv</label>
          <div className="search" style={{ margin: 0, width: 230 }}>
            <IcSearch className="ic" />
            <input placeholder="Ism, ID, telefon…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
        </div>
        <div className="field mla" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost"><IcDownload /> Eksport</button>
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
                        <div className="cell-sub">#{p.id}{p.joined ? ` · ${p.joined}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: p.gender === 'female' ? '#ff5c9d' : '#4c9dff', fontWeight: 700 }}>
                      {p.gender === 'female' ? '♀' : '♂'}
                    </span>{' '}
                    {p.gender === 'female' ? 'Ayol' : 'Erkak'}
                  </td>
                  <td>{p.age || '—'}</td>
                  <td className="cell-sub">{p.phone}</td>
                  <td>{p.sport ? <span className="tag">{p.sportName}</span> : <span className="cell-sub">—</span>}</td>
                  <td><span className="lvl">{p.level.toFixed(1)}</span></td>
                  <td>{p.matches}</td>
                  <td>{p.rating ? p.rating.toFixed(0) : '—'}</td>
                  <td className="cell-sub">{p.region}<br /><span style={{ fontSize: 11 }}>{p.district}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`pill ${p.status}`}>{statusUz[p.status]}</span>
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
                <tr><td colSpan={10}>
                  <div className="empty">{loading ? 'Yuklanmoqda…' : 'Hech narsa topilmadi'}</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} total={total} onChange={setPage} />
      </div>

      {profile && (
        <Modal
          title="Oʻyinchi profili"
          onClose={() => setProfile(null)}
          footer={
            profile.status === 'blocked' ? (
              <button className="btn primary" onClick={() => { setConfirm(profile); setProfile(null) }}>
                <IcUnlock /> Blokdan chiqarish
              </button>
            ) : (
              <button className="btn danger-solid" onClick={() => { setConfirm(profile); setProfile(null) }}>
                <IcBlock /> Bloklash
              </button>
            )
          }
        >
          <div className="detail-head">
            <Avatar name={profile.name} colors={profile.avatar} size={56} />
            <div className="dh-main">
              <div className="dh-name">{profile.name}</div>
              <div className="dh-sub">
                #{profile.id} · <span className={`pill ${profile.status}`}>{statusUz[profile.status]}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '16px 0' }}>
            <div className="stat-mini"><b>{profile.matches}</b><span>Matchlar</span></div>
            <div className="stat-mini"><b>{profile.noShows}</b><span>Kelmagan</span></div>
            <div className="stat-mini"><b>{profile.rating ? profile.rating.toFixed(0) : '—'}</b><span>Reyting</span></div>
          </div>

          <div className="kv">
            <div>
              <div className="k">Sport turi</div>
              <div className="v">{profile.sport ? profile.sportName : '—'}</div>
            </div>
            <div>
              <div className="k">Daraja</div>
              <div className="v">{profile.level.toFixed(1)}</div>
            </div>
            <div>
              <div className="k">Ishonch darajasi</div>
              <div className="v">{profile.trust || '—'}</div>
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
              <div className="v">{profile.age || '—'}</div>
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
              <div className="v">{profile.joined || '—'}</div>
            </div>
          </div>
        </Modal>
      )}

      {confirm && (() => {
        const isBlocked = confirm.status === 'blocked'
        const busy = busyId === confirm.id
        return (
          <Modal
            title={isBlocked ? 'Oʻyinchini blokdan chiqarish' : 'Oʻyinchini bloklash'}
            onClose={() => setConfirm(null)}
            footer={
              <>
                <button className="btn ghost" onClick={() => setConfirm(null)}>Bekor qilish</button>
                {isBlocked ? (
                  <button className="btn primary" disabled={busy} onClick={() => toggleBlock(confirm)}>
                    <IcUnlock /> {busy ? 'Bajarilmoqda…' : 'Ha, blokdan chiqarish'}
                  </button>
                ) : (
                  <button className="btn danger-solid" disabled={busy} onClick={() => toggleBlock(confirm)}>
                    <IcBlock /> {busy ? 'Bajarilmoqda…' : 'Ha, bloklash'}
                  </button>
                )}
              </>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={confirm.name} colors={confirm.avatar} size={40} />
              <div>
                <div className="cell-main">{confirm.name}</div>
                <div className="cell-sub">#{confirm.id} · {confirm.phone}</div>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 0, marginTop: 16 }}>
              {isBlocked
                ? 'Ushbu oʻyinchini blokdan chiqarmoqchimisiz? U yana ilovaga kira oladi va matchlarda koʻrinadi.'
                : 'Ushbu oʻyinchini bloklamoqchimisiz? U ilovaga kira olmaydi va matchlarda koʻrinmaydi. Bu amalni keyinroq bekor qilishingiz mumkin.'}
            </p>
            {saveErr && <div className="login-error" style={{ marginTop: 12 }}>{saveErr}</div>}
          </Modal>
        )
      })()}
    </>
  )
}
