'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Playground } from '@/lib/supabase/types'
import type { AmenityKey } from '@/lib/amenities'
import AmenityFilterChips from './AmenityFilterChips'

const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 } // Toronto

export default function MapView() {
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [filters, setFilters] = useState<AmenityKey[]>([])
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // Fall back to Toronto if denied
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
    setPlaygrounds(data ?? [])
  }, [supabase])

  useEffect(() => { loadPlaygrounds(center.lat, center.lng) }, [center, loadPlaygrounds])

  const visiblePlaygrounds = filters.length === 0
    ? playgrounds
    : playgrounds.filter(pg => {
        // Playground doesn't have amenities directly — show all until rated data available
        // For now, just show all (filter is client-side hint, not blocking)
        return true
      })

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
            />
          ))}
        </Map>
      </APIProvider>
      <div className="py-3 bg-white border-t border-gray-200 shadow-lg">
        <AmenityFilterChips active={filters} onChange={setFilters} />
      </div>
    </div>
  )
}
