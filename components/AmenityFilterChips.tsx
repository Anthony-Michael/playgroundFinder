'use client'
import { AMENITIES } from '@/lib/amenities'
import type { AmenityKey } from '@/lib/amenities'
import AmenityIcon from './AmenityIcon'

type Props = {
  active: AmenityKey[]
  onChange: (active: AmenityKey[]) => void
}

export default function AmenityFilterChips({ active, onChange }: Props) {
  function toggle(key: AmenityKey) {
    onChange(active.includes(key) ? active.filter(k => k !== key) : [...active, key])
  }
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-4">
      {AMENITIES.map(({ key, label }) => {
        const isActive = active.includes(key)
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            aria-pressed={isActive}
            className={`flex-shrink-0 flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-[9px] text-sm font-semibold border transition-colors ${
              isActive
                ? 'bg-park border-park-deep text-white'
                : 'bg-white border-line text-ink hover:border-park'
            }`}
          >
            <AmenityIcon name={key} className={`w-4 h-4 ${isActive ? 'text-slide' : 'text-park'}`} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
