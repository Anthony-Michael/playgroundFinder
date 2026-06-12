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
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-4xl leading-none p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-park rounded ${
            star <= (hover || value) ? 'text-slide' : 'text-sand-deep'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
