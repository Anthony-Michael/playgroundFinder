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

  // Pre-fill the form if this user already rated this playground.
  let initialRating: { stars: number; amenities: Amenities; comment: string | null } | null = null
  if (user) {
    const { data: own } = await supabase
      .from('ratings')
      .select('stars, amenities, comment')
      .eq('playground_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (own) {
      const r = own as { stars: number; amenities: Amenities; comment: string | null }
      initialRating = { stars: r.stars, amenities: r.amenities, comment: r.comment }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <Link
        href="/list"
        className="inline-flex items-center gap-1 font-data text-[11px] font-semibold uppercase tracking-widest text-moss hover:text-ink mb-4 transition-colors"
      >
        ← Back to list
      </Link>

      {/* Signboard hero — the park entrance sign */}
      <div className="bg-park text-white rounded-xl border-b-4 border-park-deep px-5 py-6 mb-6">
        {playground.city && (
          <p className="font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-slide mb-1.5">
            {playground.city}{playground.country ? ` · ${playground.country}` : ''}
          </p>
        )}
        <h1 className="font-display font-extrabold text-[26px] leading-tight tracking-tight">
          {playground.name}
        </h1>
        <div className="mt-3">
          <StarRating rating={Number(playground.avg_rating)} count={playground.rating_count} size="lg" tone="dark" />
        </div>
      </div>

      <section className="mb-7">
        <h2 className="font-display font-bold text-base text-ink mb-3">Amenities</h2>
        <AmenityChecklist amenities={amenityTotals} ratingCount={playground.rating_count} />
      </section>

      <section className="mb-7">
        <h2 className="font-display font-bold text-base text-ink mb-3">Rate this playground</h2>
        <RatingFormWrapper playgroundId={playground.id} userId={user?.id ?? null} initialRating={initialRating} />
      </section>

      <section>
        <h2 className="font-display font-bold text-base text-ink mb-3">
          Reviews
          {allRatings.length > 0 && (
            <span className="ml-2 font-data text-[11px] font-semibold uppercase tracking-wider text-moss">
              {allRatings.length}
            </span>
          )}
        </h2>
        <ReviewList ratings={allRatings} />
      </section>
    </div>
  )
}
