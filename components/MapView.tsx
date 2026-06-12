'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Amenities, Playground } from '@/lib/supabase/types'
import type { AmenityKey } from '@/lib/amenities'
import AmenityFilterChips from './AmenityFilterChips'
import AmenityIcon from './AmenityIcon'

const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 } // Toronto

export default function MapView() {
  // null until geolocation resolves — the map mounts with the right center on the
  // first render, since defaultCenter is only read once
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [filters, setFilters] = useState<AmenityKey[]>([])
  // playground id → amenities confirmed by ≥50% of raters (same rule as the detail page)
  const [confirmedAmenities, setConfirmedAmenities] = useState<Record<string, Set<AmenityKey>>>({})
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCenter(DEFAULT_CENTER) // Fall back to Toronto if denied
    )
  }, [])

  // Seed + load playgrounds when center changes
  const loadPlaygrounds = useCallback(async (lat: number, lng: number) => {
    // Seed from Google Places
    await fetch('/api/seed-playgrounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
    // Load from Supabase within ~10km bounding box
    const delta = 0.09 // ~10km
    const { data } = await supabase
      .from('playgrounds')
      .select('*')
      .gte('lat', lat - delta).lte('lat', lat + delta)
      .gte('lng', lng - delta).lte('lng', lng + delta)
    const pgs = (data ?? []) as Playground[]
    setPlaygrounds(pgs)

    // Aggregate rated amenities for the loaded playgrounds
    const ratedIds = pgs.filter(pg => pg.rating_count > 0).map(pg => pg.id)
    if (ratedIds.length === 0) {
      setConfirmedAmenities({})
      return
    }
    const { data: ratings } = await supabase
      .from('ratings')
      .select('playground_id, amenities')
      .in('playground_id', ratedIds)
    const ratingRows = (ratings ?? []) as { playground_id: string; amenities: Amenities }[]
    const tally: Record<string, { total: number; counts: Partial<Record<AmenityKey, number>> }> = {}
    for (const r of ratingRows) {
      const t = (tally[r.playground_id] ??= { total: 0, counts: {} })
      t.total++
      const a = r.amenities
      for (const key of Object.keys(a) as AmenityKey[]) {
        if (a[key]) t.counts[key] = (t.counts[key] ?? 0) + 1
      }
    }
    const confirmed: Record<string, Set<AmenityKey>> = {}
    for (const [id, t] of Object.entries(tally)) {
      confirmed[id] = new Set(
        (Object.keys(t.counts) as AmenityKey[]).filter(key => (t.counts[key] ?? 0) / t.total >= 0.5)
      )
    }
    setConfirmedAmenities(confirmed)
  }, [supabase])

  useEffect(() => {
    if (center) loadPlaygrounds(center.lat, center.lng)
  }, [center, loadPlaygrounds])

  const visiblePlaygrounds = filters.length === 0
    ? playgrounds
    : playgrounds.filter(pg => {
        const confirmed = confirmedAmenities[pg.id]
        return confirmed !== undefined && filters.every(f => confirmed.has(f))
      })

  // Waiting on geolocation — don't mount the map yet or it locks onto the fallback
  if (!center) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <p className="font-data text-xs font-semibold uppercase tracking-widest text-moss">
          Finding playgrounds near you…
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="playground-map"
          className="flex-1"
          onCameraChanged={ev => {
            const c = ev.detail.center
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
              setCenter({ lat: c.lat, lng: c.lng })
            }, 800)
          }}
        >
          {visiblePlaygrounds.map(pg => (
            <AdvancedMarker
              key={pg.id}
              position={{ lat: pg.lat, lng: pg.lng }}
              onClick={() => router.push(`/playground/${pg.id}`)}
              title={pg.name}
            >
              <div className="w-8 h-8 rounded-[10px] bg-park border-2 border-white shadow-md flex items-center justify-center text-white">
                <AmenityIcon name="playground" className="w-4 h-4" />
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
      <div className="py-3 bg-sand border-t border-line">
        <AmenityFilterChips active={filters} onChange={setFilters} />
        {filters.length > 0 && (
          <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-moss px-4 pt-2">
            {visiblePlaygrounds.length === 0
              ? 'No rated playgrounds match — clear a filter or rate one to add it'
              : `${visiblePlaygrounds.length} of ${playgrounds.length} match`}
          </p>
        )}
      </div>
    </div>
  )
}
