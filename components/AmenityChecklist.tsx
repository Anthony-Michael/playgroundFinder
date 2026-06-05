import { AMENITIES } from '@/lib/amenities'
import type { Amenities } from '@/lib/supabase/types'

type Props = {
  amenities: Partial<Record<keyof Amenities, number>>
  ratingCount: number
}

export default function AmenityChecklist({ amenities, ratingCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {AMENITIES.map(({ key, label, icon }) => {
        const confirmedCount = amenities[key] ?? 0
        const confirmed = ratingCount > 0 && confirmedCount / ratingCount >= 0.5
        const unknown = ratingCount === 0

        return (
          <div
            key={key}
            className={`flex items-center gap-2 text-sm p-3 rounded-xl border ${
              confirmed
                ? 'bg-green-50 border-green-200 text-green-800'
                : unknown
                  ? 'bg-gray-50 border-gray-100 text-gray-400'
                  : 'bg-gray-50 border-gray-100 text-gray-400'
            }`}
          >
            <span className={unknown || !confirmed ? 'opacity-50' : ''}>{icon}</span>
            <span>{label}</span>
            {confirmed && <span className="ml-auto text-green-500 text-xs font-bold">✓</span>}
          </div>
        )
      })}
    </div>
  )
}
