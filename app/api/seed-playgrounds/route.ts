import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPlaygroundsNearby } from '@/lib/google-places'

// In-memory per-IP rate limiter. NOTE: this resets on cold start and is
// per-instance, so it's best-effort only — on serverless it won't be a hard
// global limit. Good enough to blunt casual abuse; a durable store (e.g. a
// Supabase table or Redis) would be needed for a real guarantee.
const RATE_LIMIT = 10 // requests
const RATE_WINDOW_MS = 60_000 // per minute
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE_LIMIT
}

// Tile key = lat/lng rounded to 2 decimal places (~1km grid).
function tileKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`
}

const TILE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { lat, lng } = await request.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const tile = tileKey(lat, lng)

  // Skip the Places call if this tile was seeded recently.
  const { data: existing } = await supabase
    .from('seeded_tiles')
    .select('seeded_at')
    .eq('tile', tile)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seededAt = (existing as any)?.seeded_at as string | undefined
  if (seededAt && Date.now() - new Date(seededAt).getTime() < TILE_TTL_MS) {
    return NextResponse.json({ seeded: 0, cached: true })
  }

  const playgrounds = await fetchPlaygroundsNearby(lat, lng)

  let seeded = 0
  if (playgrounds.length > 0) {
    const { error, count } = await supabase
      .from('playgrounds')
      .upsert(playgrounds as unknown as never[], { onConflict: 'google_place_id', ignoreDuplicates: true })
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    seeded = count ?? 0
  }

  // Record the tile as seeded even when Places returned nothing, so we don't
  // keep paying to re-check empty areas.
  await supabase
    .from('seeded_tiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ tile, seeded_at: new Date().toISOString() } as any, { onConflict: 'tile' })

  return NextResponse.json({ seeded })
}
