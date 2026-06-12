'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Playground } from '@/lib/supabase/types'
import PlaygroundCard from '@/components/PlaygroundCard'
import { distanceKm } from '@/lib/distance'

export default function ListPage() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = useMemo(() => createClient(), [])

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
      <div className="sticky top-14 bg-sand border-b border-line z-30">
        <div className="px-4 pt-5 pb-4">
          <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight">Nearby playgrounds</h1>
          {sorted.length > 0 && (
            <p className="font-data text-[11px] font-semibold uppercase tracking-widest text-moss mt-0.5">
              {sorted.length} found{userLocation ? ' · sorted by distance' : ''}
            </p>
          )}
          <input
            type="search"
            placeholder="Search playgrounds"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mt-3.5 border border-line rounded-[10px] px-3.5 py-2.5 text-sm bg-white focus:outline-2 focus:outline-park placeholder:text-moss"
          />
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="mx-4 mt-6 border border-dashed border-line rounded-xl py-14 text-center px-4">
          <p className="font-semibold text-ink">No playgrounds found</p>
          <p className="text-sm text-moss mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="px-4 pt-3 pb-8 space-y-2.5">
          {sorted.map(pg => (
            <PlaygroundCard
              key={pg.id}
              playground={pg}
              distanceKm={userLocation ? distanceKm(userLocation.lat, userLocation.lng, pg.lat, pg.lng) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
