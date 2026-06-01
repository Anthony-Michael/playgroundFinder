# Playground Rating App — Design Spec
**Date:** 2026-06-01  
**Status:** Approved

---

## Overview

A free, web-based app for parents and caregivers to discover and rate kids' playgrounds across North America (Canada & US). Users can browse a map or list of nearby parks, see at-a-glance amenity info, and read/submit star ratings. No account needed to browse — account required to submit a rating.

---

## Goals

- Help parents quickly find playgrounds that suit their kids' needs
- Provide crowd-sourced amenity info (shade, washrooms, splash pad, parking, equipment)
- Keep it free and easy to use on a phone browser
- Start with North America (Canada & US)

---

## Users

- **Browsing (anonymous):** Any visitor can view playgrounds, ratings, and amenity details without signing up
- **Rating (authenticated):** Users must create an account (email or Google sign-in) to submit a rating

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Hosting | Vercel (free tier) |
| Backend / DB | Supabase (already initialized) |
| Auth | Supabase Auth — email + Google sign-in |
| Map | Google Maps JavaScript API |
| Playground data | Google Places API (seeding) |

---

## Key Screens

### 1. Map View (Home)
- Interactive Google Map centered on user's current location
- Playground pins on the map; click a pin to open the detail panel
- Filter chips at the bottom: Splash Pad, Shade, Washrooms, Parking
- Top nav: app name, search bar, login/account button

### 2. List View
- Searchable list of playgrounds sorted by distance from user
- Each row shows: name, star rating, distance, amenity icon strip
- Tapping a row opens the Playground Detail screen

### 3. Playground Detail
- Playground name, address, average star rating + total rating count
- Amenity checklist (crowd-sourced from all ratings):
  - Shade / Covered area
  - Washrooms
  - Splash Pad / Water Park
  - Parking
  - Baby Swings
  - Climbing Structure
  - Slides
- Recent reviews (display name, stars, optional comment)
- "Rate This Playground" button — prompts login if not authenticated

### 4. Rate a Playground
- 1–5 star picker
- Amenity checkboxes (same list as above — user confirms what's there)
- Optional short text comment (max 280 chars)
- Submit button — saves to Supabase, updates avg_rating on the playground record

---

## Database Schema

### `playgrounds`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | |
| lat | float | |
| lng | float | |
| google_place_id | text | Unique, from Google Places |
| avg_rating | float | Recomputed on each new rating |
| city | text | |
| country | text | "CA" or "US" |
| created_at | timestamp | |

### `ratings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| playground_id | uuid | FK → playgrounds |
| user_id | uuid | FK → auth.users |
| stars | int | 1–5 |
| amenities | jsonb | e.g. `{"shade": true, "washrooms": false, ...}` |
| comment | text | Optional, max 280 chars |
| created_at | timestamp | |

### `users` (profile table)
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users |
| display_name | text | Shown on reviews |
| created_at | timestamp | |

**Security:** Supabase Row Level Security (RLS) ensures users can only edit/delete their own ratings. Anyone can read playgrounds and ratings.

---

## Data Seeding

On first load of a region, the app queries Google Places API for `type=playground` within the visible map bounds and upserts results into the `playgrounds` table using `google_place_id` as the unique key. This means playgrounds auto-populate as users explore the map — no manual data entry needed.

---

## Auth Flow

1. Anonymous user taps "Rate This Playground"
2. Modal prompts: "Sign in to rate" — options: Email or Continue with Google
3. After auth, user is returned to the rate form with context preserved
4. Subsequent visits: session persisted via Supabase session cookie

---

## Amenities Tracked

- Shade / Covered area
- Washrooms / Toilets
- Splash Pad / Water Park
- Parking
- Baby Swings
- Climbing Structure
- Slides
- Benches / Seating (for parents)

---

## Out of Scope (for now)

- Native mobile app (iOS/Android)
- Photo uploads
- Sub-ratings (safety, cleanliness, age suitability)
- Playground "claiming" by parks/municipalities
- Notifications or saved favorites
