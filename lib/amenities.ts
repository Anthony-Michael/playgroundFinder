import type { Amenities } from './supabase/types'

export type AmenityKey = keyof Amenities

export const AMENITIES: { key: AmenityKey; label: string; icon: string }[] = [
  { key: 'shade',      label: 'Shade / Covered',      icon: '🌳' },
  { key: 'washrooms',  label: 'Washrooms',             icon: '🚻' },
  { key: 'splash_pad', label: 'Splash Pad',            icon: '💧' },
  { key: 'parking',    label: 'Parking',               icon: '🅿️' },
  { key: 'baby_swings',label: 'Baby Swings',           icon: '🍼' },
  { key: 'climbing',   label: 'Climbing Structure',    icon: '🧗' },
  { key: 'slides',     label: 'Slides',                icon: '🛝' },
  { key: 'benches',    label: 'Benches / Seating',     icon: '🪑' },
]

export const DEFAULT_AMENITIES: Amenities = {
  shade: false, washrooms: false, splash_pad: false, parking: false,
  baby_swings: false, climbing: false, slides: false, benches: false,
}
