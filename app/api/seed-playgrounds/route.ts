import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPlaygroundsNearby } from '@/lib/google-places'

export async function POST(request: Request) {
  const { lat, lng } = await request.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const playgrounds = await fetchPlaygroundsNearby(lat, lng)
  if (playgrounds.length === 0) {
    return NextResponse.json({ seeded: 0 })
  }

  const supabase = createAdminClient()
  const { error, count } = await supabase
    .from('playgrounds')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(playgrounds as unknown as never[], { onConflict: 'google_place_id', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seeded: count ?? 0 })
}
