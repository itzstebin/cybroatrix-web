# Changes made in this pass

## Vercel deployment prep
Added `vercel.json` with an SPA rewrite rule. Vercel doesn't read Netlify's
`public/_redirects` file, so without this, any direct link into the app
other than `/` — a shared `/profile/xyz` link, refreshing on `/events`,
someone bookmarking `/about` — would 404 on Vercel. Both config files can
coexist in the repo; each platform only reads its own.

No env vars are in this repo (by design — `.env` is gitignored), so you'll
need to add the same 7 `VITE_FIREBASE_*` variables in Vercel's project
settings that you added in Netlify's, or you'll hit the identical blank
screen there too.

---

# Changes from previous passes
(Nav bar EVENTS removal + Events page animation, Supabase removal,
Portfolio v2, security/animation/bug-fix pass — see prior deliveries for
full detail; summarized here for continuity.)

## Nav bar & Events animation
Removed "EVENTS" from the top nav (still reachable via Footer/homepage).
Event card grid now staggers in; all 4 modals (auth, create/edit, details,
delete confirm) animate open *and* close via Framer Motion + AnimatePresence.

## Supabase fully removed
Repo-side removal confirmed complete. You still need to manually delete or
lock down the actual project on supabase.com — outside what's reachable
from here.

## Portfolio v2 — professional upgrade
Cover banner + accent color, rank among all members, solves by
category/difficulty, solve activity heatmap, recent activity feed, 12
achievements shown locked/unlocked, skill tags, member-since date.

## Security & cleanup
Firebase config moved to `.env` (gitignored) — this is also why Netlify
needed the env vars added manually, and why Vercel will need the same.
Removed the unused Supabase client + dependency. Tightened `any` types.

## Real bugs fixed (confirmed via `tsc`/`eslint`)
Routing bug in `App.tsx`; `detailsEvent` null-safety in `Events.tsx`;
duplicate auth listener in `Navbar.tsx`; Home page CTAs causing full page
reloads; Contact page's dead social-link promise; `font-inter` /
`font-rajdhani` silently compiling to nothing sitewide (84 uses); stray
literal backslashes rendering on the About page; Fast Refresh breakage in
`AuthContext.tsx`.

## Performance
Route-based code-splitting via `React.lazy` for all non-Home pages.

## Verified
`npm run typecheck`, `npm run lint`, and `npm run build` all pass clean as
of the last source-code change. This pass only added a static JSON config
file (no source touched), confirmed valid JSON, no rebuild needed.

## Known, lower-priority remaining items
- Main JS bundle ~665KB (174KB gzipped)
- `Events.tsx` still one large (~1,500 line) file — works, fully
  type-safe, animated, just not split into smaller components yet
- Avatar upload is URL-paste only, no file upload pipeline
- No public/private visibility toggle on portfolios yet




