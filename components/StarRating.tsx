type Props = {
  rating: number   // 0–5, supports decimals
  count?: number
  size?: 'sm' | 'md' | 'lg'
  tone?: 'light' | 'dark'  // dark = rendered on the green signboard
}

export default function StarRating({ rating, count, size = 'md', tone = 'light' }: Props) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  const stars = Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? '★' : '☆'))
  const dataColor = tone === 'dark' ? 'text-white/80' : 'text-moss'

  return (
    <span className={`${sizes[size]} inline-flex items-center gap-2`}>
      <span className="text-slide tracking-[0.08em]">{stars.join('')}</span>
      {count !== undefined && (
        <span className={`font-data text-[11px] font-semibold uppercase tracking-wider ${dataColor}`}>
          {rating > 0 ? `${Number(rating).toFixed(1)} · ` : ''}{count} {count === 1 ? 'rating' : 'ratings'}
        </span>
      )}
    </span>
  )
}
