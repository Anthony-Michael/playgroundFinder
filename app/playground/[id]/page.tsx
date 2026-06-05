import { notFound } from 'next/navigation'
import Link from 'next/link'
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
      <Link href="/list" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        ← Back to list
      </Link>

      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
          🛝
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{playground.name}</h1>
          {playground.city && (
            <p className="text-gray-500 text-sm mt-0.5">
              {playground.city}{playground.country ? `, ${playground.country}` : ''}
            </p>
          )}
          <div className="mt-2">
            <StarRating rating={Number(playground.avg_rating)} count={playground.rating_count} size="lg" />
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 mb-6" />

      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Amenities</h2>
        <AmenityChecklist amenities={amenityTotals} ratingCount={playground.rating_count} />
      </section>

      <div className="h-px bg-gray-100 mb-6" />

      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Rate This Playground</h2>
        <RatingFormWrapper playgroundId={playground.id} userId={user?.id ?? null} />
      </section>

      <div className="h-px bg-gray-100 mb-6" />

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Reviews
          {allRatings.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({allRatings.length})</span>
          )}
        </h2>
        <ReviewList ratings={allRatings} />
      </section>
    </div>
  )
}
