'use client'
import { useState } from 'react'

type Props = {
  value: number
  onChange: (stars: number) => void
}

export default function StarPicker({ value, onChange }: Props) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-3xl transition-colors ${star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
