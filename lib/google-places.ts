import type { Database } from './supabase/types'

export type PlacesPlayground = Database['public']['Tables']['playgrounds']['Insert']

/** Fetch playgrounds from Google Places Nearby Search within a bounding box */
export async function fetchPlaygroundsNearby(
  lat: number,
  lng: number,
  radiusMeters: number = 5000
): Promise<PlacesPlayground[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY!
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=park&keyword=playground&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Places API error: ${res.status}`)
  const data = await res.json()

  return (data.results ?? []).map((place: any) => ({
    google_place_id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    city: place.vicinity?.split(',').pop()?.trim() ?? null,
    country: null, // enriched separately if needed
  }))
}
