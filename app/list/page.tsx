'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Playground } from '@/lib/supabase/types'
import PlaygroundCard from '@/components/PlaygroundCard'
import { distanceKm } from '@/lib/distance'

export default function ListPage() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    async function load() {
      let query = supabase.from('playgrounds').select('*').order('avg_rating', { ascending: false })
      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)
      const { data } = await query.limit(50)
      setPlaygrounds(data ?? [])
    }
    load()
  }, [search, supabase])

  const sorted = userLocation
    ? [...playgrounds].sort((a, b) =>
        distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : playgrounds

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-14 bg-white border-b border-gray-200 px-4 py-3 z-30">
        <input
          type="search"
          placeholder="🔍 Search playgrounds..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No playgrounds found</p>
      ) : (
        sorted.map(pg => (
          <PlaygroundCard
            key={pg.id}
            playground={pg}
            distanceKm={userLocation ? distanceKm(userLocation.lat, userLocation.lng, pg.lat, pg.lng) : undefined}
          />
        ))
      )}
    </div>
  )
}
