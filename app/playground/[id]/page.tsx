import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import AmenityChecklist from '@/components/AmenityChecklist'
import ReviewList from '@/components/ReviewList'
import RatingFormWrapper from './RatingFormWrapper'
import type { Amenities, Playground, Rating } from '@/lib/supabase/types'

type Props = { params: Promise<{ id: string }> }

export default async function PlaygroundDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: playgroundData } = await supabase
    .from('playgrounds')
    .select('*')
    .eq('id', id)
    .single()

  if (!playgroundData) notFound()
  const playground = playgroundData as Playground

  const { data: ratings } = await supabase
    .from('ratings')
    .select('*, users(display_name)')
    .eq('playground_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Tally amenities: for each key, count how many raters confirmed it
  const allRatings = (ratings ?? []) as Rating[]
  const amenityTotals: Partial<Record<keyof Amenities, number>> = {}
  for (const r of allRatings) {
    const a = r.amenities as Amenities
    for (const key of Object.keys(a) as (keyof Amenities)[]) {
      if (a[key]) amenityTotals[key] = (amenityTotals[key] ?? 0) + 1
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">{playground.name}</h1>
      {playground.city && <p className="text-gray-500 text-sm mb-3">{playground.city}{playground.country ? `, ${playground.country}` : ''}</p>}

      <div className="flex items-center gap-2 mb-6">
        <StarRating rating={Number(playground.avg_rating)} count={playground.rating_count} size="lg" />
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Amenities</h2>
        <AmenityChecklist amenities={amenityTotals} ratingCount={playground.rating_count} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Rate This Playground</h2>
        <RatingFormWrapper playgroundId={playground.id} userId={user?.id ?? null} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Reviews ({allRatings.length})</h2>
        <ReviewList ratings={allRatings} />
      </section>
    </div>
  )
}
