// Shared reference dictionaries (sports / regions / districts), loaded once from
// the public API and memoized so every page reuses the same fetch. Used to build
// filter dropdowns and the region/district/sport selects in create forms.
import { useEffect, useState } from 'react'
import { getSports, getRegions, getDistricts } from './endpoints'
import type { ApiSport, ApiRegion, ApiDistrict } from './types'

export interface RefData {
  sports: ApiSport[]
  regions: ApiRegion[]
  districts: ApiDistrict[]
}

let cache: Promise<RefData> | null = null

/** Fetch the reference dictionaries once; subsequent callers share the result. */
export function loadRefData(): Promise<RefData> {
  if (!cache) {
    cache = Promise.all([getSports(), getRegions(), getDistricts()])
      .then(([sports, regions, districts]) => ({ sports, regions, districts }))
      .catch((e) => { cache = null; throw e }) // allow a retry on failure
  }
  return cache
}

/** React hook wrapping loadRefData; null until loaded. Failures fall back to empty lists. */
export function useRefData(): RefData {
  const [data, setData] = useState<RefData | null>(null)
  useEffect(() => {
    let alive = true
    loadRefData().then((d) => { if (alive) setData(d) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return data ?? { sports: [], regions: [], districts: [] }
}
