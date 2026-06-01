import { AMENITIES } from '@/lib/amenities'
import type { Amenities } from '@/lib/supabase/types'

type Props = {
  /** Merged amenities from all ratings — key: count of raters who confirmed it */
  amenities: Partial<Record<keyof Amenities, number>>
  ratingCount: number
}

export default function AmenityChecklist({ amenities, ratingCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {AMENITIES.map(({ key, label, icon }) => {
        const confirmedCount = amenities[key] ?? 0
        const confirmed = ratingCount > 0 && confirmedCount / ratingCount >= 0.5
        return (
          <div key={key} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${confirmed ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
            <span>{icon}</span>
            <span>{label}</span>
            {confirmed ? <span className="ml-auto text-green-500">✓</span> : <span className="ml-auto">✗</span>}
          </div>
        )
      })}
    </div>
  )
}
