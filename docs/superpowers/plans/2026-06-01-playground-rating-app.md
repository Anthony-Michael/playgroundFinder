# Playground Rating App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free web app where parents can discover and rate kids' playgrounds across North America, with amenity info (shade, washrooms, splash pad, parking) and star ratings.

**Architecture:** Next.js App Router frontend deployed on Vercel, Supabase for auth/database/RLS, Google Maps for the map view and Google Places API to auto-seed playground data when users explore the map.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (already linked: `aebneimvzphbfbmmqxzt`), `@supabase/ssr`, `@vis.gl/react-google-maps`, Google Maps JavaScript API, Google Places API, Vercel

---

## File Map

```
newAppMay21/
├── app/
│   ├── layout.tsx                  # Root layout, font, nav bar
│   ├── page.tsx                    # Home — map view
│   ├── list/page.tsx               # List view
│   ├── playground/[id]/page.tsx    # Playground detail
│   ├── auth/callback/route.ts      # Supabase OAuth callback
│   └── api/
│       └── seed-playgrounds/route.ts  # Seeds Google Places → Supabase
├── components/
│   ├── NavBar.tsx                  # Top nav: logo, search, auth button
│   ├── MapView.tsx                 # Google Map with playground pins
│   ├── AmenityFilterChips.tsx      # Filter chips below map
│   ├── PlaygroundCard.tsx          # Row in list view
│   ├── AmenityChecklist.tsx        # Amenity display on detail page
│   ├── StarRating.tsx              # Read-only star display
│   ├── StarPicker.tsx              # Interactive 1–5 star picker
│   ├── RatingForm.tsx              # Full rate-a-playground form
│   ├── AuthModal.tsx               # Sign-in modal (email + Google)
│   └── ReviewList.tsx              # List of recent reviews
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client
│   │   └── types.ts                # Generated DB types (manual for now)
│   ├── google-places.ts            # Fetch playgrounds from Places API
│   ├── amenities.ts                # Amenity key/label/icon definitions
│   └── distance.ts                 # Haversine distance helper
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       └── 002_rls_policies.sql
├── .env.local                      # API keys (not committed)
└── middleware.ts                   # Supabase session refresh
```

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Next.js app with TypeScript and Tailwind**

Run from `/Users/johnnymoronic/newAppMay21`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --yes
```
Expected: Next.js project created in current directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @vis.gl/react-google-maps
```
Expected: packages added to node_modules.

- [ ] **Step 3: Create `.env.local`**

```bash
# DO NOT COMMIT THIS FILE
NEXT_PUBLIC_SUPABASE_URL=https://aebneimvzphbfbmmqxzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<get from Google Cloud Console>
GOOGLE_PLACES_API_KEY=<same key, server-side>
```

- [ ] **Step 4: Update `.gitignore` to include secrets and brainstorm files**

Add to `.gitignore`:
```
.env.local
.superpowers/
```

- [ ] **Step 5: Verify app starts**

```bash
npm run dev
```
Expected: `http://localhost:3000` loads the default Next.js page.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with Tailwind and Supabase deps"
```

---

## Task 2: Supabase database schema

**Files:**
- Create: `supabase/migrations/001_create_tables.sql`
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: Create the tables migration**

Create `supabase/migrations/001_create_tables.sql`:
```sql
-- Playground profile table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default 'Anonymous',
  created_at timestamptz default now()
);

-- Playgrounds seeded from Google Places
create table public.playgrounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat float not null,
  lng float not null,
  google_place_id text unique not null,
  avg_rating float default 0,
  rating_count int default 0,
  city text,
  country text check (country in ('CA', 'US')),
  created_at timestamptz default now()
);

-- User ratings
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  playground_id uuid references public.playgrounds(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  stars int not null check (stars between 1 and 5),
  amenities jsonb not null default '{}',
  comment text check (char_length(comment) <= 280),
  created_at timestamptz default now(),
  unique(playground_id, user_id)  -- one rating per user per playground
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Recalculate avg_rating and rating_count when a rating is inserted/updated/deleted
create or replace function public.update_playground_rating()
returns trigger as $$
begin
  update public.playgrounds
  set
    avg_rating = (select coalesce(avg(stars), 0) from public.ratings where playground_id = coalesce(new.playground_id, old.playground_id)),
    rating_count = (select count(*) from public.ratings where playground_id = coalesce(new.playground_id, old.playground_id))
  where id = coalesce(new.playground_id, old.playground_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_rating_change
  after insert or update or delete on public.ratings
  for each row execute procedure public.update_playground_rating();
```

- [ ] **Step 2: Create RLS policies migration**

Create `supabase/migrations/002_rls_policies.sql`:
```sql
-- Enable RLS
alter table public.users enable row level security;
alter table public.playgrounds enable row level security;
alter table public.ratings enable row level security;

-- Playgrounds: anyone can read, no one can insert/update directly (seeded via API)
create policy "Anyone can read playgrounds" on public.playgrounds
  for select using (true);

-- Ratings: anyone can read
create policy "Anyone can read ratings" on public.ratings
  for select using (true);

-- Ratings: authenticated users can insert their own
create policy "Users can insert own ratings" on public.ratings
  for insert with check (auth.uid() = user_id);

-- Ratings: users can update their own
create policy "Users can update own ratings" on public.ratings
  for update using (auth.uid() = user_id);

-- Ratings: users can delete their own
create policy "Users can delete own ratings" on public.ratings
  for delete using (auth.uid() = user_id);

-- Users: anyone can read display names (for reviews)
create policy "Anyone can read user profiles" on public.users
  for select using (true);

-- Users: users can update their own profile
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
```

- [ ] **Step 3: Apply migrations to Supabase**

```bash
npx supabase db push
```
Expected: migrations applied to remote project `aebneimvzphbfbmmqxzt`. If prompted to link, run `npx supabase link --project-ref aebneimvzphbfbmmqxzt` first.

- [ ] **Step 4: Verify in Supabase dashboard**

Open https://supabase.com/dashboard/project/aebneimvzphbfbmmqxzt/editor and confirm `playgrounds`, `ratings`, and `users` tables exist with correct columns.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add database schema and RLS policies"
```

---

## Task 3: Supabase client + shared types + amenities constants

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/types.ts`
- Create: `lib/amenities.ts`
- Create: `lib/distance.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create browser Supabase client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server Supabase client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create database types**

Create `lib/supabase/types.ts`:
```typescript
export type Amenities = {
  shade: boolean
  washrooms: boolean
  splash_pad: boolean
  parking: boolean
  baby_swings: boolean
  climbing: boolean
  slides: boolean
  benches: boolean
}

export type Playground = {
  id: string
  name: string
  lat: number
  lng: number
  google_place_id: string
  avg_rating: number
  rating_count: number
  city: string | null
  country: 'CA' | 'US' | null
  created_at: string
}

export type Rating = {
  id: string
  playground_id: string
  user_id: string
  stars: number
  amenities: Amenities
  comment: string | null
  created_at: string
  users?: { display_name: string }
}

export type UserProfile = {
  id: string
  display_name: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      playgrounds: { Row: Playground; Insert: Omit<Playground, 'id' | 'created_at' | 'avg_rating' | 'rating_count'>; Update: Partial<Playground> }
      ratings: { Row: Rating; Insert: Omit<Rating, 'id' | 'created_at'>; Update: Partial<Rating> }
      users: { Row: UserProfile; Insert: Omit<UserProfile, 'created_at'>; Update: Partial<UserProfile> }
    }
  }
}
```

- [ ] **Step 4: Create amenities constants**

Create `lib/amenities.ts`:
```typescript
import type { Amenities } from './supabase/types'

export type AmenityKey = keyof Amenities

export const AMENITIES: { key: AmenityKey; label: string; icon: string }[] = [
  { key: 'shade',      label: 'Shade / Covered',      icon: '🌳' },
  { key: 'washrooms',  label: 'Washrooms',             icon: '🚻' },
  { key: 'splash_pad', label: 'Splash Pad',            icon: '💧' },
  { key: 'parking',    label: 'Parking',               icon: '🅿️' },
  { key: 'baby_swings',label: 'Baby Swings',           icon: '🍼' },
  { key: 'climbing',   label: 'Climbing Structure',    icon: '🧗' },
  { key: 'slides',     label: 'Slides',                icon: '🛝' },
  { key: 'benches',    label: 'Benches / Seating',     icon: '🪑' },
]

export const DEFAULT_AMENITIES: Amenities = {
  shade: false, washrooms: false, splash_pad: false, parking: false,
  baby_swings: false, climbing: false, slides: false, benches: false,
}
```

- [ ] **Step 5: Create distance helper**

Create `lib/distance.ts`:
```typescript
/** Haversine distance in km between two lat/lng points */
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
```

- [ ] **Step 6: Create middleware for Supabase session refresh**

Create `middleware.ts` in the project root:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: add Supabase clients, types, amenities constants, distance helper"
```

---

## Task 4: Auth — OAuth callback route + AuthModal component

**Files:**
- Create: `app/auth/callback/route.ts`
- Create: `components/AuthModal.tsx`

- [ ] **Step 1: Create OAuth callback route**

Create `app/auth/callback/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 2: Configure redirect URL in Supabase dashboard**

Go to https://supabase.com/dashboard/project/aebneimvzphbfbmmqxzt/auth/url-configuration and add:
- `http://localhost:3000/auth/callback` (development)
- `https://<your-vercel-domain>/auth/callback` (production — add after deploy)

- [ ] **Step 3: Create AuthModal component**

Create `components/AuthModal.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-1">Sign in to rate</h2>
        <p className="text-gray-500 text-sm mb-6">Create a free account to rate playgrounds</p>

        {sent ? (
          <p className="text-green-600 text-center py-4">✅ Check your email for a magic link!</p>
        ) : (
          <>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 mb-4 hover:bg-gray-50 font-medium"
            >
              <span>🔵</span> Continue with Google
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleEmailLogin}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
          </>
        )}

        <button onClick={onClose} className="mt-4 w-full text-gray-400 text-sm hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Enable Google provider in Supabase**

Go to https://supabase.com/dashboard/project/aebneimvzphbfbmmqxzt/auth/providers, enable Google, and paste in your Google OAuth Client ID and Secret (from Google Cloud Console → APIs & Credentials).

- [ ] **Step 5: Commit**

```bash
git add app/auth/ components/AuthModal.tsx
git commit -m "feat: add auth callback route and sign-in modal"
```

---

## Task 5: NavBar + Root Layout

**Files:**
- Create: `components/NavBar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create NavBar component**

Create `components/NavBar.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import AuthModal from './AuthModal'

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-green-600">🛝 PlayFinder</Link>
        <div className="flex items-center gap-3">
          <Link href="/" className={`text-sm font-medium ${pathname === '/' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>Map</Link>
          <Link href="/list" className={`text-sm font-medium ${pathname === '/list' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>List</Link>
          {user ? (
            <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-full font-medium">
              Sign in
            </button>
          )}
        </div>
      </nav>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
```

- [ ] **Step 2: Update root layout**

Replace `app/layout.tsx` with:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlayFinder — Rate Kids Playgrounds',
  description: 'Discover and rate kids playgrounds near you across North America',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavBar />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Run dev and verify nav renders**

```bash
npm run dev
```
Expected: Nav bar shows "🛝 PlayFinder", Map, List links, Sign in button. No console errors.

- [ ] **Step 4: Commit**

```bash
git add components/NavBar.tsx app/layout.tsx
git commit -m "feat: add nav bar and root layout"
```

---

## Task 6: Google Places seeding API route

**Files:**
- Create: `lib/google-places.ts`
- Create: `app/api/seed-playgrounds/route.ts`

- [ ] **Step 1: Create Google Places fetch helper**

Create `lib/google-places.ts`:
```typescript
export type PlacesPlayground = {
  google_place_id: string
  name: string
  lat: number
  lng: number
  city: string | null
  country: 'CA' | 'US' | null
}

/** Fetch playgrounds from Google Places Nearby Search within a bounding box */
export async function fetchPlaygroundsNearby(
  lat: number,
  lng: number,
  radiusMeters: number = 5000
): Promise<PlacesPlayground[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY!
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=playground&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Places API error: ${res.status}`)
  const data = await res.json()

  return (data.results ?? []).map((place: any) => ({
    google_place_id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    city: place.vicinity?.split(',').pop()?.trim() ?? null,
    country: null, // enriched separately if needed
  }))
}
```

- [ ] **Step 2: Create seed API route**

Create `app/api/seed-playgrounds/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPlaygroundsNearby } from '@/lib/google-places'

export async function POST(request: Request) {
  const { lat, lng } = await request.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const playgrounds = await fetchPlaygroundsNearby(lat, lng)
  if (playgrounds.length === 0) {
    return NextResponse.json({ seeded: 0 })
  }

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('playgrounds')
    .upsert(playgrounds, { onConflict: 'google_place_id', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seeded: count ?? 0 })
}
```

- [ ] **Step 3: Test the seeding endpoint manually**

With `npm run dev` running:
```bash
curl -X POST http://localhost:3000/api/seed-playgrounds \
  -H "Content-Type: application/json" \
  -d '{"lat": 43.6532, "lng": -79.3832}'
```
Expected: `{"seeded": N}` where N > 0 (Toronto area). Check Supabase dashboard to confirm rows in `playgrounds` table.

- [ ] **Step 4: Commit**

```bash
git add lib/google-places.ts app/api/seed-playgrounds/
git commit -m "feat: add Google Places seeding API route"
```

---

## Task 7: Shared UI components — StarRating, AmenityChecklist, ReviewList

**Files:**
- Create: `components/StarRating.tsx`
- Create: `components/StarPicker.tsx`
- Create: `components/AmenityChecklist.tsx`
- Create: `components/ReviewList.tsx`

- [ ] **Step 1: Create read-only StarRating component**

Create `components/StarRating.tsx`:
```typescript
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
```

- [ ] **Step 2: Create interactive StarPicker component**

Create `components/StarPicker.tsx`:
```typescript
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
```

- [ ] **Step 3: Create AmenityChecklist component**

Create `components/AmenityChecklist.tsx`:
```typescript
import { AMENITIES } from '@/lib/amenities'
import type { Amenities } from '@/lib/supabase/types'

type Props = {
  /** Merged amenities from all ratings — key: % of raters who confirmed it */
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
```

- [ ] **Step 4: Create ReviewList component**

Create `components/ReviewList.tsx`:
```typescript
import type { Rating } from '@/lib/supabase/types'
import StarRating from './StarRating'

type Props = { ratings: Rating[] }

export default function ReviewList({ ratings }: Props) {
  if (ratings.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">No reviews yet — be the first!</p>
  }
  return (
    <div className="space-y-3">
      {ratings.map(r => (
        <div key={r.id} className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{r.users?.display_name ?? 'Anonymous'}</span>
            <StarRating rating={r.stars} size="sm" />
          </div>
          {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
          <p className="text-gray-400 text-xs mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/StarRating.tsx components/StarPicker.tsx components/AmenityChecklist.tsx components/ReviewList.tsx
git commit -m "feat: add StarRating, StarPicker, AmenityChecklist, ReviewList components"
```

---

## Task 8: RatingForm component

**Files:**
- Create: `components/RatingForm.tsx`

- [ ] **Step 1: Create RatingForm component**

Create `components/RatingForm.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AMENITIES, DEFAULT_AMENITIES } from '@/lib/amenities'
import type { Amenities } from '@/lib/supabase/types'
import StarPicker from './StarPicker'

type Props = {
  playgroundId: string
  userId: string
  onSuccess: () => void
  onNeedAuth: () => void
}

export default function RatingForm({ playgroundId, userId, onSuccess, onNeedAuth }: Props) {
  const [stars, setStars] = useState(0)
  const [amenities, setAmenities] = useState<Amenities>(DEFAULT_AMENITIES)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  function toggleAmenity(key: keyof Amenities) {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) { onNeedAuth(); return }
    if (stars === 0) { setError('Please select a star rating'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.from('ratings').upsert({
      playground_id: playgroundId,
      user_id: userId,
      stars,
      amenities,
      comment: comment.trim() || null,
    }, { onConflict: 'playground_id,user_id' })

    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
        <StarPicker value={stars} onChange={setStars} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">What's there?</label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map(({ key, label, icon }) => (
            <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${amenities[key] ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <input
                type="checkbox"
                checked={amenities[key]}
                onChange={() => toggleAmenity(key)}
                className="sr-only"
              />
              <span>{icon}</span>
              <span className="text-sm">{label}</span>
              {amenities[key] && <span className="ml-auto">✓</span>}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Any tips for other parents?"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right">{comment.length}/280</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-4 font-semibold disabled:opacity-50 text-base"
      >
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/RatingForm.tsx
git commit -m "feat: add RatingForm component with star picker and amenity checkboxes"
```

---

## Task 9: Playground Detail page

**Files:**
- Create: `app/playground/[id]/page.tsx`

- [ ] **Step 1: Create Playground Detail page**

Create `app/playground/[id]/page.tsx`:
```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import AmenityChecklist from '@/components/AmenityChecklist'
import ReviewList from '@/components/ReviewList'
import RatingFormWrapper from './RatingFormWrapper'
import type { Amenities } from '@/lib/supabase/types'

type Props = { params: { id: string } }

export default async function PlaygroundDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: playground } = await supabase
    .from('playgrounds')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!playground) notFound()

  const { data: ratings } = await supabase
    .from('ratings')
    .select('*, users(display_name)')
    .eq('playground_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Tally amenities: for each key, count how many raters confirmed it
  const allRatings = ratings ?? []
  const amenityTotals: Partial<Record<keyof Amenities, number>> = {}
  for (const r of allRatings) {
    const a = r.amenities as Amenities
    for (const key of Object.keys(a) as (keyof Amenities)[]) {
      if (a[key]) amenityTotals[key] = (amenityTotals[key] ?? 0) + 1
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">{playground.name}</h1>
      {playground.city && <p className="text-gray-500 text-sm mb-3">{playground.city}{playground.country ? `, ${playground.country}` : ''}</p>}

      <div className="flex items-center gap-2 mb-6">
        <StarRating rating={playground.avg_rating} count={playground.rating_count} size="lg" />
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Amenities</h2>
        <AmenityChecklist amenities={amenityTotals} ratingCount={playground.rating_count} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Rate This Playground</h2>
        <RatingFormWrapper playgroundId={playground.id} userId={user?.id ?? null} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Reviews ({allRatings.length})</h2>
        <ReviewList ratings={allRatings} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Create RatingFormWrapper (client component for auth modal)**

Create `app/playground/[id]/RatingFormWrapper.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RatingForm from '@/components/RatingForm'
import AuthModal from '@/components/AuthModal'

type Props = { playgroundId: string; userId: string | null }

export default function RatingFormWrapper({ playgroundId, userId }: Props) {
  const [showAuth, setShowAuth] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-600">Thanks for your rating!</p>
        <button onClick={() => { setSubmitted(false); router.refresh() }} className="mt-3 text-sm text-gray-500 underline">
          Edit your rating
        </button>
      </div>
    )
  }

  if (!userId) {
    return (
      <>
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-gray-600 mb-4">Sign in to rate this playground</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Sign in to rate
          </button>
        </div>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    )
  }

  return (
    <>
      <RatingForm
        playgroundId={playgroundId}
        userId={userId}
        onSuccess={() => setSubmitted(true)}
        onNeedAuth={() => setShowAuth(true)}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/playground/
git commit -m "feat: add playground detail page with ratings and amenity summary"
```

---

## Task 10: Map View (Home page)

**Files:**
- Create: `components/MapView.tsx`
- Create: `components/AmenityFilterChips.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create AmenityFilterChips component**

Create `components/AmenityFilterChips.tsx`:
```typescript
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
```

- [ ] **Step 2: Create MapView component**

Create `components/MapView.tsx`:
```typescript
'use client'
import { useEffect, useState, useCallback } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Playground } from '@/lib/supabase/types'
import type { AmenityKey } from '@/lib/amenities'
import AmenityFilterChips from './AmenityFilterChips'

const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 } // Toronto

export default function MapView() {
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [filters, setFilters] = useState<AmenityKey[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // Fall back to Toronto if denied
    )
  }, [])

  // Seed + load playgrounds when center changes
  const loadPlaygrounds = useCallback(async (lat: number, lng: number) => {
    // Seed from Google Places
    await fetch('/api/seed-playgrounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
    // Load from Supabase within ~10km bounding box
    const delta = 0.09 // ~10km
    const { data } = await supabase
      .from('playgrounds')
      .select('*')
      .gte('lat', lat - delta).lte('lat', lat + delta)
      .gte('lng', lng - delta).lte('lng', lng + delta)
    setPlaygrounds(data ?? [])
  }, [])

  useEffect(() => { loadPlaygrounds(center.lat, center.lng) }, [center])

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="playground-map"
          className="flex-1"
          onCameraChanged={ev => {
            const c = ev.detail.center
            setCenter({ lat: c.lat, lng: c.lng })
          }}
        >
          {playgrounds.map(pg => (
            <AdvancedMarker
              key={pg.id}
              position={{ lat: pg.lat, lng: pg.lng }}
              onClick={() => router.push(`/playground/${pg.id}`)}
              title={pg.name}
            />
          ))}
        </Map>
      </APIProvider>
      <div className="py-3 bg-white border-t border-gray-200 shadow-lg">
        <AmenityFilterChips active={filters} onChange={setFilters} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update home page**

Replace `app/page.tsx` with:
```typescript
import MapView from '@/components/MapView'

export default function HomePage() {
  return <MapView />
}
```

- [ ] **Step 4: Run and verify map loads**

```bash
npm run dev
```
Open http://localhost:3000. Expected: Google Map centered on your location (or Toronto), playground pins visible, filter chips at bottom. Clicking a pin navigates to the detail page.

- [ ] **Step 5: Commit**

```bash
git add components/MapView.tsx components/AmenityFilterChips.tsx app/page.tsx
git commit -m "feat: add map view with playground pins and amenity filter chips"
```

---

## Task 11: List View page

**Files:**
- Create: `components/PlaygroundCard.tsx`
- Create: `app/list/page.tsx`

- [ ] **Step 1: Create PlaygroundCard component**

Create `components/PlaygroundCard.tsx`:
```typescript
import Link from 'next/link'
import type { Playground } from '@/lib/supabase/types'
import { AMENITIES } from '@/lib/amenities'
import StarRating from './StarRating'
import { formatDistance } from '@/lib/distance'

type Props = {
  playground: Playground
  distanceKm?: number
}

export default function PlaygroundCard({ playground, distanceKm }: Props) {
  return (
    <Link href={`/playground/${playground.id}`} className="block border-b border-gray-100 py-4 hover:bg-gray-50 px-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{playground.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={playground.avg_rating} count={playground.rating_count} size="sm" />
          </div>
          {playground.city && <p className="text-gray-400 text-xs mt-1">{playground.city}</p>}
        </div>
        {distanceKm !== undefined && (
          <span className="text-sm text-gray-400 ml-3 flex-shrink-0">{formatDistance(distanceKm)}</span>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create List View page**

Create `app/list/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Playground } from '@/lib/supabase/types'
import PlaygroundCard from '@/components/PlaygroundCard'
import { distanceKm } from '@/lib/distance'

export default function ListPage() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    async function load() {
      let query = supabase.from('playgrounds').select('*').order('avg_rating', { ascending: false })
      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)
      const { data } = await query.limit(50)
      setPlaygrounds(data ?? [])
    }
    load()
  }, [search])

  const sorted = userLocation
    ? [...playgrounds].sort((a, b) =>
        distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : playgrounds

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-14 bg-white border-b border-gray-200 px-4 py-3 z-30">
        <input
          type="search"
          placeholder="🔍 Search playgrounds..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No playgrounds found</p>
      ) : (
        sorted.map(pg => (
          <PlaygroundCard
            key={pg.id}
            playground={pg}
            distanceKm={userLocation ? distanceKm(userLocation.lat, userLocation.lng, pg.lat, pg.lng) : undefined}
          />
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify list view works**

Open http://localhost:3000/list. Expected: list of playgrounds (seeded from Task 6 test), searchable, sorted by distance if location granted.

- [ ] **Step 4: Commit**

```bash
git add components/PlaygroundCard.tsx app/list/
git commit -m "feat: add list view with search and distance sorting"
```

---

## Task 12: Deploy to Vercel

**Files:**
- No file changes — deployment configuration

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

- [ ] **Step 2: Import project in Vercel**

Go to https://vercel.com/new, import your GitHub repo. When prompted for environment variables, add:
```
NEXT_PUBLIC_SUPABASE_URL=https://aebneimvzphbfbmmqxzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your maps key>
GOOGLE_PLACES_API_KEY=<your places key>
```

- [ ] **Step 3: Add production redirect URL in Supabase**

Go to https://supabase.com/dashboard/project/aebneimvzphbfbmmqxzt/auth/url-configuration and add:
```
https://<your-vercel-domain>.vercel.app/auth/callback
```

- [ ] **Step 4: Add production domain to Google Cloud Console**

In Google Cloud Console → APIs & Credentials → your OAuth client → Authorized JavaScript Origins, add your Vercel domain: `https://<your-vercel-domain>.vercel.app`

- [ ] **Step 5: Verify production deploy**

Open your Vercel URL. Expected: app loads, map shows playgrounds, sign in works, rating form submits successfully.

- [ ] **Step 6: Final commit with any deploy fixes**

```bash
git add -A
git commit -m "chore: production deploy ready"
git push
```
