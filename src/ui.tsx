import { useState, type ReactNode } from 'react'

export const initials = (n: string) =>
  n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

/** Round gradient logo/avatar rendered from a name + two color stops. */
export function Avatar({
  name, colors, size = 34,
}: { name: string; colors: [string, string]; size?: number }) {
  return (
    <span
      className="ava"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
    >
      {initials(name)}
    </span>
  )
}

/** Labeled <select> dropdown. */
export function Select({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export const PAGE_SIZE = 15

/** Slice + render a page control. Returns the current page slice. */
export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const slice = items.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  return { slice, page: cur, pages, setPage, total: items.length }
}

export function Pager({
  page, pages, total, onChange,
}: { page: number; pages: number; total: number; onChange: (p: number) => void }) {
  if (total === 0) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  // Compact page-number window around the current page.
  const nums: (number | '...')[] = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p)
    else if (nums.at(-1) !== '...') nums.push('...')
  }

  return (
    <div className="pager">
      <span className="pinfo">{from}–{to} / {total}</span>
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {nums.map((n, i) =>
        n === '...' ? (
          <span className="dots" key={`d${i}`}>…</span>
        ) : (
          <button key={n} className={n === page ? 'on' : ''} onClick={() => onChange(n)}>{n}</button>
        ),
      )}
      <button disabled={page === pages} onClick={() => onChange(page + 1)}>›</button>
    </div>
  )
}

export function Modal({
  title, onClose, children, footer,
}: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  )
}
