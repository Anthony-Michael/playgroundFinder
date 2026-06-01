'use client'
import { AMENITIES } from '@/lib/amenities'
import type { AmenityKey } from '@/lib/amenities'

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
      {AMENITIES.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
            active.includes(key)
              ? 'bg-green-500 border-green-500 text-white'
              : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'
          }`}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  )
}
