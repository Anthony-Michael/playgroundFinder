import { AMENITIES } from '@/lib/amenities'
import type { Amenities } from '@/lib/supabase/types'
import { IconBadge } from './AmenityIcon'

type Props = {
  amenities: Partial<Record<keyof Amenities, number>>
  ratingCount: number
}

export default function AmenityChecklist({ amenities, ratingCount }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {AMENITIES.map(({ key, label }) => {
        const confirmedCount = amenities[key] ?? 0
        const confirmed = ratingCount > 0 && confirmedCount / ratingCount >= 0.5

        return (
          <div
            key={key}
            className={`flex items-center gap-2.5 text-sm p-2.5 rounded-[10px] border ${
              confirmed
                ? 'bg-white border-line text-ink font-semibold'
                : 'border-dashed border-line text-moss'
            }`}
          >
            <IconBadge name={key} size="sm" ghost={!confirmed} />
            <span className="truncate">{label}</span>
            {confirmed ? (
              <span className="ml-auto font-data text-[10px] font-semibold text-park flex-shrink-0">
                {confirmedCount}/{ratingCount}
              </span>
            ) : (
              <span className="ml-auto font-data text-[10px] font-semibold text-moss/70 flex-shrink-0">
                {ratingCount === 0 ? '—' : `${confirmedCount}/${ratingCount}`}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
