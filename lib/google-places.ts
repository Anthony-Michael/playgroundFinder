import type { Database } from './supabase/types'

export type PlacesPlayground = Database['public']['Tables']['playgrounds']['Insert']

type AddressComponent = { types: string[]; shortText?: string; longText?: string }

const COUNTRY_MAP: Record<string, 'CA' | 'US'> = { CA: 'CA', US: 'US' }

/** Pull city + 2-letter country out of the new API's addressComponents. */
function parseAddress(components: AddressComponent[] = []): {
  city: string | null
  country: 'CA' | 'US' | null
} {
  let city: string | null = null
  let country: 'CA' | 'US' | null = null
  for (const c of components) {
    if (c.types.includes('locality')) city = c.longText ?? c.shortText ?? null
    if (c.types.includes('country')) {
      const code = c.shortText ?? ''
      country = COUNTRY_MAP[code] ?? null
    }
  }
  // Fall back to a broader admin area if there's no locality (rural parks).
  if (!city) {
    for (const c of components) {
      if (c.types.includes('administrative_area_level_2') || c.types.includes('postal_town')) {
        city = c.longText ?? c.shortText ?? null
        break
      }
    }
  }
  return { city, country }
}

/** Fetch playgrounds from the Places API (New) searchNearby endpoint. */
export async function fetchPlaygroundsNearby(
  lat: number,
  lng: number,
  radiusMeters: number = 5000
): Promise<PlacesPlayground[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY!
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.location,places.formattedAddress,places.addressComponents',
    },
    body: JSON.stringify({
      includedTypes: ['playground'],
      maxResultCount: 20,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    }),
  })
  if (!res.ok) throw new Error(`Places API error: ${res.status}`)
  const data = await res.json()

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.places ?? []).map((place: Record<string, any>) => {
      const { city, country } = parseAddress(place.addressComponents)
      return {
        google_place_id: place.id,
        name: place.displayName?.text ?? 'Playground',
        lat: place.location?.latitude,
        lng: place.location?.longitude,
        city,
        country,
      } as PlacesPlayground
    })
      // Schema's check constraint only allows CA/US — drop anything else.
      .filter((p: PlacesPlayground) => p.country === 'CA' || p.country === 'US')
  )
}
