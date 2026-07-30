import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Klub joylashuvini tanlash uchun interaktiv xarita.
 *
 * Asosiy rejim — Google Maps JS API (VITE_GOOGLE_MAPS_KEY kaliti talab qilinadi).
 * Kalit boʻlmasa yoki skript yuklanmasa — kutubxonasiz OpenStreetMap plitkali
 * xaritaga avtomatik oʻtadi. Ikkala rejimda ham: surish, masshtab, bosib nuqta tanlash.
 */

const GOOGLE_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) || ''

const TILE = 256
const MIN_Z = 3
const MAX_Z = 19
const DEFAULT_CENTER = { lat: 41.3111, lng: 69.2797 } // Toshkent

export interface LatLng { lat: number; lng: number }

// ---------- Web Mercator ----------
function project({ lat, lng }: LatLng, z: number) {
  const s = TILE * 2 ** z
  const sin = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((lng + 180) / 360) * s,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s,
  }
}

function unproject(x: number, y: number, z: number): LatLng {
  const s = TILE * 2 ** z
  const n = Math.PI - (2 * Math.PI * y) / s
  return {
    lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
    lng: (x / s) * 360 - 180,
  }
}

const fmt = (n: number) => n.toFixed(6)
const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z))

const PIN_SVG =
  '<svg width="26" height="34" viewBox="0 0 26 34" fill="none">' +
  '<path d="M13 33S25 20.6 25 13A12 12 0 1 0 1 13c0 7.6 12 20 12 20Z" ' +
  'fill="var(--accent)" stroke="var(--accent-ink)" stroke-width="1.5"/>' +
  '<circle cx="13" cy="13" r="4.5" fill="var(--accent-ink)"/></svg>'

// ---------- Google Maps JS API (minimal turlar) ----------
interface GLatLng { lat(): number; lng(): number }
interface GMapMouseEvent { latLng?: GLatLng | null }
interface GMap {
  setCenter(c: LatLng): void
  setZoom(z: number): void
  getCenter?(): GLatLng | undefined
  getZoom?(): number | undefined
  addListener(event: string, cb: (e: GMapMouseEvent) => void): unknown
}
interface GMarker {
  setPosition(p: LatLng): void
  setMap(map: GMap | null): void
  getPosition(): GLatLng | null | undefined
  addListener(event: string, cb: (e: GMapMouseEvent) => void): unknown
}
interface GGeocoderResult { formatted_address?: string; geometry?: { location?: GLatLng } }
interface GoogleMaps {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap
  Marker: new (opts: Record<string, unknown>) => GMarker
  Point: new (x: number, y: number) => unknown
  Size: new (w: number, h: number) => unknown
  Geocoder: new () => { geocode(req: { address: string }): Promise<{ results: GGeocoderResult[] }> }
}

declare global {
  interface Window {
    google?: { maps?: GoogleMaps }
    __kigoMapsReady?: () => void
  }
}

let gmapsPromise: Promise<GoogleMaps> | null = null

function loadGoogleMaps(): Promise<GoogleMaps> {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (gmapsPromise) return gmapsPromise
  gmapsPromise = new Promise<GoogleMaps>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(GOOGLE_KEY)}&v=weekly&language=uz&region=UZ` +
      '&loading=async&callback=__kigoMapsReady'
    s.async = true
    window.__kigoMapsReady = () => {
      const m = window.google?.maps
      if (m) resolve(m)
      else reject(new Error('google.maps topilmadi'))
    }
    s.onerror = () => reject(new Error('Google Maps yuklanmadi'))
    document.head.appendChild(s)
  }).catch((e) => { gmapsPromise = null; throw e })
  return gmapsPromise
}

const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light'

// Google xaritasining qorongʻi uslubi (admin paneli standart holatda qorongʻi)
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a2430' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8797a8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#10161e' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2e3c4c' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#16241c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#24303d' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2e3c4c' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a4b5e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#202a36' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b141d' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#41556b' }] },
]

// Marker belgisi — SVG data URI (CSS oʻzgaruvchilari bu yerda ishlamaydi)
const PIN_DATA_URI =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">' +
    '<path d="M13 33S25 20.6 25 13A12 12 0 1 0 1 13c0 7.6 12 20 12 20Z" ' +
    'fill="#c6ff3d" stroke="#0b0f14" stroke-width="1.5"/>' +
    '<circle cx="13" cy="13" r="4.5" fill="#0b0f14"/></svg>',
  )

// ---------- Geokodlash: avval Google, boʻlmasa Nominatim ----------
interface Hit { label: string; lat: number; lng: number }

async function geocode(text: string): Promise<Hit[]> {
  const g = window.google?.maps
  if (g) {
    try {
      const { results } = await new g.Geocoder().geocode({ address: text })
      const hits = results
        .map((r) => {
          const loc = r.geometry?.location
          if (!loc) return null
          return { label: r.formatted_address || text, lat: loc.lat(), lng: loc.lng() }
        })
        .filter((h): h is Hit => h !== null)
      if (hits.length) return hits.slice(0, 5)
    } catch { /* Nominatim ga oʻtamiz */ }
  }
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=uz&q='
  const res = await fetch(url + encodeURIComponent(text))
  if (!res.ok) return []
  const rows: { display_name: string; lat: string; lon: string }[] = await res.json()
  return rows.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }))
}

// ================= Asosiy komponent =================
export function MapPicker({
  lat, lng, onChange, query, height = 300,
}: {
  lat: string
  lng: string
  onChange: (v: { lat: string; lng: string }) => void
  /** Qidiruv maydoniga oldindan qoʻyiladigan matn (masalan, klub manzili) */
  query?: string
  height?: number
}) {
  const parsed = { lat: parseFloat(lat), lng: parseFloat(lng) }
  const marker: LatLng | null =
    Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng) ? parsed : null

  const [view, setView] = useState<{ center: LatLng; zoom: number }>(() => ({
    center: marker ?? DEFAULT_CENTER,
    zoom: marker ? 16 : 12,
  }))
  const [googleDown, setGoogleDown] = useState(false)
  const useGoogle = Boolean(GOOGLE_KEY) && !googleDown

  const pick = useCallback((p: LatLng) => {
    onChange({ lat: fmt(p.lat), lng: fmt(p.lng) })
  }, [onChange])

  // ---- qidiruv ----
  const [q, setQ] = useState(query ?? '')
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const touched = useRef(false)

  // foydalanuvchi qidiruv maydonini oʻzgartirmagan boʻlsa — manzilni kuzatib boradi
  useEffect(() => {
    if (!touched.current) setQ(query ?? '')
  }, [query])

  const search = async () => {
    const text = q.trim()
    if (!text) return
    setSearching(true)
    try {
      setHits(await geocode(text))
    } catch {
      setHits([])
    } finally {
      setSearching(false)
    }
  }

  const applyHit = (h: Hit) => {
    setView({ center: { lat: h.lat, lng: h.lng }, zoom: 16 })
    setHits(null)
    pick({ lat: h.lat, lng: h.lng })
  }

  const canvasProps = {
    center: view.center,
    zoom: view.zoom,
    marker,
    height,
    onView: setView,
    onPick: pick,
  }

  return (
    <div className="map-picker">
      <div className="map-search">
        <input
          className="input"
          value={q}
          placeholder="Manzil yoki joy nomi boʻyicha qidirish"
          onChange={(e) => { touched.current = true; setQ(e.target.value) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search() } }}
        />
        <button type="button" className="btn ghost" onClick={search} disabled={searching}>
          {searching ? '…' : 'Qidirish'}
        </button>
      </div>

      {hits && (
        <div className="map-hits">
          {hits.length === 0
            ? <div className="map-hit muted">Hech narsa topilmadi</div>
            : hits.map((h, i) => (
              <button type="button" key={i} className="map-hit" onClick={() => applyHit(h)}>
                {h.label}
              </button>
            ))}
        </div>
      )}

      <div className="map-shell" style={{ height }}>
        {useGoogle
          ? <GoogleCanvas {...canvasProps} onFail={() => setGoogleDown(true)} />
          : <TileCanvas {...canvasProps} />}

        <div className="map-zoom">
          <button type="button" onClick={() => setView((v) => ({ ...v, zoom: clampZ(v.zoom + 1) }))}>+</button>
          <button type="button" onClick={() => setView((v) => ({ ...v, zoom: clampZ(v.zoom - 1) }))}>−</button>
        </div>
        {!useGoogle && <div className="map-attr">© OpenStreetMap</div>}
      </div>

      <div className="map-foot">
        {marker
          ? <span>Tanlangan nuqta: <b>{fmt(marker.lat)}, {fmt(marker.lng)}</b></span>
          : <span className="muted">Nuqtani belgilash uchun xaritani bosing</span>}
        {marker && (
          <button type="button" className="map-clear" onClick={() => onChange({ lat: '', lng: '' })}>
            Tozalash
          </button>
        )}
      </div>
    </div>
  )
}

interface CanvasProps {
  center: LatLng
  zoom: number
  marker: LatLng | null
  height: number
  onView: (v: { center: LatLng; zoom: number }) => void
  onPick: (p: LatLng) => void
}

// ================= Google Maps rejimi =================
function GoogleCanvas({ center, zoom, marker, onView, onPick, onFail }: CanvasProps & { onFail: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<GMap | null>(null)
  const markerRef = useRef<GMarker | null>(null)
  const gmRef = useRef<GoogleMaps | null>(null)
  const [ready, setReady] = useState(false)

  // eng soʻnggi qiymatlar — xarita faqat bir marta quriladi
  const live = useRef({ center, zoom, onView, onPick, onFail })
  useEffect(() => { live.current = { center, zoom, onView, onPick, onFail } })

  const mLat = marker?.lat ?? null
  const mLng = marker?.lng ?? null

  useEffect(() => {
    let dead = false
    loadGoogleMaps()
      .then((g) => {
        if (dead || !boxRef.current) return
        const { center: c, zoom: z } = live.current
        const map = new g.Map(boxRef.current, {
          center: c,
          zoom: z,
          minZoom: MIN_Z,
          maxZoom: MAX_Z,
          disableDefaultUI: true, // oʻzimizning masshtab tugmalarimiz ishlatiladi
          gestureHandling: 'greedy',
          clickableIcons: false,
          ...(isDark() ? { styles: DARK_STYLE } : {}),
        })
        map.addListener('click', (e) => {
          const p = e.latLng
          if (p) live.current.onPick({ lat: p.lat(), lng: p.lng() })
        })
        // foydalanuvchi xaritani surganda/masshtabni oʻzgartirganda holatni sinxronlaymiz
        map.addListener('idle', () => {
          const c2 = map.getCenter?.()
          const z2 = map.getZoom?.()
          if (!c2 || z2 === undefined) return
          const s = live.current
          const moved = Math.abs(c2.lat() - s.center.lat) > 1e-6 || Math.abs(c2.lng() - s.center.lng) > 1e-6
          if (moved || z2 !== s.zoom) s.onView({ center: { lat: c2.lat(), lng: c2.lng() }, zoom: z2 })
        })
        gmRef.current = g
        mapRef.current = map
        setReady(true)
      })
      .catch(() => { if (!dead) live.current.onFail() })
    return () => {
      dead = true
      markerRef.current?.setMap(null)
      markerRef.current = null
      mapRef.current = null
    }
  }, [])

  // tashqi oʻzgarish (qidiruv, masshtab tugmalari) → xaritani surish
  const { lat: cLat, lng: cLng } = center
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const c = map.getCenter?.()
    if (!c || Math.abs(c.lat() - cLat) > 1e-6 || Math.abs(c.lng() - cLng) > 1e-6) {
      map.setCenter({ lat: cLat, lng: cLng })
    }
    if (map.getZoom?.() !== zoom) map.setZoom(zoom)
  }, [ready, cLat, cLng, zoom])

  // marker
  useEffect(() => {
    const g = gmRef.current
    const map = mapRef.current
    if (!ready || !g || !map) return

    if (mLat === null || mLng === null) {
      markerRef.current?.setMap(null)
      markerRef.current = null
      return
    }
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: mLat, lng: mLng })
      return
    }
    const mk = new g.Marker({
      map,
      position: { lat: mLat, lng: mLng },
      draggable: true,
      icon: { url: PIN_DATA_URI, scaledSize: new g.Size(26, 34), anchor: new g.Point(13, 34) },
    })
    mk.addListener('dragend', (e) => {
      const p = e.latLng ?? mk.getPosition()
      if (p) live.current.onPick({ lat: p.lat(), lng: p.lng() })
    })
    markerRef.current = mk
  }, [ready, mLat, mLng])

  return <div ref={boxRef} className="map-box map-gmap" />
}

// ================= OSM plitkali zaxira rejimi =================
function TileCanvas({ center, zoom, marker, onView, onPick }: CanvasProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const c = project(center, zoom)
  const originX = c.x - size.w / 2
  const originY = c.y - size.h / 2

  // ---- surish ----
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('.map-zoom')) return // boshqaruv tugmalari
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!dx && !dy) return
    d.moved += Math.abs(dx) + Math.abs(dy)
    d.x = e.clientX
    d.y = e.clientY
    onView({ center: unproject(c.x - dx, c.y - dy, zoom), zoom })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d || d.moved > 5) return // surildi — bosish emas
    const r = boxRef.current!.getBoundingClientRect()
    onPick(unproject(originX + (e.clientX - r.left), originY + (e.clientY - r.top), zoom))
  }

  // ---- gʻildirak bilan masshtab (kursor nuqtasini saqlagan holda) ----
  const zoomState = useRef({ center, zoom, size, onView })
  useEffect(() => { zoomState.current = { center, zoom, size, onView } })

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const s = zoomState.current
      const nz = clampZ(s.zoom + (e.deltaY < 0 ? 1 : -1))
      if (nz === s.zoom) return
      const r = el.getBoundingClientRect()
      const offX = e.clientX - r.left - s.size.w / 2
      const offY = e.clientY - r.top - s.size.h / 2
      const cp = project(s.center, s.zoom)
      const k = 2 ** (nz - s.zoom)
      s.onView({ center: unproject((cp.x + offX) * k - offX, (cp.y + offY) * k - offY, nz), zoom: nz })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ---- plitkalar ----
  const tiles: { key: string; url: string; left: number; top: number }[] = []
  if (size.w > 0) {
    const n = 2 ** zoom
    const y0 = Math.floor(originY / TILE)
    const y1 = Math.floor((originY + size.h) / TILE)
    const x0 = Math.floor(originX / TILE)
    const x1 = Math.floor((originX + size.w) / TILE)
    for (let ty = y0; ty <= y1; ty++) {
      if (ty < 0 || ty >= n) continue
      for (let tx = x0; tx <= x1; tx++) {
        const wx = ((tx % n) + n) % n // gorizontal boʻyicha aylanish
        tiles.push({
          key: `${zoom}/${tx}/${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wx}/${ty}.png`,
          left: tx * TILE - originX,
          top: ty * TILE - originY,
        })
      }
    }
  }

  const mp = marker ? project(marker, zoom) : null

  return (
    <div
      ref={boxRef}
      className="map-box"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { drag.current = null }}
    >
      <div className="map-tiles">
        {tiles.map((t) => (
          <img key={t.key} src={t.url} alt="" draggable={false}
            style={{ position: 'absolute', left: t.left, top: t.top, width: TILE, height: TILE }} />
        ))}
      </div>
      {mp && (
        <div className="map-marker" style={{ left: mp.x - originX, top: mp.y - originY }}
          dangerouslySetInnerHTML={{ __html: PIN_SVG }} />
      )}
    </div>
  )
}
