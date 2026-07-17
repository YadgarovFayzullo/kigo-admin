import { useEffect, useState } from 'react'
import { type Sport, type SportId } from '../data'
import { IcPlus } from '../icons'
import { Modal } from '../ui'
import { getAdminSports, getSports } from '../api/endpoints'
import { adaptSport } from '../api/adapters'

const nf = new Intl.NumberFormat('ru-RU')

const emptySport = { name: '', emoji: '🏅', kind: 'solo' as Sport['kind'] }

export default function Sports({ onOpenSport }: { onOpenSport: (id: SportId) => void }) {
  const [list, setList] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(emptySport)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // Admin endpoint carries player counts + active flag; fall back to the
        // public dictionary (names only) when there's no token.
        let sports: Sport[]
        try {
          sports = (await getAdminSports()).map((s) => adaptSport(s))
        } catch {
          sports = (await getSports()).map((s) => adaptSport(s))
        }
        if (alive) { setList(sports); setError(null) }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Yuklashda xatolik')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const toggle = (id: string) =>
    setList((l) => l.map((s) => (s.id === id ? { ...s, active: !s.active } : s)))

  const save = () => {
    const id = (draft.name.toLowerCase().replace(/\s+/g, '-') || `sport-${list.length}`) as SportId
    setList((l) => [...l, {
      id, name: draft.name, emoji: draft.emoji || '🏅',
      kind: draft.kind, players: 0, active: true,
    }])
    setAdding(false)
    setDraft(emptySport)
  }

  const activeCount = list.filter((s) => s.active).length

  return (
    <>
      <div className="toolbar">
        <span className="count-note">
          {activeCount} ta faol · {list.length} ta jami sport turi
        </span>
        <button className="btn primary mla" onClick={() => setAdding(true)}>
          <IcPlus /> Sport turi qoʻshish
        </button>
      </div>

      {loading && <div className="count-note" style={{ padding: '24px 4px' }}>Yuklanmoqda…</div>}
      {error && !loading && (
        <div className="count-note" style={{ padding: '24px 4px', color: '#ff5c6a' }}>
          Xatolik: {error}
        </div>
      )}

      <div className="sport-grid">
        {list.map((s) => (
          <div
            className="sport-card clickable"
            key={s.id}
            onClick={() => onOpenSport(s.id)}
            title={`${s.name} boʻyicha oʻyinchilar`}
          >
            <button
              className={`toggle ${s.active ? 'on' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggle(s.id) }}
              aria-label="toggle"
            />
            <div className="emoji">{s.emoji}</div>
            <div className="sname">{s.name}</div>
            <div className="smeta">{s.kind === 'team' ? 'Jamoaviy' : 'Yakkama-yakka'}</div>
            <div className="splayers">{nf.format(s.players)}</div>
            <div className="smeta">oʻyinchi · {s.active ? 'ilovada koʻrinadi' : 'yashirilgan'}</div>
          </div>
        ))}
      </div>

      {adding && (
        <Modal
          title="Yangi sport turi qoʻshish"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setAdding(false)}>Bekor qilish</button>
              <button className="btn primary" disabled={!draft.name.trim()} onClick={save}>Saqlash</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="field" style={{ maxWidth: 90 }}>
              <label>Emoji</label>
              <input className="input" value={draft.emoji} maxLength={4} onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))} placeholder="⚽️" />
            </div>
            <div className="field">
              <label>Nomi *</label>
              <input className="input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Masalan: Golf" />
            </div>
            <div className="field full">
              <label>Turi</label>
              <select className="select" value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as Sport['kind'] }))}>
                <option value="solo">Yakkama-yakka</option>
                <option value="team">Jamoaviy</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
