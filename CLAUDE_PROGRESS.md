# Cybroatrix Development Progress

# Cybroatrix Development Progress

## Current Status

- Overall progress: 100% of implementable work in this sandbox; **Testing and Production
  build are NOT done** — this sandbox has no network/node_modules, so `npm install`,
  `npm run typecheck`, `npm run lint`, and `npm run build` could not be run here. Every
  file was written carefully by hand against the project's strict TypeScript config and
  manually cross-checked (every import verified against actual exports, every lazy-loaded
  page's default export confirmed, hook ordering checked file-by-file, JSX balance
  checked), but this is not a substitute for an actual compile. **Next action for you:**
  run `npm install && npm run typecheck && npm run build` locally and paste back any
  errors — say "continue" with the errors and I'll fix them.
- Current phase: Done pending your build verification.
- Last completed task: Full manual review pass across all 27 touched files (see below).
- Current task: none — waiting on build verification.
- Next task: fix any typecheck/build errors you report; after that, the only remaining
  items are the manual Firebase Console steps listed below (I cannot perform these from
  here) and your own end-to-end testing per the spec's Section 17 checklist.

## Completed

- [x] Project inspection
- [x] Firebase configuration (Firestore + Storage added alongside existing RTDB/Auth)
- [x] Firebase Authentication (Google + Email, password reset, email verification)
- [x] Google Sign-In (dedicated pages + navbar quick button + Events.tsx's own modal, all
      funnel through the same AuthContext methods and the same global setup-redirect guard)
- [x] Email registration (dedicated /register page, collects username inline)
- [x] Email login (dedicated /login page)
- [x] Username system (format validation, reserved words, transactional uniqueness,
      live availability checks, change-username flow)
- [x] Firestore profiles (users/{uid} + usernames/{username}, full CRUD)
- [x] Public username profiles (/:username, with not-found and private states)
- [x] Dashboard
- [x] Settings
- [x] Profile editing
- [x] Profile picture (Storage upload/replace/remove)
- [x] Security rules (Firestore + Storage)
- [ ] Testing — not run; needs you to do Section 17's manual QA pass locally
- [ ] Production build — not run in this sandbox; needs `npm run build` locally

## Current Implementation

Full auth + profile + dashboard + settings system integrated into the existing Vite +
React + TS + Tailwind + Firebase app, preserving 100% of existing functionality (RTDB
presence counter, Events.tsx CTF/challenge system, all existing pages/design system).
See the "Important Decisions" section for the architectural choices, and the git-less
diff below for exactly what changed. No new npm dependencies were added — routing,
toasts, spinners, etc. are all hand-built on top of what already existed (`firebase`,
`framer-motion`, `lucide-react`), partly because this sandbox has no network to install
with, but this was also the spec's own explicit preference.

## Files Changed

**New files (23):**
`src/lib/{username,authErrors,profile,storage,router,authGuards}.{ts,tsx}`,
`src/lib/AuthContext.tsx` (rewritten in place, see Modified),
`src/components/DashboardLayout.tsx`, `src/components/ui/{Modal,EmptyState,FormElements}.tsx`,
`src/pages/{Login,Register,ForgotPassword,ResetPassword,SetupProfile,Dashboard,Settings,
ProfileEdit,PublicProfile,NotFound}.tsx`,
`firestore.rules`, `storage.rules`, `firebase.json`, `firestore.indexes.json`,
`CLAUDE_PROGRESS.md`

**Modified files (5):**
`src/App.tsx` (full rewrite — new router, 3-tier chrome system, all routes wired),
`src/lib/firebase.ts` (extended — Firestore/Storage init, account-management functions),
`src/lib/useAuth.ts` (AuthContextType extended with profile/profileLoading),
`src/components/Navbar.tsx` (auth-aware nav links, fixed silent-failure on quick Google
sign-in), `src/pages/Home.tsx` (added Dashboard link to hero widget),
`src/pages/Events.tsx` (2-line fix: its own auth error handling now uses the shared
friendly-error mapper instead of a buggy raw-message string-strip)

**Untouched (deliberately):** everything else, including all of Events.tsx's actual
event/challenge/leaderboard logic, About.tsx, Services.tsx, Contact.tsx, Footer.tsx,
index.css, tailwind.config.js, package.json.

## Database Structure

**Cloud Firestore (new):**
```
users/{uid}       — uid, username, displayName, email, photoURL, bio, location, website,
                     github, linkedin, twitter, skills[], projects[], achievements[],
                     badges[], profileVisibility ('public'|'private'), createdAt,
                     updatedAt, lastLoginAt
usernames/{name}  — { uid, createdAt } — doc ID is the lowercase username itself;
                     existence = "taken". This is the uniqueness lock.
```
**Realtime Database (existing, untouched):** presence/*, events/*, and whatever else
Events.tsx already used — not migrated, not duplicated.

## Routes

New: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/setup-profile`,
`/dashboard`, `/settings`, `/profile/edit`, `/:username` (dynamic, format+reserved-word
validated). Existing, unchanged: `/`, `/about`, `/services`, `/events`, `/contact`.
Anything else → NotFound. All routing is a hand-rolled History-API router (no
react-router-dom) extending the app's existing pattern — see `src/lib/router.tsx`.

## Firebase Configuration

No new environment variables — `.env.example` already had every `VITE_FIREBASE_*` var
needed for Firestore/Storage (same Firebase project, no separate config). See "Manual
Firebase Console steps" below for what YOU still need to do that I cannot do from here.

## Known Issues / Limitations

- **Cannot verify the build** — see Current Status above. This is the main outstanding
  risk; please run the build and report back errors.
- **Projects/Achievements/Badges support add + remove only, not inline edit** (Profile
  Edit page) — a deliberate scope cut; correcting an entry means removing and re-adding
  it. Noted so a future session doesn't "fix" this as a bug.
- **"Badges" has no separate admin/award system** — treated as a self-managed showcase
  list like achievements, since the spec didn't define who grants them.
- Settings' password change only covers email/password accounts; Google-only accounts
  correctly show a "no password to manage" message instead.
- No per-field profile privacy — the Privacy setting is a single public/private toggle
  for the whole profile, not granular field-level visibility.

## Next Steps

1. **You:** run `npm install && npm run typecheck && npm run build` locally. If anything
   fails, come back and say "continue" with the error output.
2. **You:** complete the manual Firebase Console steps below (cannot be done from this
   sandbox).
3. **You:** run through the Section 17 manual QA checklist from the original spec
   (register→username→profile→dashboard→public profile; login; Google auth; public
   profile while logged out; security — try reading another user's private profile
   directly; logout; password reset; responsive layouts).
4. If bugs turn up in any of the above, say "continue" and describe them — I'll fix them
   without redoing finished work.

## Important Decisions

(unchanged from earlier in this file — see below)
- **Firestore, not Realtime Database**, for the new profile/username system, even though
  RTDB is already used elsewhere (presence, events) — the spec explicitly and repeatedly
  named Cloud Firestore. Both coexist in the same Firebase project without conflict.
- **No new npm packages** — routing extends the app's existing hand-rolled History-API
  router rather than adding react-router-dom; no toast library; everything built on
  firebase + framer-motion + lucide-react, which were already present.
- **Dashboard vs Settings vs /profile/edit split**: Dashboard = overview/hub only (no
  forms). `/profile/edit` = the one place that edits bio/social/skills/projects/
  achievements/badges/avatar. `/settings` = Account/Password/Email verification/Privacy
  toggle/Danger Zone. No duplicate editing surfaces despite the spec's own bullet lists
  overlapping across these three sections.
- **Privacy is enforced in firestore.rules, not just the UI** — a private profile is
  genuinely unreadable by non-owners at the database level (permission-denied), which
  PublicProfile.tsx catches and renders as a "this profile is private" state.
- Events.tsx's own inline auth modal was **kept as-is structurally** — only its two
  `catch` blocks were changed to stop leaking raw Firebase error text.
- A **global guard in App.tsx** (`useGlobalProfileSetupGuard`) catches sign-ins from
  *any* entry point (navbar quick-Google, Home hero widget, Events.tsx's own modal) and
  routes a newly-authenticated-but-profileless user to /setup-profile — not just sign-ins
  that happened via the dedicated /login or /register pages.

## Manual Firebase Console Steps Required (cannot be done from this sandbox)

1. **Enable Cloud Firestore** — Console → Build → Firestore Database → Create database
   (native mode, choose a region). It isn't enabled by default even though `firebase`
   is already in your dependencies.
2. **Enable Firebase Storage** — Console → Build → Storage → Get started.
3. **Deploy the security rules** — via Firebase CLI: `firebase deploy --only
   firestore:rules,storage:rules` (uses the `firestore.rules`/`storage.rules`/
   `firebase.json` files now in your repo root), or paste their contents into the
   Console's Rules tab for each product manually.
4. **Confirm your production domain is authorized** — Console → Authentication →
   Settings → Authorized domains → make sure `cybroatrix.com` is listed (needed for
   Google popup sign-in and for password-reset action links to work in production).
5. **Enable the sign-in providers** if not already on — Console → Authentication →
   Sign-in method → enable Google and Email/Password.
6. Double check `VITE_FIREBASE_STORAGE_BUCKET` in your real `.env` matches the bucket
   Storage actually provisions (Firebase sometimes uses a `.firebasestorage.app` domain
   for new projects rather than `.appspot.com` — copy it exactly from the Console).


### Pages — ALL DONE (in addition to the 4 auth pages logged earlier):
- `src/components/DashboardLayout.tsx` — shared tab-nav shell (Dashboard/Edit
  Profile/Settings tabs + "View Public Profile" button) used by all three authenticated
  pages below
- `src/pages/SetupProfile.tsx` — username + display name for users authenticated but
  without a profile yet (mainly new Google sign-ins); redirects to /dashboard once a
  profile exists (both "already had one" and "just created one" cases)
- `src/pages/Dashboard.tsx` — overview hub only (per the Important Decisions split): avatar/
  name/bio summary, skills/projects/achievements/badges counts, quick links to Edit
  Profile/Settings/Public Profile, account email+verification status with resend, logout
- `src/pages/Settings.tsx` — Account (read-only name/username/email + email verification +
  password-change form for password accounts), Privacy (public/private toggle on
  `profileVisibility`), Security (shows Google-vs-password method, "email me a reset
  link" shortcut, logout), Danger Zone (delete-account modal: reauth via password or
  Google popup depending on provider, type-DELETE confirmation, deletes Firestore data
  BEFORE the Auth user — order matters, since deleting Auth first would sign them out and
  fail the Firestore rules' auth check on the follow-up delete)
- `src/pages/ProfileEdit.tsx` — the one place that edits bio/location/social links/skills/
  projects/achievements/badges/avatar. Avatar and username each save independently
  (avatar immediately on file select; username via its own Save button with the same
  live-availability-check pattern as Register/SetupProfile); everything else batches into
  one "Save Changes". Projects/achievements/badges support add + remove (no inline edit —
  a deliberate scope cut, remove-and-re-add covers correction; noted here so it isn't
  "fixed" as a bug later).
- `src/pages/PublicProfile.tsx` — `/:username`. Three non-found states: loading,
  not-found, and **private** (caught via a Firestore `permission-denied` error, since
  privacy is enforced at the **security-rules** level, not just hidden client-side — a
  private profile literally isn't readable by non-owners once firestore.rules is
  deployed). Owner viewing their own private profile still sees it (rules allow
  self-reads regardless of visibility) with a small "only you can see this" banner.
- `src/pages/NotFound.tsx` — generic 404 for anything that isn't a static route or a
  valid/reserved-free username shape

Also added to `src/lib/firebase.ts` since Settings needed them:
`reauthenticateWithPassword` (standalone, used by delete-account; `changePassword` now
calls it internally instead of duplicating the credential logic).

**Not yet touched:** App.tsx, Navbar.tsx, Home.tsx, Events.tsx, rules files, firebase.json.
This is genuinely everything left — see Next Steps below for the exact remaining list.

### Shared UI components — DONE:
- `src/components/ui/FormElements.tsx` — `GoogleIcon`, `FormField`, `FormError`,
  `FormSuccess`, `PasswordField` (show/hide toggle), `Spinner`
- `src/components/ui/Modal.tsx` — `Modal` (backdrop + feature-card, scale-in/fade-in anims)
- `src/components/ui/EmptyState.tsx` — `EmptyState` (icon + title + description + action)
All three built from verified exact classes/tokens in index.css (input-cyber, btn-*,
feature-card, font-cyber, gradient-text, scale-in/fade-in, etc.) — not guessed.

### Pages — DONE:
- `src/pages/Login.tsx` — email/password + Google, forgot-password link, redirects away
  if already signed in (via `useRedirectIfAuthenticated`)
- `src/pages/Register.tsx` — username (live debounced availability check against
  Firestore, shows available/taken/invalid inline), display name, email, password +
  confirm, Google option. On email submit: `signUpEmail` then `createUserProfile`
  (handles the rare mid-flight username-taken race by surfacing an error — the user
  self-heals via the redirect-to-/setup-profile guard, which fires automatically since
  they're now authenticated but profileless). Sends verification email (best-effort,
  non-blocking) after successful registration.
- `src/pages/ForgotPassword.tsx` — sends reset email via `sendResetPasswordEmail`;
  deliberately shows the same "check your email" success state for auth/user-not-found
  too, to avoid leaking which emails have accounts.
- `src/pages/ResetPassword.tsx` — reads `?mode=resetPassword&oobCode=...` from the URL,
  verifies via `verifyResetCode`, shows new-password form, calls
  `completePasswordReset`. Handles invalid/expired-link and success states.
- Also added to `src/lib/firebase.ts`: `sendResetPasswordEmail` now passes
  `actionCodeSettings` (`handleCodeInApp: true`, `url: origin + /reset-password`) so the
  email link lands directly on our own page instead of Firebase's generic hosted one —
  **note for final report:** still worth telling the user to confirm `cybroatrix.com` is
  in Firebase Console → Authentication → Settings → Authorized domains.

**Not yet touched:** App.tsx, Navbar.tsx, Home.tsx, Events.tsx, rules files. No
SetupProfile/Dashboard/Settings/ProfileEdit/PublicProfile/NotFound pages yet.

### Lib layer — DONE, do not redo:
- `src/lib/username.ts` — format validation, sanitization, reserved-word list (new file)
- `src/lib/authErrors.ts` — `getAuthErrorMessage(error)` friendly Firebase error mapper (new file)
- `src/lib/firebase.ts` — extended (not rewritten) with: `firestoreDb`, `storage` exports;
  `sendResetPasswordEmail`, `verifyResetCode`, `completePasswordReset`,
  `sendVerificationEmail`, `isGoogleUser`, `isPasswordUser`, `changePassword`,
  `reauthenticateWithGoogle`, `deleteFirebaseAccount`. All existing exports (db, auth,
  googleProvider, dbList/dbGet/dbPush/dbSet/dbUpdate/dbRemove, trackUserPresence,
  subscribeToLiveCount, signInWithGoogle, signOutUser, signInWithEmail,
  registerWithEmail) untouched.
- `src/lib/profile.ts` — Firestore CRUD: `UserProfile`/`ProjectEntry`/`AchievementEntry`/
  `BadgeEntry` types, `isUsernameAvailable`, `getUserProfile`, `getProfileByUsername`,
  `subscribeToUserProfile` (onSnapshot, used by AuthContext), `createUserProfile`
  (transactional username claim), `updateUserProfile`, `changeUsername` (transactional
  reclaim), `touchLastLogin`, `deleteUserProfileData`, `UsernameTakenError` (new file)
- `src/lib/storage.ts` — `uploadAvatar`/`removeAvatar`/`validateAvatarFile`, fixed path
  `avatars/{uid}/avatar.{ext}`, sweeps all known extensions on every upload/removal so
  switching file types never orphans a file (new file)
- `src/lib/router.tsx` — `parseRoute`, `Route`/`StaticRouteName` types, `RouterProvider`,
  `useRoute()`, `useNavigate()`. Same History-API mechanism as the old inline App.tsx
  router, just extracted + extended with dynamic `:username` matching (checks format +
  reserved words) (new file)
- `src/lib/authGuards.tsx` — `RequireAuth` component (redirect to /login, or
  /setup-profile if no profile yet; shows spinner while resolving) and
  `useRedirectIfAuthenticated()` hook (bounces signed-in users away from guest-only
  pages) (new file)
- `src/lib/AuthContext.tsx` — extended: now also subscribes to the user's Firestore
  profile via `subscribeToUserProfile` and calls `touchLastLogin` on each resolved
  sign-in. Context now exposes `profile`/`profileLoading` in addition to the original
  `user`/`loading`/sign-in methods (all original methods unchanged).
- `src/lib/useAuth.ts` — `AuthContextType` extended with `profile`/`profileLoading`.

**Not yet touched:** App.tsx, Navbar.tsx, Home.tsx, Events.tsx, any pages, any rules files.

## Completed

- [x] Project inspection
- [x] Firebase configuration (already present — see notes below)
- [ ] Firebase Authentication (Google + Email exist; need error handling, verification, password reset wired to UI)
- [ ] Google Sign-In (works in Navbar/Events already; needs profile-check hookup)
- [ ] Email registration (exists inline in Events.tsx only; needs dedicated /register page + username)
- [ ] Email login (exists inline in Events.tsx only; needs dedicated /login page)
- [ ] Username system
- [ ] Firestore profiles
- [ ] Public username profiles
- [ ] Dashboard
- [ ] Settings
- [ ] Profile editing
- [ ] Profile picture
- [ ] Security rules
- [ ] Testing
- [ ] Production build (cannot run in this sandbox — no network/node_modules; user must run locally)

## Current Implementation (pre-existing, found during inspection)

**Stack:** React 18 + TypeScript (strict) + Vite + Tailwind + Framer Motion + lucide-react.
**No react-router-dom** — App.tsx has a hand-rolled History-API router (`Page` union +
`parseLocation`/`navigate`). No node_modules in the uploaded zip and this sandbox has
**no network access**, so no new npm packages can be added/verified here — everything new
is built with only what's already in package.json.

Pre-existing auth plumbing (already working, do not duplicate):
- `src/lib/firebase.ts` — Firebase app init, **Realtime Database** (`db`) with generic
  `dbList/dbGet/dbPush/dbSet/dbUpdate/dbRemove` helpers (used by Events.tsx for
  events/challenges/leaderboards — unrelated to profiles, leave alone), plus Auth exports
  (`auth`, `googleProvider`, `signInWithGoogle`, `signOutUser`, `signInWithEmail`,
  `registerWithEmail`), and `trackUserPresence`/`subscribeToLiveCount` (RTDB live counter
  in Navbar — leave alone).
- `src/lib/AuthContext.tsx` + `src/lib/useAuth.ts` — React context exposing
  `{ user, loading, signInGoogle, signInEmail, signUpEmail, signOut }`. `AuthProvider`
  already wraps the whole app in App.tsx.
- `src/pages/Events.tsx` (1512 lines) has its **own inline** email/password + Google auth
  modal (for gating event creation/joining) with a `Modal`, `EmptyState`, `Field` helper
  components at the bottom of the file, and an `.input-cyber`/`.btn-google`/`.btn-primary`
  form pattern. This is the visual reference for all new auth UI. Its error handling does
  ad-hoc string-stripping of `error.message` (buggy — falls back to raw Firebase text in
  some cases). Plan: replace just its two `catch` blocks to use the new shared
  `getAuthErrorMessage()` helper; don't otherwise touch this file.
- **No Firestore usage anywhere yet.** No Profile/Dashboard/Settings/Login/Register pages
  exist in this zip.
- `CHANGES.md` in the repo reveals the project *used to* have a Supabase-backed profile/
  portfolio system ("Portfolio v2" — cover banner, rank, solve heatmap, achievements,
  skill tags) that was fully removed when they migrated to Firebase; the Firebase
  replacement for profiles was never built. That's what this task completes. Not
  attempting to resurrect the old CTF-specific stats (rank/heatmap/solve counts) — those
  live in Events.tsx's RTDB data model and are out of scope; profile fields follow this
  task's spec (bio/location/website/social links/skills/projects/achievements/badges).

Design system already in place and to be reused as-is (see `src/index.css`):
`--blue #0066ff`, `--cyan #00ccff`, `--bg #070709`, `--bg-card #0d0d12`; utility classes
`.input-cyber`, `.btn-primary`, `.btn-outline`, `.btn-white`, `.btn-danger`, `.btn-google`,
`.feature-card`, `.social-card`, `.gradient-text`, `.gradient-bg`, `.font-cyber` (Orbitron),
`font-rajdhani`/`font-inter`, `.divider-gradient`, `.scale-in`/`.slide-up`/`.fade-in`
(modal anims), `.line-clamp-1/2`. Dark cyberpunk CTF-community aesthetic throughout.

## Database Structure (planned)

**Cloud Firestore** (new — see Important Decisions for why Firestore alongside existing RTDB):
```
users/{uid}
  uid, username, displayName, email, photoURL, bio, location, website,
  github, linkedin, twitter, skills[], projects[], achievements[], badges[],
  profileVisibility: 'public' | 'private',
  createdAt, updatedAt, lastLoginAt   (serverTimestamp)

usernames/{lowercaseUsername}
  uid, createdAt   — existence = uniqueness lock; doc ID is the username itself
```
Realtime Database (existing, untouched): `presence/{uid}`, `events/*`, `messages/*`, etc.

## Routes (planned)

`/login`, `/register`, `/forgot-password`, `/reset-password` (handles Firebase
`?mode=resetPassword&oobCode=...`), `/setup-profile`, `/dashboard`, `/settings`,
`/profile/edit`, `/:username` (catch-all, validated against username syntax + reserved
words, else generic not-found). Existing: `/`, `/about`, `/services`, `/events`, `/contact`.

## Firebase Configuration

`.env.example` already lists exactly the right `VITE_FIREBASE_*` vars (nothing to add).
Firestore + Storage init being added to `firebase.ts` alongside existing RTDB/Auth init —
same Firebase project, no new env vars needed. **Manual console steps required from the
user** (cannot be done from this sandbox): enable Cloud Firestore (native mode) in the
Firebase console, enable Firebase Storage, and deploy `firestore.rules`/`storage.rules`
(via `firebase deploy --only firestore:rules,storage:rules` or paste into console).

## Known Issues

- **This sandbox has no network access and no node_modules** — `npm install`,
  `npm run build`, `npm run typecheck`, `npm run lint` cannot be run here. `firebase` is
  already a locked dependency in package-lock.json so no new install is needed for any of
  this work, but the user must run `npm run typecheck && npm run build` locally/in CI and
  report back any errors — code has been written carefully by hand against strict
  TypeScript but is unverified by a real compiler.

## Next Steps

1. Build `src/lib/` foundations: extend `firebase.ts` (Firestore + Storage init, account
   mgmt functions), `authErrors.ts`, `username.ts`, `profile.ts` (Firestore CRUD + username
   uniqueness), `router.tsx` (route parsing incl. `:username` + reserved words).
2. Extend `AuthContext`/`useAuth` to carry `profile`/`profileLoading`.
3. Shared UI bits: `Modal`, `EmptyState`, `PasswordField`, Google icon.
4. Build pages in order: Login, Register, ForgotPassword, ResetPassword, SetupProfile,
   Dashboard, Settings, ProfileEdit, PublicProfile, NotFound.
5. Rewire `App.tsx` routing + protected routes; update `Navbar.tsx` (auth links/avatar
   menu → Dashboard/Settings/Logout); tiny Home.tsx hero tweak (Dashboard link).
6. Patch Events.tsx's two auth `catch` blocks to use `getAuthErrorMessage()`.
7. Write `firestore.rules`, `storage.rules`, minimal `firebase.json`.
8. Update this file with final status + hand off a files-changed summary to the user.

## Important Decisions

- **Firestore, not Realtime Database, for the new profile/username system** — even though
  the app already uses RTDB elsewhere. The spec explicitly and repeatedly said "Cloud
  Firestore" (incl. Firestore-syntax security rules), which is a deliberate, specific ask,
  not incidental wording. RTDB stays exactly as-is for presence/events (it's a good fit for
  that). Both run in the same Firebase project without conflict; this is a normal
  polyglot-persistence setup, not duplication — there was no pre-existing Firestore-based
  or RTDB-based profile system to avoid duplicating.
- **No new npm packages** (no react-router-dom, no toast lib, etc.) — partly because this
  sandbox has no network to install/verify with, but also because it's what the spec asked
  for ("avoid unnecessary dependencies"). New routing extends the app's existing hand-rolled
  History-API router rather than introducing a second routing system.
- **Dashboard vs Settings vs /profile/edit split** (spec has overlapping bullets across all
  three): Dashboard = overview/hub only (summary card, quick stats, links out — not a form).
  `/profile/edit` = the one place that edits bio/location/social links/skills/projects/
  achievements/badges/avatar. `/settings` = Account/Password/Email verification/Privacy
  visibility toggle/Danger Zone (delete account). No duplicate editing surfaces.
- **"Badges"** — spec lists user-manageable badges but defines no separate badge-granting
  admin system. Treating as a simple self-managed showcase list (like achievements), not
  building an award/verification system — out of scope.
- Events.tsx's own inline auth modal is being **kept as-is structurally** (it serves a
  different purpose — quick gate for event actions) — only its raw-error leakage is fixed.
