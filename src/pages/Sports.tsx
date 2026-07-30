import { useEffect, useState } from 'react'
import { type Sport, type SportId } from '../data'
import { IcPlus } from '../icons'
import { Modal } from '../ui'
import { getAdminSports, getSports, createAdminSport, setAdminSportActive } from '../api/endpoints'
import { adaptSport } from '../api/adapters'
import { invalidateRefData } from '../api/refData'
import type { AdminSport } from '../api/types'

const nf = new Intl.NumberFormat('ru-RU')

const emptyDraft = { code: '', name_uz: '', name_ru: '', name_en: '', is_active: true }

// `code` is the sport's only required field and its primary key in the app
// (Sport.id), so it must be a latin slug: max 50 chars, no spaces.
const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[ʻʼ‘’'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

export default function Sports({ onOpenSport }: { onOpenSport: (id: SportId) => void }) {
  const [list, setList] = useState<Sport[]>([])
  // Sport.id is the code; PATCH /admin/sports/{id}/ needs the numeric pk.
  const [pkByCode, setPkByCode] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [codeEdited, setCodeEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const remember = (rows: { id: number; code: string }[]) =>
    setPkByCode((m) => ({ ...m, ...Object.fromEntries(rows.map((r) => [r.code, r.id])) }))

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // Admin endpoint carries player counts + active flag; fall back to the
        // public dictionary (names only) when there's no token.
        let api: (AdminSport | { id: number; code: string })[]
        try {
          api = await getAdminSports()
        } catch {
          api = await getSports()
        }
        if (alive) {
          setList(api.map((s) => adaptSport(s as AdminSport)))
          remember(api)
          setError(null)
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Yuklashda xatolik')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // Show/hide a sport in the app — persisted via PATCH, rolled back on failure.
  const toggle = async (s: Sport) => {
    const pk = pkByCode[s.id]
    if (pk === undefined) { setError('Sport turi identifikatori topilmadi'); return }
    const next = !s.active
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, active: next } : x)))
    setError(null)
    try {
      const updated = await setAdminSportActive(pk, next)
      setList((l) => l.map((x) => (x.id === s.id ? adaptSport(updated) : x)))
      invalidateRefData() // sport dropdowns elsewhere carry the active flag
    } catch (e) {
      setList((l) => l.map((x) => (x.id === s.id ? { ...x, active: s.active } : x)))
      setError(e instanceof Error ? e.message : 'Holatni saqlashda xatolik')
    }
  }

  const draftCode = draft.code || slugify(draft.name_uz)

  const save = async () => {
    if (!draftCode) return
    setSaving(true)
    setSaveErr(null)
    try {
      const created = await createAdminSport({
        code: draftCode,
        // Send only the names that were filled in — all three are optional.
        ...(draft.name_uz.trim() ? { name_uz: draft.name_uz.trim() } : {}),
        ...(draft.name_ru.trim() ? { name_ru: draft.name_ru.trim() } : {}),
        ...(draft.name_en.trim() ? { name_en: draft.name_en.trim() } : {}),
        is_active: draft.is_active,
      })
      setList((l) => [...l, adaptSport(created)])
      remember([created])
      // Refresh the shared dictionaries so the new sport shows up in the
      // filters and the club form without a page reload.
      invalidateRefData()
      setAdding(false)
      setDraft(emptyDraft)
      setCodeEdited(false)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const closeAdd = () => {
    setAdding(false)
    setDraft(emptyDraft)
    setCodeEdited(false)
    setSaveErr(null)
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
              onClick={(e) => { e.stopPropagation(); toggle(s) }}
              aria-label="toggle"
            />
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
          onClose={closeAdd}
          footer={
            <>
              <button className="btn ghost" onClick={closeAdd}>Bekor qilish</button>
              <button className="btn primary" disabled={saving || !draftCode} onClick={save}>
                {saving ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="field full">
              <label>Nomi (oʻzbekcha) *</label>
              <input
                className="input"
                value={draft.name_uz}
                maxLength={255}
                onChange={(e) => {
                  const name_uz = e.target.value
                  setDraft((d) => ({ ...d, name_uz, code: codeEdited ? d.code : slugify(name_uz) }))
                }}
                placeholder="Masalan: Golf"
              />
            </div>
            <div className="field full">
              <label>Kod (code) *</label>
              <input
                className="input"
                value={draft.code}
                maxLength={50}
                onChange={(e) => {
                  setCodeEdited(true)
                  setDraft((d) => ({ ...d, code: slugify(e.target.value) }))
                }}
                placeholder={slugify(draft.name_uz) || 'golf'}
              />
              <span className="cell-sub">
                Lotin harflari, boʻshliqsiz — oʻzgartirilmaydi. Nomdan avtomatik yasaladi.
              </span>
            </div>
            <div className="field">
              <label>Nomi (ruscha)</label>
              <input
                className="input"
                value={draft.name_ru}
                maxLength={255}
                onChange={(e) => setDraft((d) => ({ ...d, name_ru: e.target.value }))}
                placeholder="Гольф"
              />
            </div>
            <div className="field">
              <label>Nomi (inglizcha)</label>
              <input
                className="input"
                value={draft.name_en}
                maxLength={255}
                onChange={(e) => setDraft((d) => ({ ...d, name_en: e.target.value }))}
                placeholder="Golf"
              />
            </div>
            <div className="field full" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className={`toggle ${draft.is_active ? 'on' : ''}`}
                onClick={() => setDraft((d) => ({ ...d, is_active: !d.is_active }))}
                aria-label="toggle"
                aria-pressed={draft.is_active}
              />
              <label style={{ margin: 0 }}>
                {draft.is_active ? 'Ilovada koʻrinadi' : 'Yashirilgan'}
              </label>
            </div>
          </div>
          {saveErr && <div className="login-error" style={{ marginTop: 14 }}>{saveErr}</div>}
        </Modal>
      )}
    </>
  )
}
