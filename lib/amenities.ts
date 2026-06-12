import type { Amenities } from './supabase/types'

export type AmenityKey = keyof Amenities

// Icons live in components/AmenityIcon.tsx, keyed by `key`.
export const AMENITIES: { key: AmenityKey; label: string }[] = [
  { key: 'shade',       label: 'Shade / covered' },
  { key: 'washrooms',   label: 'Washrooms' },
  { key: 'splash_pad',  label: 'Splash pad' },
  { key: 'parking',     label: 'Parking' },
  { key: 'baby_swings', label: 'Baby swings' },
  { key: 'climbing',    label: 'Climbing structure' },
  { key: 'slides',      label: 'Slides' },
  { key: 'benches',     label: 'Benches / seating' },
]

export const DEFAULT_AMENITIES: Amenities = {
  shade: false, washrooms: false, splash_pad: false, parking: false,
  baby_swings: false, climbing: false, slides: false, benches: false,
}
