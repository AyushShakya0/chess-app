# Sovereign Chess — Full Platform Redesign & Full-Stack Architecture Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Transform Sovereign Chess into an authoritative, Chess.com-grade luxury chess platform featuring a persistent left sidebar navigation, customizable piece sets, a full-featured live home dashboard with real-time open challenges broadcast and 1-click acceptance, Google OAuth authentication via Appwrite, relational persistence via Supabase, and deployment on Vercel.

**Architecture:** 
- **Frontend (Vercel):** Next.js 15 App Router, React 19, Tailwind CSS 3.4 with Sovereign luxury theme tokens (Obsidian `#0d0f12`, Surface `#14171f`, Border `#252a36`, Imperial Gold `#d4a359`), and a responsive persistent left sidebar.
- **Backend (Appwrite):** Authentication (Google OAuth + Email/Password), User Sessions, and Realtime WebSocket event channels for instant challenge dispatch and notification broadcasts.
- **Database (Supabase PostgreSQL):** Relational storage with Row Level Security (RLS) for user profiles, game archives, move trees, live challenge state, and dynamic ELO rating histories.
- **Game Engine & Rules:** Authoritative client/server move validation with `chess.js`, multi-piece set SVG renderers, stockfish evaluation, and monotonic clocks.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4, Appwrite Client SDK (`appwrite`), Supabase JS SDK (`@supabase/supabase-js`), Chess.js, Three.js, Lucide Icons.

---

## Global Constraints

1. **Theme Identity:** Maintain the Sovereign luxury dark & gold aesthetic (`#0d0f12` canvas, `#14171f` cards, `#252a36` borders, `#d4a359` imperial gold).
2. **Left Sidebar Architecture:** Primary navigation (`Home`, `Play Online`, `Play Computer`, `Custom Game`, `Puzzles`, `Tournaments`, `Leaderboard`, `Friends`, `Settings`) must live in the **persistent left sidebar** (Chess.com layout), leaving the top bar clean and uncluttered.
3. **Piece Set Extensibility:** Board themes and piece sets must be independently selectable. The default Staunton vector set must remain pristine, while new sets (Neo Gold, Wood Carved, Alpha Modern, 8-Bit Arcade) are selectable via settings.
4. **Real-time Challenge Synchronization:** When an open challenge is created, it must broadcast instantly to all active connected user dashboards. Accepting a challenge must instantly transition both challenger and acceptor into the live game room (`/play/[roomId]`).
5. **No Regressions:** All existing 55 unit tests must remain passing, TypeScript check must remain 0 errors (`npx tsc --noEmit`), and the Next.js production build (`npm run build`) must compile all routes with 0 errors.

---

## Review Focus (5 Critical Failure Modes & Edge Cases)

1. **Challenge Race Condition:** Two players click "Accept" on the same open challenge simultaneously. *Expectation:* Database atomic lock/claim ensures exactly one player joins, while the second receives an instant "Challenge already accepted" toast and remains on the dashboard.
2. **Realtime WebSocket Reconnection:** Network disconnect during a live game or challenge broadcast. *Expectation:* Appwrite/Supabase realtime client auto-reconnects with exponential backoff and synchronizes active room state without desyncing the board clock.
3. **Google OAuth Session Hydration & Database Sync:** A user signs in via Google OAuth on Appwrite, but no corresponding Supabase profile row exists yet. *Expectation:* On first auth load, the sync engine idempotently creates/updates the Supabase `profiles` record with username, avatar, and starting 1200 ELO.
4. **Piece Set Fallback & SVG Scaling:** User selects a custom piece set (e.g. Neo Gold or Wood), but an SVG glyph is missing or fails to render. *Expectation:* Gracefully fall back to the Staunton piece SVG without crashing the chessboard canvas.
5. **Mobile & Tablet Responsive Sidebar:** Screen width $< 768\text{px}$. *Expectation:* The left sidebar collapses into an icon-only rail or bottom navigation bar, preventing horizontal scroll while preserving 44×44px touch targets.

---

## Task Decomposition

### Task 1: Chess.com-Style Persistent Left Sidebar Navigation

**Files:**
- Create: `components/navigation/sidebar.tsx`
- Modify: `components/navigation/app-shell.tsx:1-50`
- Modify: `components/navigation/navbar.tsx:1-120`
- Test: `tests/sidebar.test.ts`

**Interfaces:**
- Consumes: `usePathname()` from Next.js, `useAuth()` from `@/lib/stores/auth-store`
- Produces: `<Sidebar />` component exporting navigation items (`home`, `online`, `bots`, `custom`, `puzzles`, `tournaments`, `leaderboard`, `friends`, `settings`) with gold active pills and collapse toggles.

- [x] **Step 1: Write unit test for Sidebar navigation state**
```typescript
// tests/sidebar.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { SIDEBAR_NAV_ITEMS } from "../components/navigation/sidebar-items.ts";

test("Sidebar Navigation - contains all 9 core Chess.com sections", () => {
  const expectedIds = ["home", "online", "bots", "custom", "puzzles", "tournaments", "leaderboard", "friends", "settings"];
  const actualIds = SIDEBAR_NAV_ITEMS.map((item) => item.id);
  for (const id of expectedIds) {
    assert.ok(actualIds.includes(id), `Missing sidebar nav item: ${id}`);
  }
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --experimental-strip-types --test tests/sidebar.test.ts`
Expected: FAIL (module not found)

- [x] **Step 3: Implement `components/navigation/sidebar-items.ts` and `components/navigation/sidebar.tsx`**
Create the navigation model and the vertical sidebar component:
- Top: Golden Knight logo (`SovereignLogo`) with brand text.
- Middle: Vertical nav buttons with icons, labels, hotkey badges, and gold active pills (`bg-[#d4a359] text-black font-black`).
- Bottom: User profile mini-card (avatar, username, rating) + Collapse sidebar toggle.
- Clean responsive layout: hidden on small mobile, expandable drawer via hamburger.

- [x] **Step 4: Update `components/navigation/app-shell.tsx`**
Replace top navbar dominance with the persistent two-column layout:
- Left: `<Sidebar />` (width `w-64` expanded, `w-20` collapsed on desktop).
- Top: Clean header with breadcrumbs, live online player counter, and notification bell.
- Right: Main scrollable viewport for dashboard and game arenas.

- [x] **Step 5: Run test to verify it passes**
Run: `node --experimental-strip-types --test tests/sidebar.test.ts`
Expected: PASS

- [x] **Step 6: Commit**
```bash
git add components/navigation/ tests/sidebar.test.ts
git commit -m "feat(ui): add persistent Chess.com-style left sidebar navigation"
```

---

### Task 2: Multi-Piece Set Architecture & Custom Piece Selector

**Files:**
- Create: `components/chess/piece-sets.tsx`
- Modify: `components/chess/pieces.tsx:1-80`
- Modify: `lib/stores/settings-store.ts:1-60`
- Modify: `components/chess/settings-modal.tsx:180-260`
- Test: `tests/piece-sets.test.ts`

**Interfaces:**
- Consumes: `PieceSetStyle` ("classic" | "gold" | "wood" | "modern" | "pixel") from `settings-store.ts`
- Produces: `renderChessPiece(type: PieceSymbol, color: Color, style: PieceSetStyle)` returning tailored SVG components.

- [x] **Step 1: Write unit test for multi-piece set generator**
```typescript
// tests/piece-sets.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { getPieceSetMetadata, SUPPORTED_PIECE_SETS } from "../components/chess/piece-sets.ts";

test("Piece Sets Engine - provides all 5 distinct design styles", () => {
  const styles = ["classic", "gold", "wood", "modern", "pixel"];
  for (const s of styles) {
    const meta = getPieceSetMetadata(s);
    assert.ok(meta, `Piece set ${s} must have metadata`);
    assert.ok(meta.name.length > 0);
  }
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --experimental-strip-types --test tests/piece-sets.test.ts`
Expected: FAIL

- [x] **Step 3: Implement `components/chess/piece-sets.tsx`**
Define vector renderers for:
1. `classic`: Staunton Vector (the tournament standard, preserving current SVGs).
2. `gold`: Sovereign Imperial Gold (metallic gold gradients `#FFF2CC` $\to$ `#D4A359` with obsidian dark accents).
3. `wood`: Walnut & Golden Maple Carved textures.
4. `modern`: Bauhaus Geometric minimalist silhouettes.
5. `pixel`: 8-Bit Arcade retro gaming shapes.

- [x] **Step 4: Update `components/chess/pieces.tsx` and `components/chess/settings-modal.tsx`**
Connect `ChessPiece` component to read the active `pieceSet` from `useSettings()`.
In the Settings Modal (Appearance tab), render live visual previews of King, Knight, and Pawn for each piece set.

- [x] **Step 5: Run test to verify it passes**
Run: `node --experimental-strip-types --test tests/piece-sets.test.ts`
Expected: PASS

- [x] **Step 6: Commit**
```bash
git add components/chess/ lib/stores/ tests/piece-sets.test.ts
git commit -m "feat(chess): add customizable piece sets with live preview in settings"
```

---

### Task 3: Appwrite & Supabase Hybrid Backend Architecture

**Files:**
- Create: `lib/appwrite/client.ts`
- Create: `lib/appwrite/auth.ts`
- Create: `lib/supabase/schema.sql`
- Modify: `lib/stores/auth-store.ts:1-120`
- Modify: `components/auth/auth-modal.tsx:1-150`
- Test: `tests/appwrite-auth.test.ts`

**Interfaces:**
- Consumes: Environment variables `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Produces: `signInWithGoogle()`, `signInWithEmail()`, `signUpWithEmail()`, `signOut()`, and user synchronization hooks.

- [x] **Step 1: Write test for Appwrite auth wrapper contract**
```typescript
// tests/appwrite-auth.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { formatAuthError, validateUsername } from "../lib/appwrite/auth-helpers.ts";

test("Auth Helpers - validates usernames and formats oauth errors", () => {
  assert.equal(validateUsername("Grandmaster123").valid, true);
  assert.equal(validateUsername("").valid, false);
  assert.equal(validateUsername("ab").valid, false); // min 3 chars
  assert.equal(validateUsername("bad name!").valid, false); // alphanumeric only
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --experimental-strip-types --test tests/appwrite-auth.test.ts`
Expected: FAIL

- [x] **Step 3: Implement Appwrite client & auth services**
- `lib/appwrite/client.ts`: Initialize Appwrite `Client`, `Account`, `Databases`, and `Realtime`.
- `lib/appwrite/auth.ts`: Implement `loginWithGoogle()` via `account.createOAuth2Session('google', redirectSuccess, redirectFailure)`.
- `lib/appwrite/auth-helpers.ts`: Error message mapping and username validation.

- [x] **Step 4: Update `components/auth/auth-modal.tsx`**
Wire the Google button directly to `signInWithGoogle()`, and update modal inputs with high-contrast accessibility labels and gold buttons.

- [x] **Step 5: Run test to verify it passes**
Run: `node --experimental-strip-types --test tests/appwrite-auth.test.ts`
Expected: PASS

- [x] **Step 6: Commit**
```bash
git add lib/appwrite/ components/auth/ tests/appwrite-auth.test.ts
git commit -m "feat(auth): integrate Appwrite Google OAuth and session management"
```

---

### Task 4: Real-time Open Challenges & 1v1 Dashboard Feed

**Files:**
- Create: `lib/services/challenge-service.ts`
- Create: `components/dashboard/open-challenges-feed.tsx`
- Create: `app/api/challenge/create/route.ts`
- Create: `app/api/challenge/accept/route.ts`
- Test: `tests/challenges.test.ts`

**Interfaces:**
- Consumes: Appwrite Realtime / Supabase Realtime channel `challenges`
- Produces:
  - `createChallenge(timeControl: string, rated: boolean, color: "white" | "black" | "random"): Promise<Challenge>`
  - `acceptChallenge(challengeId: string): Promise<{ roomId: string }>`
  - `subscribeToOpenChallenges(onUpdate: (challenges: Challenge[]) => void): () => void`

- [x] **Step 1: Write test for challenge state lifecycle**
```typescript
// tests/challenges.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { filterActiveChallenges, type OpenChallenge } from "../lib/services/challenge-types.ts";

test("Challenge Engine - filters expired and claimed challenges", () => {
  const now = Date.now();
  const sampleChallenges: OpenChallenge[] = [
    { id: "c1", creatorName: "Ayush", creatorElo: 1642, timeControl: "10+0", status: "open", createdAt: now - 1000 },
    { id: "c2", creatorName: "Hikaru", creatorElo: 2500, timeControl: "3+0", status: "accepted", createdAt: now - 5000 },
    { id: "c3", creatorName: "OldMatch", creatorElo: 1200, timeControl: "5+0", status: "open", createdAt: now - 700000 }, // expired > 10m
  ];
  const active = filterActiveChallenges(sampleChallenges, now);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, "c1");
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --experimental-strip-types --test tests/challenges.test.ts`
Expected: FAIL

- [x] **Step 3: Implement Challenge service and API endpoints**
- `lib/services/challenge-types.ts` & `lib/services/challenge-service.ts`: Handle creating, broadcasting, and accepting open match challenges.
- `app/api/challenge/create/route.ts`: Validate time control, store in active challenges pool, broadcast via Realtime channel.
- `app/api/challenge/accept/route.ts`: Atomically assign acceptor, spawn room in room manager, return `roomId`.

- [x] **Step 4: Build `<OpenChallengesFeed />` component**
Render incoming live challenge cards on the home page dashboard:
- Shows challenger avatar, username, rating badge, time control pill (`3 min`, `10 min`).
- Gold **[Accept]** button: When clicked, triggers accept mutation and routes directly to `/play/[roomId]`.
- Empty state: "No open challenges. Create one above to play worldwide!"

- [x] **Step 5: Run test to verify it passes**
Run: `node --experimental-strip-types --test tests/challenges.test.ts`
Expected: PASS

- [x] **Step 6: Commit**
```bash
git add lib/services/ components/dashboard/ app/api/challenge/ tests/challenges.test.ts
git commit -m "feat(challenges): implement real-time open challenges broadcast and acceptance"
```

---

### Task 5: Chess.com-Style Sovereign Dashboard (Home Page Redesign)

**Files:**
- Create: `components/dashboard/quick-play-grid.tsx`
- Create: `components/dashboard/daily-puzzle-widget.tsx`
- Create: `components/dashboard/player-overview-widget.tsx`
- Create: `components/dashboard/recent-activity-stream.tsx`
- Modify: `app/page.tsx:1-40`
- Test: `tests/dashboard.test.ts`

**Interfaces:**
- Consumes: `<Sidebar />`, `<QuickPlayGrid />`, `<OpenChallengesFeed />`, `<DailyPuzzleWidget />`, `<PlayerOverviewWidget />`
- Produces: The complete Chess.com-style home dashboard view in `app/page.tsx`.

- [x] **Step 1: Write test for Quick Play time control mapping**
```typescript
// tests/dashboard.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { QUICK_PLAY_OPTIONS, parseTimeControlSeconds } from "../components/dashboard/quick-play-types.ts";

test("Quick Play - time control calculation handles increments correctly", () => {
  assert.equal(parseTimeControlSeconds("1+0").baseSeconds, 60);
  assert.equal(parseTimeControlSeconds("3+0").baseSeconds, 180);
  assert.equal(parseTimeControlSeconds("10+0").baseSeconds, 600);
  assert.equal(parseTimeControlSeconds("15+10").incrementSeconds, 10);
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `node --experimental-strip-types --test tests/dashboard.test.ts`
Expected: FAIL

- [x] **Step 3: Implement Dashboard sub-components**
- `components/dashboard/quick-play-grid.tsx`: Grid with 1-click match creation buttons (Bullet 1m, Blitz 3m, Blitz 5m, Rapid 10m, Custom Game).
- `components/dashboard/daily-puzzle-widget.tsx`: Compact tactical puzzle card with mini-board and direct solve link.
- `components/dashboard/player-overview-widget.tsx`: Rating cards (Rapid 1642, Blitz 1580, Puzzles 1720) with win rate meter.
- `components/dashboard/recent-activity-stream.tsx`: Recent match records with result indicators (`+ Won`, `- Lost`).

- [x] **Step 4: Assemble Master Dashboard in `app/page.tsx`**
Structure `app/page.tsx` into a responsive 12-column layout:
- Left Column (8 cols): Quick Play Grid $\to$ Live Open Challenges Feed $\to$ Recent Matches.
- Right Column (4 cols): Player Overview Widget $\to$ Daily Puzzle Widget $\to$ Quick Leaderboard.
- Connect seamlessly with the persistent Left Sidebar.

- [x] **Step 5: Run test to verify it passes**
Run: `node --experimental-strip-types --test tests/dashboard.test.ts`
Expected: PASS

- [x] **Step 6: Commit**
```bash
git add components/dashboard/ app/page.tsx tests/dashboard.test.ts
git commit -m "feat(dashboard): complete Chess.com-style home page dashboard with live matchmaking"
```

---

### Task 6: Comprehensive Verification & Vercel Production Build

**Files:**
- Modify: `README.md`
- Audit: All routes, TypeScript types, unit tests, and production build output.

- [x] **Step 1: Run TypeScript compiler check**
Run: `npx tsc --noEmit`
Expected: 0 errors

- [x] **Step 2: Run full unit test suite**
Run: `npm test`
Expected: 100% passing across all test files

- [x] **Step 3: Run linter**
Run: `npm run lint`
Expected: Clean with 0 errors

- [x] **Step 4: Run Next.js production build**
Run: `npm run build`
Expected: Build exit code 0, all static and dynamic routes compiled successfully

- [x] **Step 5: Fast-forward merge `develop` into `main` and push to GitHub**
```bash
git checkout main
git merge --ff-only develop
git push origin develop
git push origin main
```
