type Props = {
  rating: number   // 0–5, supports decimals
  count?: number
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ rating, count, size = 'md' }: Props) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return '★'
    if (i < rating) return '⭐' // partial — use filled for simplicity
    return '☆'
  })
  return (
    <span className={`${sizes[size]} inline-flex items-center gap-1`}>
      <span className="text-yellow-400">{stars.join('')}</span>
      {count !== undefined && <span className="text-gray-500 text-sm">({count})</span>}
    </span>
  )
}
