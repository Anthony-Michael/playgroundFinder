'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Playground } from '@/lib/supabase/types'
import StarRating from './StarRating'
import { IconBadge } from './AmenityIcon'
import { formatDistance } from '@/lib/distance'

type Props = {
  playground: Playground
  distanceKm?: number
}

export default function PlaygroundCard({ playground, distanceKm }: Props) {
  const hasRatings = playground.rating_count > 0
  const [imgError, setImgError] = useState(false)

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=112x112&location=${playground.lat},${playground.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&radius=100&return_error_code=true`

  return (
    <Link
      href={`/playground/${playground.id}`}
      className="flex items-center gap-3.5 bg-white border border-line rounded-xl p-3.5 hover:border-park focus-visible:outline-2 focus-visible:outline-park transition-colors"
    >
      {!imgError ? (
        <span className="w-14 h-14 rounded-[10px] overflow-hidden flex-shrink-0 bg-sand-deep border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={streetViewUrl}
            alt={playground.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </span>
      ) : (
        <IconBadge name="playground" />
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-ink truncate tracking-tight">
          {playground.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          {hasRatings ? (
            <StarRating rating={Number(playground.avg_rating)} count={playground.rating_count} size="sm" />
          ) : (
            <span className="text-xs text-moss">No ratings yet</span>
          )}
          {playground.city && (
            <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-moss truncate">
              · {playground.city}
            </span>
          )}
        </div>
      </div>

      {distanceKm !== undefined && (
        <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-moss flex-shrink-0">
          {formatDistance(distanceKm)}
        </span>
      )}
    </Link>
  )
}
