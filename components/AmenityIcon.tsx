import type { AmenityKey } from '@/lib/amenities'

// Park-wayfinding pictograms. Simple stroke symbols, like recreation signage.
export type IconName = AmenityKey | 'playground'

const PATHS: Record<IconName, React.ReactNode> = {
  playground: (
    <>
      <path d="M6 20V6M9 20V6M6 9.5h3M6 13.5h3M6 17.5h3" />
      <path d="M9 6c5 1 8.2 6 9 14" />
    </>
  ),
  slides: (
    <>
      <path d="M6 20V6M9 20V6M6 9.5h3M6 13.5h3M6 17.5h3" />
      <path d="M9 6c5 1 8.2 6 9 14" />
    </>
  ),
  shade: (
    <>
      <path d="M12 3a5.5 5.5 0 0 1 5.5 5.5c0 3.2-2.5 5.2-5.5 5.2s-5.5-2-5.5-5.2A5.5 5.5 0 0 1 12 3z" />
      <path d="M12 13.7V21M9 21h6" />
    </>
  ),
  washrooms: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <rect x="9" y="6.5" width="6" height="4" rx="0.8" />
    </>
  ),
  splash_pad: <path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 1 1-12 0c0-3.3 3-6.5 6-10.5z" />,
  parking: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" />
    </>
  ),
  baby_swings: (
    <>
      <path d="M3.5 5h17" />
      <path d="M9.5 5L8 14.5M14.5 5L16 14.5" />
      <path d="M7 14.5h10" />
    </>
  ),
  climbing: (
    <>
      <path d="M4 20a8 8 0 0 1 16 0" />
      <path d="M12 12.5V20M8 14.5V20M16 14.5V20M5 17h14" />
    </>
  ),
  benches: (
    <>
      <path d="M4 8h16" />
      <path d="M4 13h16" />
      <path d="M6 8v10M18 8v10" />
    </>
  ),
}

export default function AmenityIcon({ name, className = 'w-5 h-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

// Signage badge: white pictogram on park green, like a trail sign.
export function IconBadge({ name, size = 'md', ghost = false }: { name: IconName; size?: 'sm' | 'md'; ghost?: boolean }) {
  const box = size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-[10px]'
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-[22px] h-[22px]'
  const tone = ghost ? 'bg-sand-deep text-moss' : 'bg-park text-white'
  return (
    <span className={`${box} ${tone} inline-flex items-center justify-center flex-shrink-0`}>
      <AmenityIcon name={name} className={icon} />
    </span>
  )
}
