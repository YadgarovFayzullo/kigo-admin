// Shared reference dictionaries (sports / regions / districts), loaded once and
// memoized so every page reuses the same fetch. Used to build filter dropdowns
// and the region/district/sport selects in create forms.
import { useEffect, useState } from 'react'
import { getSports, getRegions, getDistricts, getAdminSports } from './endpoints'
import { localized } from './adapters'
import type { ApiSport, ApiRegion, ApiDistrict } from './types'

/** Sport dictionary entry; `is_active` is present only from the admin source. */
export type RefSport = ApiSport & { is_active?: boolean }

export interface RefData {
  sports: RefSport[]
  regions: ApiRegion[]
  districts: ApiDistrict[]
}

let cache: Promise<RefData> | null = null
// Mounted useRefData() consumers, so an invalidation refreshes them in place.
const subscribers = new Set<() => void>()

// The public /api/sports/ dictionary only lists sports that are visible in the
// app, so a sport hidden with the toggle would silently vanish from the admin
// panel's own dropdowns. The admin list carries every sport plus `is_active`;
// the public one is the fallback (e.g. no token yet).
const loadSports = (): Promise<RefSport[]> =>
  getAdminSports().catch(() => getSports())

/** Fetch the reference dictionaries once; subsequent callers share the result. */
export function loadRefData(): Promise<RefData> {
  if (!cache) {
    cache = Promise.all([loadSports(), getRegions(), getDistricts()])
      .then(([sports, regions, districts]) => ({ sports, regions, districts }))
      .catch((e) => { cache = null; throw e }) // allow a retry on failure
  }
  return cache
}

/** Drop the memoized dictionaries and refresh every mounted consumer — call
 *  after creating or editing a reference row (e.g. a new sport type). */
export function invalidateRefData() {
  cache = null
  subscribers.forEach((refresh) => refresh())
}

/** Cascading district options for a region chosen by its localized name.
 *  Returns [] when no region is selected, so the district <Select> collapses to
 *  its "all" option only. */
export function districtOptionsForRegion(
  regions: ApiRegion[], districts: ApiDistrict[], regionName: string,
): { value: string; label: string }[] {
  if (!regionName || regionName === 'all') return []
  const sel = regions.find((r) => localized(r) === regionName)
  if (!sel) return []
  return districts
    .filter((d) => d.region_id === sel.id)
    .map((d) => ({ value: localized(d), label: localized(d) }))
}

/** React hook wrapping loadRefData; empty lists until loaded. Failures fall back
 *  to empty lists and are retried on the next invalidation. */
export function useRefData(): RefData {
  const [data, setData] = useState<RefData | null>(null)
  useEffect(() => {
    let alive = true
    const refresh = () => {
      loadRefData().then((d) => { if (alive) setData(d) }).catch(() => {})
    }
    refresh()
    subscribers.add(refresh)
    return () => { alive = false; subscribers.delete(refresh) }
  }, [])
  return data ?? { sports: [], regions: [], districts: [] }
}
