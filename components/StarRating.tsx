type Props = {
  rating: number   // 0–5, supports decimals
  count?: number
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ rating, count, size = 'md' }: Props) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆')

  return (
    <span className={`${sizes[size]} inline-flex items-center gap-0.5`}>
      <span className="text-yellow-400 tracking-tight">{stars.join('')}</span>
      {count !== undefined && (
        <span className="text-gray-400 text-xs ml-1">
          {rating > 0 ? `${Number(rating).toFixed(1)} ` : ''}({count})
        </span>
      )}
    </span>
  )
}
