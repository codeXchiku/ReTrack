# Study Dojo — Version 1 Build Prompts

> "Study Dojo" is a placeholder name. Rename it any time (a rename is a small task in SD-031).
> Platform: Android first. React Native CLI + TypeScript. 100% offline. No login. No ads. No analytics.

This document is a set of **31 tickets**. Each ticket contains one **copy-paste prompt** for your IDE agent (Antigravity / Cursor style). Run the tickets **in order**. Every ticket ends with a **Test & Fix** loop, so the agent checks its own work, finds problems and fixes them before it stops.

---

## 0. How to use this document

1. Create the rules file `AGENTS.md` in your project root (Section 4). Do this once.
2. Also copy this whole document into your project as `docs/BUILD_PROMPTS.md`, so the agent can read the reference tables in Appendix A later.
3. Open ticket **SD-001**. Copy the block under **Prompt** and paste it into your IDE agent. Start a **new chat for every ticket** (this keeps the agent's memory small and focused).
4. When the agent finishes it must send a **Ticket Report** (format is in `AGENTS.md`). Read the part called **"Not verified — needs you"** and do those checks by hand on the emulator.
5. If something is wrong, paste the problem into the same chat using this template:

```
Problem in SD-0XX.
What I did:
What I expected:
What happened (paste the exact error or describe the screen):
Fix it, then re-run the Test & Fix loop from AGENTS.md and send a new Ticket Report.
```

6. When the ticket is good, move to the next ticket. **Do not skip tickets**: each one depends on the earlier ones.
7. If the agent wants to add a library, change the architecture or change a decision in a ticket, `AGENTS.md` forces it to **ask you first**. Say yes or no. If unsure, say no and keep the ticket as written.

Ticket sizes: **S** = small (under about an hour of agent work), **M** = medium, **L** = large.

---

## 1. Ticket board

| ID | Title | Epic | Size | Depends on |
|---|---|---|---|---|
| SD-001 | Baseline audit & tooling | A. Foundation | S | — |
| SD-002 | Architecture skeleton (folders, registry, events) | A. Foundation | M | 001 |
| SD-003 | Theme & shared UI kit | A. Foundation | L | 002 |
| SD-004 | Storage layer (MMKV + SQLite + migrations) | A. Foundation | M | 002 |
| SD-005 | Navigation shell (4 tabs + sub-tabs) | A. Foundation | M | 003, 004 |
| SD-006 | Subjects feature | B. Subjects & onboarding | M | 004, 005 |
| SD-007 | Settings data & onboarding flow | B. Subjects & onboarding | M | 006 |
| SD-008 | Timer engine (pure logic) | C. Sessions & focus | M | 002 |
| SD-009 | Sessions feature (history, daily totals, streaks) | C. Sessions & focus | M | 004, 008 |
| SD-010 | Focus store, persistence & controller | C. Sessions & focus | M | 006, 008, 009 |
| SD-011 | Simple Timer page + active session view | C. Sessions & focus | L | 005, 010 |
| SD-012 | Pomodoro page + break & finish views | C. Sessions & focus | M | 011 |
| SD-013 | Background timer & notifications | C. Sessions & focus | L | 012 |
| SD-014 | End-of-session feedback (haptics, celebration) | C. Sessions & focus | S | 012 |
| SD-015 | Do Not Disturb native module (Kotlin) | D. Silence | L | 002 |
| SD-016 | Silence integration with the timer | D. Silence | L | 013, 015 |
| SD-017 | Cards data layer | E. Cards | M | 006 |
| SD-018 | Scheduler & queue builder (pure logic) | E. Cards | M | 017 |
| SD-019 | Library page & subject card list | E. Cards | M | 017, 003 |
| SD-020 | Add / edit card sheet | E. Cards | M | 019 |
| SD-021 | Review page (flip, 3 buttons) | E. Cards | L | 014, 018, 020 |
| SD-022 | Break-time quick review | E. Cards | M | 012, 021 |
| SD-023 | Stats data layer | F. Progress & home | M | 009, 017 |
| SD-024 | Stats page UI | F. Progress & home | M | 023 |
| SD-025 | Settings page | F. Progress & home | M | 007, 016 |
| SD-026 | Backup export / import | F. Progress & home | M | 025 |
| SD-027 | Home dashboard | F. Progress & home | M | 010, 021, 023 |
| SD-028 | Polish: states, accessibility, device sizes | G. Release | M | 027 |
| SD-029 | Performance & app size | G. Release | M | 028 |
| SD-030 | Extensibility drill (prove nothing breaks) | G. Release | S | 029 |
| SD-031 | Full regression & release build | G. Release | L | 030 |

---

## 2. Library index

You never install these by hand. Each ticket tells the agent which ones to install. Versions are not pinned here because they change fast: the agent must pick versions **compatible with the React Native version in your project** and follow each library's official install guide.

| Library / tech | Used for | Installed in |
|---|---|---|
| TypeScript (strict), ESLint, Prettier, Jest | safe code, checks, unit tests | SD-001 |
| babel-plugin-module-resolver | `@/` import alias | SD-001 |
| zustand | small global state stores | SD-003 |
| react-native-mmkv | fast key-value storage (settings, timer state) | SD-004 |
| @op-engineering/op-sqlite | offline SQLite database | SD-004 |
| dayjs | dates, streaks, due times | SD-004 |
| react-native-reanimated (+ its required worklets package) | animations (flip, ring, sheet, bars) | SD-003 |
| react-native-gesture-handler | taps, swipes, sheet drag | SD-003 |
| react-native-svg | progress ring, charts, icons, confetti | SD-003 |
| react-native-safe-area-context | safe areas (Screen component) | SD-003 |
| react-native-screens | native screens for navigation | SD-005 |
| @react-navigation/native, /native-stack, /bottom-tabs, /material-top-tabs | navigation | SD-005 |
| react-native-tab-view, react-native-pager-view | swipeable sub-tabs | SD-005 |
| @react-native-community/datetimepicker | exam date picker | SD-007 |
| @notifee/react-native | foreground service, ongoing timer notification, scheduled alerts | SD-013 |
| react-native-keep-awake | keep screen on during a session | SD-011 |
| react-native-haptic-feedback | vibration feedback | SD-014 |
| Kotlin native module (own code) | Do Not Disturb on/off + safety alarm | SD-015 |
| react-native-fs, @react-native-documents/picker, react-native-share | backup export / import | SD-026 |

Two items from the earlier PDF are **intentionally left out** to keep the app small and avoid needing asset files: `lottie-react-native` (the celebration is drawn with SVG + Reanimated instead) and `react-native-sound` (the end-of-session sound comes from the notification channel). You can add them later through a new ticket.

---

## 3. Architecture in one page (why you can add features later without breaking old ones)

**Folder structure** (the agent creates this in SD-002):

```
src/
  app/
    App.tsx                  # root component
    AppProviders.tsx         # theme, safe-area, gesture-handler, navigation providers
    bootstrap.ts             # startup: open DB, run migrations, load settings, init features
    features.ts              # THE ONLY FILE where a feature is plugged in (one import line each)
  navigation/
    RootNavigator.tsx        # root stack + tabs, built from the registry
    TabBar.tsx               # custom bottom bar
    SubTabBar.tsx            # custom top tab bar
  core/                      # shared infrastructure. Knows NOTHING about features.
    config/                  # constants
    db/                      # sqlite client, migration runner, migrations/0001_*.ts ...
    storage/                 # MMKV wrapper, createSetting(), zustand persist adapter
    prefs/                   # theme mode, haptics on/off, sound on/off
    theme/                   # tokens, ThemeProvider, useTheme
    ui/                      # Screen, Text, Button, Chip, Card, Toggle, ProgressRing, BottomSheet, Toast...
    registry/                # feature registry + Slot system (extension points)
    events/                  # typed event bus
    time/                    # date helpers, formatters, injectable clock
    navigation/              # navigationRef + navigateTo() helper
    feedback/                # haptics wrapper
    utils/                   # createId, assert, etc.
  features/
    subjects/   sessions/   focus/   silence/   cards/   stats/   settings/   backup/   onboarding/   home/
      index.ts               # PUBLIC API of the feature (the only file others may import)
      feature.ts             # the feature's manifest (what it plugs into the app)
      data/  logic/  store/  screens/  components/  services/
  dev/                       # __DEV__ only: UI gallery, dev menu (never in release)
android/.../dnd/             # Kotlin: DndModule, DndPackage, DndRestoreReceiver
```

**The five rules that protect you:**

1. **Dependency rule.** `core` never imports from `features`. A feature may import `core/*` and the **`index.ts` of other features only**, never their inner files. No circular imports.
2. **Feature manifest.** Each feature has a `feature.ts` that declares what it adds: tabs, sub-tabs, root screens, slot items, backup provider, an `init()` function. To add a new feature: create a folder + add **one line** in `src/app/features.ts`.
3. **Slots (extension points).** Screens expose named slots, for example `home.dashboard`, `focus.setupHints`, `focus.breakPanel`, `settings.sections`, `onboarding.steps`. A new feature plugs its widget into a slot without editing the screen that hosts the slot.
4. **Event bus.** Features talk through typed events (`focus/phaseStarted`, `focus/finished`, `cards/reviewed`...). For example, the Silence feature listens to the timer's events, and the timer does not know Silence exists.
5. **Database migrations only move forward.** Every schema change is a **new numbered migration file**. An applied migration file is never edited. Each feature owns its repository; screens never write SQL.

---

## 4. The rules file: `AGENTS.md`

Create a file named `AGENTS.md` in the **root of your project** and paste everything inside the block below, exactly. If your IDE agent does not read `AGENTS.md` automatically, also paste it into the IDE's "Rules" setting. Every prompt in this document begins with "Read AGENTS.md first" as a backup.

````markdown
# AGENTS.md — Study Dojo

## 1. Product
Study Dojo is a small, fully offline Android app (React Native CLI, TypeScript) for exam students. It combines:
- Focus timers: Simple Timer (countdown/stopwatch) and Pomodoro.
- Simple Anki-style flashcards: the user types front and back, the app schedules reviews automatically.
- Silence: Do Not Disturb is switched on while a focus phase runs and restored afterwards.
- Stats, streaks, a daily goal and an exam countdown.
Navigation: 4 bottom tabs: Home, Focus (sub-tabs: Simple, Pomodoro), Cards (sub-tabs: Review, Library), Me (sub-tabs: Stats, Settings).

## 2. Hard constraints
- 100% offline. No network calls, no analytics, no crash-reporting SDKs, no login, no ads.
- Android first. Do not add iOS-specific work unless asked.
- TypeScript strict. No `any` (use `unknown` + narrowing). No `@ts-ignore` without a one-line reason and my approval.
- System fonts only. Keep the app small: do not add a library that is not named in the ticket.
- Never hard-code colors, spacing or font sizes in screens. Use theme tokens from `src/core/theme`.

## 3. Architecture rules (never break these)
- Folder map: src/app, src/navigation, src/core, src/features/<name>, src/dev. Features have: index.ts (public API), feature.ts (manifest), data/, logic/, store/, screens/, components/, services/.
- `src/core` must NOT import from `src/features`.
- A feature may import `src/core/*` and other features ONLY through their `index.ts`. Never import another feature's inner files. No circular imports.
- New features are plugged in ONLY by adding one line in `src/app/features.ts`. Do not edit other features to make room for a new one; use the registry (tabs, sub-tabs, screens, slots, backup) and the event bus.
- Feature-to-feature communication: typed events on `src/core/events` or slots. Not direct state access.
- Screens contain UI only. Business logic lives in `logic/` as pure functions (no React Native imports) so it can be unit-tested with Jest. Database access lives only in `data/` repositories.
- SQL migrations are numbered files in `src/core/db/migrations`. NEVER edit a migration that already exists. Schema change = new migration.
- Timestamps are epoch milliseconds (number). Calendar days are local-date strings `YYYY-MM-DD`. Time-dependent logic receives `now` as a parameter (no hidden `Date.now()` inside pure logic).
- IDs are strings from `core/utils/createId`.
- One component per file. Named exports only (no default exports), except where a library requires one. Files under ~300 lines: split when bigger.
- Every touchable has a minimum 44dp touch area and an `accessibilityLabel`. Animations are 400ms or shorter and respect reduced motion.

## 4. Dependency rules
- Use only the libraries the ticket names. If you think another library is needed, or a named one does not work with the installed React Native version, STOP and ask me. Do not substitute silently.
- Use the package manager already used by the project (check the lockfile). Check each library's compatibility with the installed React Native version and its official install steps before installing.
- My internet is slow and Gradle downloads can time out. Install libraries in small batches. If Gradle times out, raise the timeout or retry; do not delete node_modules, caches or the android/ build folders without asking.

## 5. Working rules for every ticket
1. Read the ticket fully. Write a short plan (max 8 bullets) before coding. List the existing files you will modify.
2. Implement ONLY this ticket. No extra features, no refactors of unrelated code.
3. If you must change a public API or behavior created by an earlier ticket: make the change additive and backward compatible. If that is impossible, STOP and ask me before changing it.
4. If you want to add anything that is not in the ticket (a feature, library, setting, screen, architecture change), STOP and ask me first. Wait for my answer.
5. Finish with the Test & Fix loop (Section 6) and the Ticket Report (Section 7). Then STOP. Do not start the next ticket.

## 6. Test & Fix loop (mandatory at the end of every ticket)
A. Static checks. Run: `npm run typecheck`, `npm run lint`, `npm test` (use the project's package manager). All must pass. Warnings you introduced must be fixed.
B. Unit tests. Every pure-logic function you wrote must have Jest tests, including edge cases. Tests must be meaningful (not just "renders").
C. Build and run on the emulator. Environment: Ubuntu, Android SDK at ~/Android/Sdk (no Android Studio), emulator AVD `rn_api35` (Pixel 6, API 35), no physical phone. Start the emulator (`~/Android/Sdk/emulator/emulator -avd rn_api35`, make sure ANDROID_HOME points to ~/Android/Sdk), Metro and the app yourself if they are not running. Run only ONE heavy process at a time where possible (the laptop has little RAM). Do not kill processes you did not start.
D. Walk through the ticket's TEST list on the emulator. Verify with evidence: adb screenshots (`adb exec-out screencap -p > shot.png`), `adb logcat -d` filtered for ReactNativeJS and errors, `adb shell uiautomator dump` for on-screen text, `adb shell input tap/swipe/text` for interaction, `adb shell dumpsys` and `adb shell settings get ...` for system state. Look at the screenshots; do not assume.
E. Write down EVERY problem you found (crashes, warnings in logcat, layout problems, wrong behavior, missing edge cases, regressions in earlier features). Fix each one, then re-run A–D. Repeat until clean.
F. Regression check: earlier tickets' screens must still open and work. At minimum run the full unit test suite and launch the app, switch through all tabs and sub-tabs, and check logcat for errors.
G. Anything you could not verify yourself (sound, real-device-only behavior, OEM-specific behavior) goes in "Not verified — needs you" with exact manual steps for me.
Never claim something works unless you ran it. Never mark a TEST item as passed if you could not check it.

## 7. Ticket Report format (send this at the end)
- Ticket: SD-0XX — title
- Done: bullet list of what now works.
- Files created / modified: grouped list.
- Libraries added: name + version + why (or "none").
- Problems found during testing and how I fixed them: bullet list (or "none found" only if you really tested).
- Tests: which commands passed, how many unit tests.
- Not verified — needs you: exact manual steps for me (or "none").
- Decisions I made that the ticket did not specify: bullet list.
- Risks / follow-ups for later tickets: bullet list.

## 8. Code style
- Zustand stores: one store per feature concern; use selectors (`useStore(s => s.x)`) to avoid re-renders. Persisted state goes through the MMKV adapter in `core/storage`.
- Lists use FlatList with stable `keyExtractor`, memoized row components.
- Handle loading, empty and error states on every screen that reads data.
- No `console.log` left in code (use a tiny `core/utils/log` that is silent in release).
- Comments explain WHY, not what. Keep public APIs small and documented with a short JSDoc.
````

---

## 5. Tickets

### Epic A — Foundation

---

### SD-001 — Baseline audit & tooling

| Size | Depends on | Libraries & tech |
|---|---|---|
| S | — | TypeScript, ESLint, Prettier, Jest, babel-plugin-module-resolver, React Native CLI, Android emulator `rn_api35` |

**Goal:** Check that your freshly installed project is healthy and set up the tooling that every later ticket needs. No features yet.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-001 — Baseline audit & tooling
GOAL: Confirm the existing React Native CLI project is healthy and set up the tooling every later ticket depends on. Do NOT build any feature.

STEPS
1. Audit and REPORT (do not change yet): React Native version, whether the New Architecture is enabled (android/gradle.properties newArchEnabled), whether Hermes is enabled, the package manager in use (lockfile), the Android applicationId, minSdk / targetSdk / compileSdk, Kotlin version, and the current app display name. If anything looks unusual (very old RN, missing Hermes), tell me.
2. TypeScript: make sure tsconfig.json has "strict": true plus "noUncheckedIndexedAccess": true, "noImplicitOverride": true, "resolveJsonModule": true. If the entry files are still JavaScript, convert App to TypeScript.
3. Path alias: "@/..." must map to "src/...". Configure babel-plugin-module-resolver (devDependency), tsconfig "paths", and Jest "moduleNameMapper" so imports like `import { x } from '@/core/utils/createId'` work in the app, in type-checking and in tests.
4. ESLint + Prettier: use the React Native default configs. Add the rules: "@typescript-eslint/no-explicit-any": "error", "no-console": "warn", and import/order is NOT required. Add package.json scripts: "typecheck": "tsc --noEmit", "lint": "eslint .", "test": "jest", "check": "npm run typecheck && npm run lint && npm test" (use the project's package manager syntax).
5. Jest: make sure `test` runs. Add one trivial test that proves the "@/" alias works.
6. Create src/app/App.tsx (move the template App there) and make index.js import it through the alias. The screen should only show the text "Study Dojo" for now, centered, dark background.
7. Lock the app to portrait: android:screenOrientation="portrait" on the main activity in AndroidManifest.xml.
8. Set the Android app display name to "Study Dojo" (android/app/src/main/res/values/strings.xml). Do not change applicationId.
9. Build and run on the emulator rn_api35 (start it yourself if needed).

LIBRARIES: typescript, eslint, prettier, jest, babel-plugin-module-resolver (all dev-only). Nothing else.

DONE WHEN
- `check` script passes with zero errors and zero warnings.
- App launches on the emulator and shows "Study Dojo" in portrait.
- The audit report from step 1 is in your Ticket Report.

TEST (verify each, with screenshot / command output)
1. `npm run check` is green.
2. The "@/" alias test passes, and a deliberately wrong alias import fails type-check (try it, then undo).
3. The app starts without red screen; `adb logcat -d | grep -i "ReactNativeJS\|AndroidRuntime"` shows no errors.
4. Rotating the emulator does not rotate the app.
5. The launcher label reads "Study Dojo".

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-002 — Architecture skeleton (folders, registry, events)

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-001 | TypeScript, Jest. No new runtime libraries. |

**Goal:** Build the empty skeleton that makes the app scalable: folders, the feature registry, slots and the event bus, with unit tests.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-002 — Architecture skeleton
GOAL: Create the folder structure and the extension mechanisms (feature registry, slots, event bus). No UI yet beyond a placeholder.

1) FOLDERS: create exactly the structure in AGENTS.md section 3 and the README section "Folder structure": src/app, src/navigation, src/core/{config,db,storage,prefs,theme,ui,registry,events,time,navigation,feedback,utils}, src/features/{subjects,sessions,focus,silence,cards,stats,settings,backup,onboarding,home}, src/dev. Put a tiny `.gitkeep` or an index.ts in empty folders. For every feature create `index.ts` (empty public API with a comment) and `feature.ts` exporting a manifest `{ id: '<name>' }` typed as FeatureManifest.

2) src/core/registry/types.ts — create these types (adjust only if TypeScript requires, and tell me):
   export type IconProps = { color: string; size: number };
   export type TabDef = { id: string; title: string; order: number; icon: (p: IconProps) => ReactElement; component?: ComponentType };
   export type SubTabDef = { tabId: string; id: string; title: string; order: number; component: ComponentType };
   export type ScreenDef = { name: string; component: ComponentType<any>; options?: Record<string, unknown> };
   export type SlotName = 'home.dashboard' | 'focus.setupHints' | 'focus.breakPanel' | 'onboarding.steps' | 'settings.sections';
   export type SlotItem = { id: string; order: number; component: ComponentType<any> };
   export type BackupProvider = { id: string; order: number; export: () => Promise<unknown>; clear: () => Promise<void>; import: (data: unknown) => Promise<void> };
   export type FeatureManifest = {
     id: string;
     tabs?: TabDef[];
     subTabs?: SubTabDef[];
     screens?: ScreenDef[];
     slots?: Partial<Record<SlotName, SlotItem[]>>;
     backup?: BackupProvider;
     init?: () => void | Promise<void>;   // runs once after the database is ready
   };
   (Slot names are a union so adding a new slot = adding one string here. This is the only allowed edit to core when a new slot is needed.)

3) src/core/registry/featureRegistry.ts: `registerFeatures(manifests)`, `getTabs()`, `getSubTabs(tabId)`, `getScreens()`, `getSlotItems(name)`, `getBackupProviders()`, `runFeatureInits()`. Sorted by `order` (stable). Duplicate feature id, duplicate tab id, duplicate sub-tab id within a tab, or duplicate slot item id within a slot must THROW a clear error. The registry is a plain module with no React.

4) src/core/registry/Slot.tsx: `<Slot name="home.dashboard" props={...} />` renders all items of that slot in order, each wrapped in its own error boundary so one broken widget cannot crash the screen (render nothing for the broken one and log in dev).

5) src/core/events: typed event bus. `events.ts` declares `AppEvents` (a type map). Start with exactly these events and payloads:
   'focus/phaseStarted': { sessionId: string; phase: 'focus'|'break'|'longBreak'; endsAt: number | null; silence: boolean }
   'focus/paused': { sessionId: string }
   'focus/resumed': { sessionId: string; phase: 'focus'|'break'|'longBreak'; endsAt: number | null; silence: boolean }
   'focus/stopped': { sessionId: string }
   'focus/finished': { sessionId: string; focusedSecs: number; completed: boolean }
   'sessions/saved': { sessionId: string; day: string }
   'cards/changed': { subjectId: string | null }
   'cards/reviewed': { cardId: string; rating: 'forgot' | 'hard' | 'easy' }
   'subjects/changed': {}
   'subjects/deleted': { subjectId: string }
   `bus.ts`: `on(event, handler)` returns an unsubscribe function, `off`, `emit(event, payload)`. A handler that throws must not stop other handlers (catch, log in dev). Adding a new event = adding one line to AppEvents.

6) src/core/utils: createId() (timestamp base36 + random, string), assert(cond, msg), log (silent when !__DEV__).
7) src/core/time/clock.ts: `type Clock = { now(): number }`, `systemClock`, and a `createFakeClock(start)` for tests.
8) src/app/AppProviders.tsx: a component that wraps its children (empty wrapper for now; later tickets add the theme, gesture-handler, safe-area, toast and dialog hosts here) and use it from App.tsx.
   src/app/features.ts: export `features: FeatureManifest[]` importing every feature manifest (this file is the ONLY place features get plugged in; add a comment saying so). src/app/bootstrap.ts: for now `registerFeatures(features)` and return; real startup comes in SD-004.
9) Add a short README.md section "Architecture" summarizing Section 3 of the build document: the 5 rules and "how to add a feature in 3 steps".

LIBRARIES: none new.

DONE WHEN
- The folder tree exists, `features.ts` lists all 10 feature manifests, registry/Slot/event bus work and are covered by Jest tests.
- App still launches (shows "Study Dojo").

TEST
1. Unit tests: registry sorting by order; duplicate ids throw (feature, tab, sub-tab, slot item); getSubTabs filters by tabId; getSlotItems of an unknown/empty slot returns []; bus delivers payloads to all handlers; unsubscribe works; a throwing handler does not block others; emit with no handlers is safe.
2. A test or script proving the dependency rule: add an ESLint `no-restricted-imports` (or a small Jest test scanning files) that FAILS when anything under src/core imports from src/features, and when a feature imports another feature's inner path (anything other than '@/features/<name>'). Prove it fails with a temporary bad import, then remove that import.
3. Slot test: a throwing slot item does not prevent siblings from rendering (use react-test-renderer / @testing-library only if already installed; otherwise test the error-boundary component logic and verify visually later in SD-005; tell me which).
4. `npm run check` is green; app launches on the emulator with no logcat errors.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-003 — Theme & shared UI kit

| Size | Depends on | Libraries & tech |
|---|---|---|
| L | SD-002 | react-native-reanimated (+ the worklets package your Reanimated version requires), react-native-gesture-handler, react-native-svg, zustand (theme mode lives in a small store; it is saved to disk in SD-004) |

**Goal:** One design system: dark-first theme, light theme, and reusable components so every later screen looks consistent.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-003 — Theme & shared UI kit
GOAL: Create the theme system and the shared components used by every screen. Visual style: calm, dark-first, big buttons, yellow = go, red = focus, teal = ok.

1) INSTALL (small batches, follow each official guide; pick versions compatible with the installed React Native):
   - react-native-reanimated (and the worklets package / Babel plugin that your chosen Reanimated major version requires; if it needs the New Architecture and the project does not have it, STOP and ask me),
   - react-native-gesture-handler (wrap the app root with GestureHandlerRootView in AppProviders),
   - react-native-svg,
   - react-native-safe-area-context (the Screen component needs it; SD-005 reuses it),
   - zustand.
   Rebuild the Android app and confirm it still launches before continuing.

2) THEME TOKENS (src/core/theme/tokens.ts). Two palettes, same keys:
   Dark:  background #1B1E3A, surface #2A2E55, surfaceAlt #3A3F70, text #FFFFFF, textMuted #8C90B5, primary #FFD23F, onPrimary #14141F, focus #FF4B3E, accent #3A6FF7, success #2EC4B6, danger #FF4B3E, border #3A3F70
   Light: background #F2F3FF, surface #FFFFFF, surfaceAlt #E6E8FA, text #14141F, textMuted #5A5F88, primary #FFD23F, onPrimary #14141F, focus #E5392D, accent #3A6FF7, success #1FA89B, danger #E5392D, border #C9CCE8
   Also: spacing scale (4, 8, 12, 16, 20, 24, 32), radii (sm 8, md 12, lg 20, pill 999), typography scale (display 40/bold, title 22/bold, heading 17/semibold, body 15/regular, caption 12/regular, timer 64/bold with tabular numbers via fontVariant ['tabular-nums']), and subject color palette of 8 colors (blue, red, teal, yellow, pink, purple #8B5CF6, orange #FB923C, green #4ADE80).
3) THEME PROVIDER (ThemeProvider.tsx, useTheme.ts): mode = 'system' | 'dark' | 'light'. Default 'dark'. A zustand store `useThemeModeStore` holds the mode (persistence is added in SD-004; leave a clear TODO-free seam: a `setMode` action and an `initialMode` parameter). useTheme() returns tokens + isDark. Also set the Android status bar style/background to match.
4) SHARED COMPONENTS in src/core/ui (each its own file, typed props, accessibilityLabel support, uses theme tokens only):
   - Screen (safe-area aware container, optional scroll, background color),
   - Text (variants: display, title, heading, body, caption, timer; color prop = token name),
   - Button (variants primary/secondary/ghost/danger; sizes md/lg; loading + disabled; min height 48; press scale animation 100ms),
   - Chip (selected / unselected, optional color dot, optional onPress),
   - Card (surface container with radius md),
   - Toggle (animated switch, 44dp area),
   - SegmentedControl (2-4 options),
   - ProgressRing (react-native-svg + Reanimated animated stroke; props: progress 0..1, size, strokeWidth, color, trackColor, children centered),
   - ProgressBar (thin bar, animated),
   - BottomSheet (own implementation: Modal-less, absolute overlay with dimmed backdrop, slides up with Reanimated, drag-down-to-close with gesture-handler, tap backdrop to close, KeyboardAvoiding behavior so inputs stay visible, props: visible, onClose, children, snap content height automatically),
   - TextField (label, multiline option, error text, max length counter),
   - EmptyState (icon slot, title, message, optional action button),
   - Toast (src/core/ui/toast: imperative `showToast(message, kind)`; one ToastHost mounted in AppProviders; auto-hide 2s),
   - ConfirmDialog (imperative `confirm({title, message, confirmLabel, destructive}) => Promise<boolean>`; one host in AppProviders),
   - Icon set in src/core/ui/icons drawn with react-native-svg: Home, Timer, Cards, User, Plus, Check, Close, Chevron, Settings, Flame, Bolt (about 12 simple 24x24 icons, stroke style, color + size props).
5) A dev-only gallery: src/dev/UiGallery.tsx showing every component in both themes with a theme toggle. Show it from App.tsx ONLY when __DEV__ is true, as the temporary content of the app for now (SD-005 will replace the app content; keep the gallery reachable later from a dev menu).
6) Reduced motion: respect the system "remove animations" setting using Reanimated's reduced-motion support where available.

LIBRARIES: react-native-reanimated (+worklets), react-native-gesture-handler, react-native-svg, react-native-safe-area-context, zustand.

DONE WHEN
- Both themes work and switch live in the gallery; all components render correctly.
- Animations are smooth and under 400ms.

TEST
1. Unit tests for pure helpers (e.g., formatting helpers, token completeness: dark and light have identical keys).
2. On the emulator open the gallery: screenshot in dark, switch to light, screenshot again; look at each screenshot for cut-off text, low contrast, wrong colors.
3. BottomSheet: opens, drag-down closes, backdrop tap closes, open it with a TextField focused and show the keyboard (`adb shell input text`) — the field must stay visible above the keyboard.
4. Toggle, SegmentedControl, Button loading/disabled states work; ProgressRing animates from 0 to 0.7.
5. ConfirmDialog resolves true on confirm and false on cancel, and never leaves a stuck overlay.
6. Large font: `adb shell settings put system font_scale 1.3` — no text is cut off in Button/Chip/Card; then restore `adb shell settings put system font_scale 1.0`.
7. No warnings in logcat about Reanimated, worklets or gesture handler.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-004 — Storage layer (MMKV + SQLite + migrations)

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-002 | react-native-mmkv, @op-engineering/op-sqlite, dayjs, zustand (persist adapter), Jest |

**Goal:** All data lives on the phone: a key-value store for settings/timer state and a SQLite database with safe forward-only migrations. Startup runs them.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-004 — Storage layer
GOAL: Build the offline data foundation: MMKV key-value storage, SQLite client, migration runner, and the bootstrap sequence.

1) INSTALL (follow official guides, pick versions compatible with the installed React Native; rebuild and confirm the app launches after each one): react-native-mmkv, @op-engineering/op-sqlite, dayjs. If any of them cannot work with this React Native version, STOP and ask me.

2) src/core/storage/kv.ts: one MMKV instance named "studydojo". Typed helpers: getString/setString, getNumber, getBoolean, getJSON<T>/setJSON, remove, listKeys, clearAll.
   `createSetting<T>(key: string, defaultValue: T)` returns { get(), set(v), useValue() (React hook that re-renders on change), subscribe(fn), reset() }. Values are JSON-encoded. Key naming convention: "<feature>.<name>", for example "settings.dailyGoalMin".
   `zustandMMKVStorage`: a StateStorage adapter so zustand's persist middleware can use MMKV.
3) src/core/prefs/prefs.ts: createSetting-based prefs: themeMode ('system'|'dark'|'light', default 'dark'), hapticsEnabled (true), soundEnabled (true). Connect the SD-003 theme store to `themeMode` so the mode persists across restarts.
4) src/core/db/client.ts: open the database "studydojo.db" with op-sqlite. On open run: PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL. Wrap in a small typed interface `Db`:
     exec(sql, params?): Promise<void>;  query<T>(sql, params?): Promise<T[]>;  queryOne<T>(sql, params?): Promise<T | null>;  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>  (rolls back if fn throws).
   Everything in the app talks to the `Db` interface, never to op-sqlite directly (so the driver can be swapped or faked in tests).
5) src/core/db/migrate.ts: `runMigrations(db, migrations)`. Table schema_migrations(id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL). Migration type: { id: number; name: string; up: string[] } (list of SQL statements). Rules: ids must be unique and strictly increasing; a gap or duplicate throws; only pending migrations run, in order, each inside a transaction together with its schema_migrations row; if one fails the whole migration rolls back and the error propagates with the migration name. `getLatestMigrationId()` is exported (backup uses it later).
   src/core/db/migrations/index.ts exports the ordered list. Create ONLY 0001_app_meta: CREATE TABLE app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL); and insert ('db_created_at', now). Planned numbering for later tickets (do not create them now): 0002 subjects, 0003 sessions, 0004 cards, 0005 reviews.
6) src/core/time/dates.ts with dayjs: today(clock) -> 'YYYY-MM-DD', toDay(ms) -> 'YYYY-MM-DD', startOfDay(ms), endOfDay(ms), startOfWeek(ms) (week starts Monday), addDays(day, n), daysBetween(a, b), formatDuration(ms) -> '1h 18m' / '25m' / '45s', formatClock(ms) -> '17:42' or '1:05:09'. All pure functions with the clock/now passed in.
7) src/app/bootstrap.ts: async `bootstrap()`: open DB -> runMigrations -> registerFeatures(features) -> runFeatureInits(). Returns { ok: true } or { ok: false, error }. AppProviders/App shows a simple splash (app name on background) while bootstrapping and a clear error screen (message + "Try again" button, never a silent crash) if it fails. Export a `getDb()` accessor that throws if called before bootstrap completes.
8) Dev-only check: in the dev gallery or dev menu add a "Storage check" button that writes/reads a setting, reads app_meta.db_created_at and shows the result on screen.

LIBRARIES: react-native-mmkv, @op-engineering/op-sqlite, dayjs, zustand (already installed).

DONE WHEN
- App boots through bootstrap on the emulator; migration 0001 is applied exactly once; theme mode persists after killing and reopening the app.

TEST
1. Unit tests with a FAKE Db (in-memory implementation of the Db interface in the test): migrations run in order; second run applies nothing; a failing migration rolls back and does not record its row; duplicate / non-increasing ids throw; getLatestMigrationId is correct.
2. Unit tests for every date helper including: week start on Monday, month/year boundaries, daylight-saving-free India timezone and a UTC test via a fixed timestamp, durations (0, 59s, 60s, 3600s, 5400s).
3. createSetting test with a mocked MMKV: default value, set/get, subscribe fires, reset.
4. On the emulator: use "Storage check" -> shows value + db_created_at. Kill the app (`adb shell am force-stop <applicationId>`), reopen: the same db_created_at value and the saved setting remain. Set theme to light in the gallery, force-stop, reopen: still light.
5. Break the bootstrap on purpose (temporary throw in a migration): the error screen appears and "Try again" works after you remove the throw. Remove the temporary break.
6. `adb logcat -d` shows no SQLite or MMKV errors.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-005 — Navigation shell (4 tabs + sub-tabs)

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-003, SD-004 | @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs, @react-navigation/material-top-tabs, react-native-tab-view, react-native-pager-view, react-native-screens |

**Goal:** The 4-tab app with swipeable sub-tabs, built entirely from the feature registry, with placeholder screens.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-005 — Navigation shell
GOAL: Build the navigation from the feature registry: root stack -> bottom tabs (Home, Focus, Cards, Me) -> swipeable sub-tabs inside Focus, Cards and Me. Placeholder screens only.

1) INSTALL (official guides, versions compatible with the installed React Native; rebuild after installing): @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs, @react-navigation/material-top-tabs, react-native-tab-view, react-native-pager-view, react-native-screens (react-native-safe-area-context was already installed in SD-003; do not install it twice).

2) src/core/navigation/ref.ts: `navigationRef` (createNavigationContainerRef) and `navigateTo(tabId: string, subTabId?: string)`, `navigateToScreen(name: string, params?: object)`, safe when the navigator is not ready (queue or ignore with a dev log).

3) src/navigation/RootNavigator.tsx builds everything from the registry:
   - Native stack: first screen "Tabs", then every ScreenDef from getScreens() (these are for modals / detail pages added by features later; presentation 'modal' or 'card' via the ScreenDef options).
   - Bottom tabs from getTabs(): custom TabBar (src/navigation/TabBar.tsx): 4 items, icon + label, active = primary color with label, inactive = textMuted, height about 64dp plus safe-area inset, 48dp touch targets. Tab screens are lazy.
   - For a tab that has sub-tabs (getSubTabs(tab.id).length > 0) render a material top tab navigator with a custom SubTabBar (text labels, active label in text color with a 36dp x 2dp primary underline, swipe enabled, lazy). For a tab without sub-tabs render its `component`.
   - Theme: map our tokens to the React Navigation theme so there is no white flash.
4) Add placeholder screens (simple centered title + a line "Coming in SD-0XX") inside the real feature folders and register them in each feature's feature.ts:
   - home: tab {id:'home', title:'Home', order:10, icon: Home}; HomeScreen.
   - focus: tab {id:'focus', title:'Focus', order:20, icon: Timer}; sub-tabs SimpleTimerScreen (order 10, title 'Simple') and PomodoroScreen (order 20, title 'Pomodoro').
   - cards: tab {id:'cards', title:'Cards', order:30, icon: Cards}; sub-tabs ReviewScreen (10, 'Review') and LibraryScreen (20, 'Library').
   - stats: sub-tab of tab 'me': StatsScreen (order 10, title 'Stats').
   - settings: sub-tab of tab 'me': SettingsScreen (order 20, title 'Settings').
   - The 'me' tab itself ({id:'me', title:'Me', order:40, icon: User}) is declared by the settings feature (it owns the Me tab container); stats contributes a sub-tab only. A sub-tab whose tab id does not exist must throw a clear error at startup.
5) App.tsx: bootstrap -> NavigationContainer(ref) -> RootNavigator. Keep the dev UI gallery reachable: add src/dev/DevMenu.tsx (a root-stack screen registered ONLY when __DEV__) with buttons: UI Gallery, Storage check. Open it by a long-press on the "Me" tab icon in dev builds only.
6) Android back button: from a sub-tab/tab goes to the previous tab, then exits from Home (default React Navigation behavior; verify it).

LIBRARIES: the React Navigation set above, react-native-tab-view, react-native-pager-view, react-native-screens.

DONE WHEN
- 4 tabs show; Focus, Cards and Me have working swipeable top tabs; tapping and swiping both work; no feature file other than feature.ts and its own screens was needed to add a page.

TEST
1. Unit test: a fake manifest list produces the expected tab/sub-tab tree (pure function that maps registry -> navigation config; extract it so it is testable). A sub-tab for a missing tab throws.
2. On the emulator: screenshot each of the 4 tabs and all 6 sub-pages (Simple, Pomodoro, Review, Library, Stats, Settings) in dark mode. Swipe between sub-tabs using `adb shell input swipe` and confirm the underline moves.
3. Switch tabs rapidly 20 times via taps: no crash, no flicker, logcat clean.
4. Android back button behavior as described in step 6.
5. Cold start time: `adb shell am start -W <applicationId>/.MainActivity` — report the number (baseline for SD-029).
6. Rotate/resize: not applicable (portrait locked); font scale 1.3 does not break the tab bar labels.
7. Regression: bootstrap still runs (migration 0001 applied) and theme persistence from SD-004 still works.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````


---

### Epic B — Subjects & onboarding

---

### SD-006 — Subjects feature

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-004, SD-005 | zustand, op-sqlite (through the `Db` interface), Reanimated BottomSheet from SD-003 |

**Goal:** Students create subjects (Physics, Chemistry...). Subjects are used by timers (time per subject) and by flashcards. The feature exposes a picker that other features reuse.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-006 — Subjects feature
GOAL: Build the `subjects` feature: database table, repository, store, management screen and a reusable SubjectPicker. Other features will import ONLY from '@/features/subjects' (its index.ts).

1) MIGRATION src/core/db/migrations/0002_subjects.ts (new file, do not edit 0001):
   CREATE TABLE subjects (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
   CREATE UNIQUE INDEX idx_subjects_name ON subjects(name COLLATE NOCASE);
   Register it in the migrations index.
2) features/subjects/data/subjectsRepo.ts (uses getDb()): listSubjects(), getSubject(id), createSubject({name, color}), updateSubject(id, {name?, color?}), deleteSubject(id), reorder is NOT needed. Name rules (pure function in logic/validateSubject.ts): trim, 1-30 characters, unique ignoring case; color must be one of the 8 palette colors from the theme tokens. Return a typed Result ({ok:true,value} | {ok:false,error:'empty'|'too_long'|'duplicate'|'bad_color'}), never throw for validation problems.
3) features/subjects/store/subjectsStore.ts (zustand): subjects[], status ('idle'|'loading'|'ready'|'error'), load(), add(), update(), remove(). After every change emit 'subjects/changed' on the event bus; after remove also emit 'subjects/deleted' with the id. `init()` in feature.ts loads subjects after the DB is ready.
4) Components (features/subjects/components):
   - SubjectChip (color dot + name, selectable),
   - SubjectPicker: a Chip-like button showing the current subject (or "No subject"); tapping opens a BottomSheet listing subjects with a color dot, a "No subject" row (null) and a "+ New subject" row that opens the form. Props: value: string|null, onChange(id|null), allowNone (default true).
   - SubjectFormSheet: name TextField (max 30, live error text) + 8 color swatches + Save. Used for create and edit.
5) screens/ManageSubjectsScreen.tsx: a root-stack screen (register it in feature.ts `screens` as name 'ManageSubjects', title "Subjects"): list of subjects with edit (tap) and delete (swipe or trailing button -> ConfirmDialog "Delete <name>? This also deletes all its flashcards. Your study history is kept."). Empty state with "Add your first subject" button. A header "+" button.
6) Slot item: register in feature.ts a `settings.sections` slot item (id 'subjects.manage', order 20) whose component is a row "Manage subjects  ›" that calls navigateToScreen('ManageSubjects'). (The Settings page that renders slots arrives in SD-025; the item just has to exist and be unit-test safe.)
7) index.ts public API: types Subject, hooks useSubjects(), useSubject(id), functions getSubjectSync(id) (reads store), components SubjectPicker and SubjectChip, `subjectColors` palette re-export, constant NO_SUBJECT_LABEL.
8) Temporarily show a dev entry in DevMenu: "Subjects playground" that renders a SubjectPicker and a link to ManageSubjects, so you can test before the real screens exist.

LIBRARIES: zustand, SD-003 UI kit. No new libraries.

DONE WHEN
- Subjects can be created, edited, deleted; data survives an app restart; picker works inside a BottomSheet.

TEST
1. Unit tests: validateSubject (empty, spaces only, 30 vs 31 chars, duplicate with different case, bad color), repo with a fake Db (create/list/update/delete, unique constraint error is mapped to 'duplicate').
2. Emulator: create 3 subjects, edit one name and color, delete one (confirm dialog), force-stop and reopen: the same 2 subjects remain.
3. Try duplicate name "physics" vs "Physics": error shown, nothing saved.
4. Keyboard open in the form sheet: Save button still visible and tappable.
5. Picker: choose a subject, choose "No subject", create a new one from inside the picker and it becomes selected.
6. Events: a test proves 'subjects/changed' and 'subjects/deleted' are emitted.
7. Regression: tabs/sub-tabs from SD-005 still work; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-007 — Settings data & onboarding flow

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-006 | @react-native-community/datetimepicker, MMKV `createSetting`, slots |

**Goal:** Store the user's goal and exam date, and show a short first-run onboarding that later features can add steps to (permissions come later).

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-007 — Settings data & onboarding
GOAL: (a) create the settings feature's data layer (goal + exam), (b) add a first-run onboarding made of pluggable steps, (c) add a generic "startup route" mechanism so onboarding appears only on first launch without hard-wiring it into the navigator.

1) INSTALL @react-native-community/datetimepicker (official guide; use the Android dialog mode). Rebuild and confirm the app launches.

2) features/settings/data/settingsKeys.ts using createSetting: dailyGoalMin (number, default 120, allowed 15..720 in steps of 15), examName (string, default ''), examDate (string 'YYYY-MM-DD' or '', default ''). Pure helpers in features/settings/logic/exam.ts: getDaysLeft(examDay, todayDay) -> number | null (null when no date, 0 on exam day, negative or "passed" handled by returning null when the date is in the past), clampGoal(min). Public API (index.ts): useDailyGoalMin(), setDailyGoalMin(), useExam() -> { name, date, daysLeft }, setExam({name,date}), clearExam().
   The settings feature ALSO declares the 'me' tab container in feature.ts if SD-005 put it there; do not duplicate it.

3) CORE ADDITION (additive, backward compatible): in src/core/registry add to FeatureManifest an optional `startupRoute?: { order: number; resolve: () => string | null }` and `getStartupRoute()` that returns the first non-null result in order. RootNavigator uses it as the initial route (default 'Tabs'). Unit-test getStartupRoute.

4) features/onboarding:
   - data: `onboardingDone` = createSetting('onboarding.done', false).
   - feature.ts: root screen 'Onboarding' (no header, gesture back disabled), startupRoute {order 10, resolve: () => (done ? null : 'Onboarding')}, slot items for `onboarding.steps`: id 'onboarding.welcome' order 10.
   - index.ts exports OnboardingStepLayout (title, body, children, primaryLabel, onPrimary, secondaryLabel?, onSecondary?) and the type OnboardingStepProps = { onContinue: () => void; onSkip: () => void; isLast: boolean }.
   - OnboardingScreen renders getSlotItems('onboarding.steps') as pages in order, one at a time with a 250ms slide transition, a dots indicator, and no way to swipe past a step without pressing its buttons. When the last step calls onContinue/onSkip: set onboardingDone = true and navigation.reset to 'Tabs'.
   - Welcome step (order 10): a simple SVG hero, the app name, 3 bullets ("Focus timers that keep you on track", "Flashcards that schedule themselves", "Your phone goes quiet while you study. 100% offline."), button "Get started".
5) Steps contributed by other features (register in THEIR feature.ts through the `onboarding.steps` slot, using OnboardingStepLayout):
   - subjects, order 20: "What are you studying?" multi-select chips: Physics, Chemistry, Biology, Maths, English, History, Geography, Polity, Economics, Reasoning + an "Add your own" text field. On continue create the selected subjects using the palette colors in order (skip names that already exist). Skip creates nothing.
   - settings, order 30: "Set your goal": a daily goal stepper (-/+ 15 min, shows "2h", "1h 45m" using formatDuration) and an optional exam name + exam date (the datetimepicker dialog; "Clear" button; date cannot be in the past). Continue saves; Skip keeps defaults.
   (Permission steps for notifications and Do Not Disturb are added later in SD-013 and SD-016 through the same slot; do NOT build them now.)
6) Dev menu: add "Reset onboarding" (sets onboarding.done=false) so it can be re-tested.

LIBRARIES: @react-native-community/datetimepicker (new), everything else already installed.

DONE WHEN
- First launch shows onboarding (Welcome -> Subjects -> Goal), then Home tabs; second launch skips onboarding. Selected subjects exist; goal and exam are saved.

TEST
1. Unit tests: getDaysLeft (today, tomorrow, 87 days, past date -> null, empty -> null, month/year boundary), clampGoal, getStartupRoute, the step list sorting by order.
2. Emulator, fresh install (`adb shell pm clear <applicationId>`): onboarding appears; pick 3 chips and add a custom subject; set goal 2h15m; pick an exam date; finish. Open ManageSubjects (dev playground): 4 subjects exist with different colors.
3. Force-stop and reopen: goes straight to tabs. Dev menu "Reset onboarding" -> restart -> onboarding again.
4. Skip every step: app works with defaults (goal 2h, no exam, no subjects).
5. Try a past exam date: not allowed. Try goal below 15 min or above 12h: clamped.
6. Keyboard open on the custom subject field: Continue button still reachable.
7. Android back during onboarding does not exit to a blank screen or skip steps (decide a sensible behavior: go to the previous step; on the first step do nothing) and works.
8. Regression: tabs, theme persistence, subjects screens still work.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### Epic C — Sessions & focus

---

### SD-008 — Timer engine (pure logic)

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-002 | TypeScript only (no React, no native), Jest |

**Goal:** The heart of the timers as pure, fully tested functions. It stores timestamps (not a ticking counter), so it stays exact when the screen is off, the app is in the background or the phone sleeps.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-008 — Timer engine (pure logic)
GOAL: Implement a framework-free timer state machine in src/features/focus/logic/. No React Native, no zustand, no Date.now() inside: every function receives `now` (epoch ms). This engine will be used by every timer feature, so correctness is critical.

TYPES (src/features/focus/logic/types.ts)
  export type TimerMode = 'countdown' | 'stopwatch' | 'pomodoro';
  export type Phase = 'focus' | 'break' | 'longBreak';
  export type TimerStatus = 'running' | 'paused' | 'awaitingNext' | 'finished';
  export interface TimerConfig { mode: TimerMode; subjectId: string | null; focusMs: number; breakMs: number; longBreakMs: number; rounds: number; silence: boolean; keepAwake: boolean }
  export interface TimerState {
    sessionId: string; config: TimerConfig; status: TimerStatus; phase: Phase; round: number;
    phaseDurationMs: number | null;      // null for stopwatch
    segmentStartedAt: number | null;     // set only while running
    elapsedBeforeMs: number;             // time of this phase accumulated before the current running segment
    focusedMsDone: number;               // focus time of fully completed focus phases
    startedAt: number; endedAt: number | null; completed: boolean;
  }
  export type TimerAction = { type: 'pause' } | { type: 'resume' } | { type: 'stop' } | { type: 'startNext' } | { type: 'skipBreak' } | { type: 'tick' };
  export type TimerEffect =
    | { type: 'phaseStarted'; phase: Phase; round: number; endsAt: number | null }
    | { type: 'paused' }
    | { type: 'resumed'; phase: Phase; endsAt: number | null }
    | { type: 'awaitingNext'; nextRound: number }
    | { type: 'sessionFinished'; focusedMs: number; completed: boolean };

FUNCTIONS (engine.ts)
  startSession(config, now, sessionId): { state: TimerState; effects: TimerEffect[] }   // starts running immediately in a focus phase, round 1
  applyAction(state, action, now): { state: TimerState; effects: TimerEffect[] }          // never mutates the input; invalid actions return the same state and no effects (never throw)
  Selectors (selectors.ts): getElapsedMs(state, now), getRemainingMs(state, now) (null for stopwatch), getProgress(state, now) (0..1, null for stopwatch), getFocusedMs(state, now), getEndsAt(state) (epoch ms or null), isActive(state) (running | paused | awaitingNext).
  Helpers (presets.ts): POMODORO_PRESETS = [{label:'25 / 5', focusMin:25, breakMin:5}, {label:'50 / 10', focusMin:50, breakMin:10}], COUNTDOWN_PRESETS_MIN = [15, 30, 45, 60], longBreakFor(breakMs) = min(breakMs * 3, 30 minutes), DEFAULT_ROUNDS = 4, MAX_STOPWATCH_MS = 12 hours, validateConfig(config) -> Result with ranges: countdown 1..600 min; pomodoro focus 1..180 min, break 1..60 min, rounds 1..8; stopwatch has no duration. `buildConfig({...})` fills defaults (longBreakMs from longBreakFor).

RULES
- countdown: one focus phase. At its end -> status 'finished', completed = true, focusedMs = focusMs.
- stopwatch: running up, no phase duration. 'stop' -> finished, completed = true, focused = elapsed. Reaching MAX_STOPWATCH_MS on tick -> finished, completed = true (safety cap).
- pomodoro: focus(1) -> break(1) -> awaitingNext -> focus(2) -> break(2) -> awaitingNext -> ... -> focus(rounds) -> longBreak -> finished (completed = true).
  * A focus phase that ends automatically starts the break immediately and counts from the EXACT end time of the focus phase, not from `now`.
  * A normal break that ends moves to 'awaitingNext' (waits for the user): effect awaitingNext with nextRound.
  * The long break ending -> finished.
  * 'startNext' is valid only in 'awaitingNext': starts focus of the next round, running from `now`.
  * 'skipBreak' is valid only during break/longBreak (running or paused): from a normal break it starts the next focus round immediately (running from now); from the long break it finishes the session (completed = true).
- 'stop' at any time (any mode) -> finished. completed = false for countdown/pomodoro stopped before their natural end, true for stopwatch. The partial focus time in the current focus phase counts toward focusedMs.
- 'pause' only when running: first process pending phase ends (as if 'tick' was called), then store elapsed. 'resume' only when paused.
- 'tick' when running: if the phase's end time has passed, end the phase and CHAIN: keep processing (for example, the app slept through the whole focus phase and half of the break) until reaching a phase that has not ended, 'awaitingNext' or 'finished'. The loop must be bounded (no infinite loop for zero-length phases; reject zero-length phases in validateConfig).
- Clock going backwards (now < segmentStartedAt): treat elapsed as 0 for that segment, never negative remaining, never NaN.
- Time spent paused is never counted. `getFocusedMs` while paused or awaitingNext is stable (does not grow).
- Effects order is chronological.

LIBRARIES: none.

DONE WHEN
- All functions exist, are typed, documented with short JSDoc, and covered by tests.

TEST (write these as Jest tests; use fixed timestamps, no real timers)
1. countdown 25m: start; remaining at +10m = 15m; tick at +25m -> finished completed, focusedMs 25m; tick again is idempotent (no extra effects).
2. pause/resume: run 5m, pause 2h, resume, run 5m -> elapsed exactly 10m; remaining correct.
3. pomodoro 25/5 x4: walk through all rounds with ticks at exact boundaries; verify effects order, rounds, long break (15m), awaitingNext after each normal break, final finished with focusedMs 100m.
4. App-slept case: pomodoro, jump `now` to +27m in a single tick -> state is in break, break elapsed 2m (started at the exact +25m). Jump to +40m -> awaitingNext. Jump to +10 hours in one tick -> still correct (focusedMs counts only completed focus phases).
5. skipBreak from break -> next focus running; from long break -> finished; 'startNext' in the wrong state does nothing.
6. stop during focus at +10m of a 25m pomodoro -> finished, completed false, focusedMs 10m; stop in a break -> focusedMs = completed focus only; stopwatch stop at +30m -> completed true, focused 30m; stopwatch cap at 12h.
7. Clock backwards, zero/negative/NaN durations rejected by validateConfig, boundary values (min and max), rounds = 1 (focus -> long break -> finished).
8. Immutability: input state objects are not mutated (deep-freeze them in tests).
9. A randomized/property test: apply 200 random actions at increasing times and assert invariants (remaining >= 0, focusedMs never decreases, finished is terminal).
10. `npm run check` is green; app still launches on the emulator (no UI change expected).

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-009 — Sessions feature (history, daily totals, streaks)

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-004, SD-008 | op-sqlite (through `Db`), dayjs, zustand/hooks, Jest |

**Goal:** Save every focus session and answer "how much did I study today / this week / per subject" and "what is my streak".

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-009 — Sessions feature
GOAL: Build the `sessions` feature: table, repository, pure streak logic and hooks. Other features (focus, stats, home) will use ONLY '@/features/sessions' (index.ts).

1) MIGRATION src/core/db/migrations/0003_sessions.ts (new file):
   CREATE TABLE sessions (id TEXT PRIMARY KEY, subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL, mode TEXT NOT NULL CHECK (mode IN ('countdown','stopwatch','pomodoro')), planned_secs INTEGER NOT NULL, focused_secs INTEGER NOT NULL, started_at INTEGER NOT NULL, ended_at INTEGER NOT NULL, day TEXT NOT NULL, finished INTEGER NOT NULL CHECK (finished IN (0,1)));
   CREATE INDEX idx_sessions_day ON sessions(day);
   CREATE INDEX idx_sessions_subject ON sessions(subject_id);
   `day` is the LOCAL calendar day of ended_at ('YYYY-MM-DD'). `finished` = 1 when the session ended naturally/completed, 0 when stopped early. planned_secs: countdown = focusMs/1000, pomodoro = rounds * focusMs/1000, stopwatch = 0.
2) features/sessions/data/sessionsRepo.ts:
   insertSession(row) using INSERT OR IGNORE on id (saving the same session twice is harmless),
   getDailyTotals(fromDay, toDay): Promise<Record<string, number>> (focused seconds per day, only days with data),
   getSubjectTotals(fromDay, toDay): Promise<{ subjectId: string | null; secs: number }[]> (sorted by secs desc),
   getTotalFocusedSecs(): Promise<number>, getSessionCount(): Promise<number>.
3) features/sessions/logic:
   - computeStreaks(totalsByDay: Record<string, number>, today: string, minSecsPerDay = STREAK_MIN_SECS): { current: number; best: number; todayQualified: boolean }. STREAK_MIN_SECS = 600 (a day counts when focused time >= 10 minutes). current streak = consecutive qualifying days ending TODAY; if today has not qualified yet, count back from YESTERDAY (so the streak is not shown as broken until the day is over); best = longest run in the data.
   - shouldSaveSession(focusedSecs) -> boolean: sessions under 30 focused seconds are NOT saved (noise).
   - buildSessionRow(state/finished info, now) pure mapper.
4) features/sessions/store or hooks: `saveSession(input)` -> Promise<{ saved: boolean; streakBefore: number; streakAfter: number }>. It computes streakBefore from the daily totals BEFORE inserting, inserts (if shouldSaveSession), computes streakAfter, emits 'sessions/saved' { sessionId, day }. If the subject no longer exists, store subject_id = NULL (check the subject through the subjects public API; never let a foreign key error escape).
   Hooks: useTodayFocusedSecs(), useStreak() -> { current, best, todayQualified }, useDailyTotals(fromDay, toDay), useSubjectTotals(fromDay, toDay). Hooks refresh on the 'sessions/saved' event and when the app returns to the foreground (AppState 'active'), and when the calendar day changes while the app is open.
5) index.ts public API: saveSession, the hooks, computeStreaks, STREAK_MIN_SECS, getDailyTotals, getSubjectTotals, getTotalFocusedSecs.
6) Dev menu: "Sessions playground": buttons "Add 15m session", "Add 40m session (yesterday)", "Clear sessions"; shows today's total, current/best streak, and per-subject totals.

LIBRARIES: dayjs, zustand (installed). No new libraries.

DONE WHEN
- Sessions persist; hooks update live after saving; streak logic matches the rules.

TEST
1. computeStreaks unit tests (use a table): empty data; only today >= 10m; today 9m59s (not qualified) with a 3-day run ending yesterday -> current 3 and todayQualified false; gap breaks the run; best > current; month and year boundary; exactly 600s qualifies and 599s does not; multiple far-apart runs.
2. shouldSaveSession: 0, 29, 30, 31 seconds.
3. Repo with a fake Db: INSERT OR IGNORE idempotency; getDailyTotals sums multiple sessions in a day and excludes days outside the range; getSubjectTotals groups null subject; subject deleted -> row keeps with NULL (simulate).
4. saveSession: returns streakBefore/After correctly when the 10-minute threshold is crossed by this very session; unknown subject id is stored as NULL; emits 'sessions/saved' once.
5. Emulator via the playground: add sessions, see totals and streak change; force-stop and reopen -> data remains; add a "yesterday" session and confirm streak becomes 2 after a qualifying today.
6. Delete a subject (ManageSubjects) that has sessions: the sessions remain, shown under "No subject".
7. Regression: earlier screens work, logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-010 — Focus store, persistence & controller

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-006, SD-008, SD-009 | zustand, MMKV (`createSetting`), event bus, AppState |

**Goal:** Connect the pure engine to the app: one active session, saved to disk on every change so it survives the app being killed, and broadcast through events.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-010 — Focus store, persistence & controller
GOAL: Wrap the timer engine in a zustand store + a controller API. Persist the active session so it survives process death. Emit events so other features (Silence, notifications) can react without the focus code knowing them. No screens in this ticket.

1) CORE ADDITION (additive): add to AppEvents (src/core/events/events.ts) the event 'focus/awaitingNext': { sessionId: string; nextRound: number }.
2) features/focus/store/focusStore.ts (zustand):
   state: { active: TimerState | null; lastResult: FocusResult | null; hydrated: boolean }
   FocusResult = { sessionId; subjectId: string | null; mode; focusedSecs: number; rounds: number; completed: boolean; saved: boolean; streakBefore: number; streakAfter: number; endedAt: number }.
   The store never reads the clock by itself; the controller passes `now`.
3) features/focus/services/focusController.ts — the ONLY thing that mutates the timer:
   start(config), pause(), resume(), stop(), startNext(), skipBreak(), dismissResult(), restore(), getActive(), getLastConfig(), startLast().
   Every method: gets `now` from the injectable clock -> applyAction -> updates the store -> persists -> translates engine effects into bus events:
     phaseStarted -> 'focus/phaseStarted' { sessionId, phase, endsAt, silence: config.silence }
     paused -> 'focus/paused'; resumed -> 'focus/resumed' (with phase, endsAt, silence)
     awaitingNext -> 'focus/awaitingNext'
     sessionFinished -> save the session through sessions.saveSession (subject, mode, planned, focused, started/ended times, finished flag), set lastResult, clear `active`, then emit 'focus/finished' { sessionId, focusedSecs, completed }. When the user stops it: ALSO emit 'focus/stopped' first.
   Only one session can be active: start() while active is rejected with a typed error result (not a throw).
4) Persistence: active state is saved as JSON under MMKV key 'focus.activeState' after every transition and removed when the session ends. `focus.lastConfig` (createSetting) stores the last started TimerConfig. restore() runs from the feature's init(): if an active state exists, call applyAction(tick) with the current time and process the effects exactly like live ones (for example, the app was killed during a focus phase and the phase ended while it was dead -> the session continues in break / awaitingNext / finished and gets saved). Saving the same sessionId twice is safe (INSERT OR IGNORE). If the persisted JSON is corrupt or has an old shape, discard it and log in dev (never crash on startup).
   If restore() finds a running session, re-emit 'focus/phaseStarted' (or 'focus/resumed' semantics) once so the Silence feature can re-enter its state.
5) Hooks (features/focus/hooks): useFocusActive() (the TimerState | null), useFocusResult(), useFocusNow(): returns a `now` that ticks every 1000ms ONLY while a session is running and the component is mounted/visible (core/time/useNow.ts: interval aligned to the next whole second, cleared on unmount, pauses when AppState is not 'active' and recomputes immediately when it returns). Also useRemainingMs(), useProgress(), useFocusedMs() built on the selectors.
   While running in the foreground, the controller must also call `tick` on a 1-second timer so phase changes happen on time even if no screen is showing the clock (the interval stops when no session is running).
6) index.ts public API: focusController (start, pause, resume, stop, startNext, skipBreak, dismissResult, startLast, getActive, getLastConfig), hooks, types (TimerConfig, TimerState, FocusResult, Phase, TimerMode), preset helpers (POMODORO_PRESETS, COUNTDOWN_PRESETS_MIN, buildConfig, validateConfig).
7) Dev menu "Focus playground": buttons to start a 1-minute countdown, a 20s/10s pomodoro (use a dev-only tiny config), pause, resume, stop, and a live text dump of the active state + the last 10 events received (subscribe to every event in dev).

LIBRARIES: zustand, MMKV (installed). No new libraries.

DONE WHEN
- A session started in the playground survives force-stop and continues with the correct remaining time; events are emitted in the right order; finished sessions land in the sessions table.

TEST
1. Unit tests for the controller with a fake clock, fake sessions API and a fake MMKV: start -> events; pause/resume; stop emits 'focus/stopped' then 'focus/finished'; start while active is rejected; startNext/skipBreak; lastResult populated; active cleared on finish; persistence written and removed.
2. restore() tests: running state restored with correct remaining; state that expired while "dead" ends in the right phase/finished and saves the session exactly once even if restore() is called twice; corrupt JSON discarded; old shape discarded.
3. Emulator: start a 2-minute countdown, force-stop the app at 30s, wait 40s, reopen: remaining is about 50s (not 2:00, not 1:30). Start a pomodoro dev config (20s focus / 10s break), keep the app open and watch the playground event log: phaseStarted(focus) -> phaseStarted(break) -> awaitingNext.
4. Kill during a focus phase and reopen AFTER the whole session would have finished: session is saved once (check the sessions playground total).
5. Delete the active session's subject in ManageSubjects (dev) while it runs, finish: no crash, session stored with no subject.
6. Foreground/background: send the app to background (`adb shell input keyevent KEYCODE_HOME`) for 30s and return: elapsed time is correct, no double events.
7. Regression: sessions playground, subjects, onboarding, navigation still work; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-011 — Simple Timer page + active session view

| Size | Depends on | Libraries & tech |
|---|---|---|
| L | SD-005, SD-010 | react-native-keep-awake, react-native-svg ProgressRing, Reanimated, SD-003 UI kit |

**Goal:** The first real screen: set up a countdown or stopwatch, start it, see the running timer, pause, stop, finish.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-011 — Simple Timer page + active session view
GOAL: Build the Focus tab's "Simple" page and the shared ActiveSessionView (also used by the Pomodoro page in SD-012). There is only ONE active session in the whole app: whichever sub-tab you open, if a session is active you see the ActiveSessionView; if not, you see that page's setup form.

1) INSTALL react-native-keep-awake (official guide; rebuild; confirm launch). If it does not support this React Native version, STOP and ask me (the fallback would be a small Kotlin FLAG_KEEP_SCREEN_ON module — do not build it without my OK).

2) Setup form (features/focus/screens/SimpleTimerScreen.tsx):
   - SubjectPicker (from '@/features/subjects') at the top.
   - Big time display for the chosen duration ("30:00", caption "minutes") in `timer` text variant.
   - Preset chips 15 / 30 / 45 / 60 and a "Custom" chip that opens a BottomSheet with a numeric TextField (1-600 minutes, validated with validateConfig).
   - SegmentedControl: Countdown | Stopwatch. In Stopwatch mode the big display shows 00:00 and the presets are hidden.
   - A `<Slot name="focus.setupHints" />` placed above the Start button (empty for now; Silence will use it).
   - Toggles: "Silence notifications" (default ON, value stored in the config) and "Keep screen on" (default ON).
   - Big primary START button (lg). Remember the last config via focusController (lastConfig pre-fills the form; if the last mode was pomodoro, ignore it here).
   - On START: buildConfig + validate -> focusController.start. If rejected, show a Toast with a clear message.
3) features/focus/components/ActiveSessionView.tsx (generic, mode-aware):
   - Header: read-only SubjectChip (or nothing), phase label: "FOCUS" (focus color), "BREAK" / "LONG BREAK" (success color) — pomodoro pieces are completed in SD-012 but the view must already switch on `phase`.
   - Countdown / pomodoro: ProgressRing with the remaining time inside (clock format), and "Round x / y" below when mode is pomodoro. Stopwatch: big elapsed time (no ring) and a pulsing dot.
   - Buttons: Pause <-> Resume (primary) and Stop (secondary). Stop shows ConfirmDialog "End this session? 12m of focus will be saved." when focused time >= 60s; if focused time is under 30s the message says "Sessions under 30 seconds are not saved."
   - Uses useFocusNow so only this view re-renders every second.
   - Keep screen awake only while status is 'running' AND config.keepAwake (use the library's hook inside a tiny component so it unmounts cleanly).
   - Animations: ring animates smoothly (progress changes once per second; animate with a 900ms linear timing so it looks continuous).
4) A basic FinishedView (features/focus/components/FinishedView.tsx), shown when `lastResult` exists: "Session complete" (or "Session ended" if completed is false), focused time with formatDuration, subject name, "saved" note, a Done button -> focusController.dismissResult(). (SD-014 upgrades it with the celebration.)
5) Wire SimpleTimerScreen: if a session is active -> ActiveSessionView; else if lastResult -> FinishedView; else the setup form. Switching sub-tabs never starts or stops anything.

LIBRARIES: react-native-keep-awake (new), Reanimated, react-native-svg (installed).

DONE WHEN
- You can run a countdown and a stopwatch end to end from the real Simple tab, pause/resume/stop, and the result is saved in the sessions table.

TEST
1. Unit tests for any pure helpers (config-from-form mapper, validation messages, time formatting for the ring).
2. Emulator: start 15 min countdown with a subject; screenshot the ActiveSessionView; verify the remaining time matches the wall clock after 60s (check with two screenshots 60s apart).
3. Pause for 30s, resume: the remaining time did not move while paused. Stop at ~70s: confirm dialog says about 1m saved -> confirm -> FinishedView -> Done -> setup form again; the sessions playground shows +1 session.
4. Stopwatch: start, wait 40s, Stop -> saved ~40s; start and stop within 10s -> "not saved" message and nothing stored.
5. Custom duration sheet: enter 0, 601, "abc", empty -> rejected with an error; 90 -> accepted.
6. Force-stop the app mid-session and reopen: the Simple tab shows the ActiveSessionView with the right time. Switch to the Pomodoro tab while a session runs: it shows the same active session (no second setup form).
7. Keep-awake: with `adb shell dumpsys power | grep -i wake` (or display state) verify the screen stays on while running and the flag is released after stop.
8. Dark and light themes both readable; large font scale 1.3 does not cut the big time or the buttons.
9. Regression: onboarding, subjects, tabs; logcat has no errors or React warnings.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-012 — Pomodoro page + break & finish views

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-011 | Reanimated, SD-003 UI kit, focus engine |

**Goal:** The Pomodoro setup (25/5, 50/10, custom), rounds, break behavior ("Ready for round 3?") and a break view with a place for extensions.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-012 — Pomodoro page + break & finish views
GOAL: Build the "Pomodoro" sub-tab and finish the pomodoro-specific parts of ActiveSessionView.

1) PomodoroScreen setup form (features/focus/screens/PomodoroScreen.tsx):
   - SubjectPicker, then a big ring preview showing the first focus length ("25:00", "FOCUS 1 / 4").
   - Round dots (4 by default).
   - Preset chips: "25 / 5", "50 / 10" and "Custom". Custom opens a BottomSheet with steppers: Focus (1-180 min), Break (1-60 min), Rounds (1-8). Show the computed long break ("Long break: 15 min"). Validate with validateConfig.
   - `<Slot name="focus.setupHints" />` above the Start button; toggles "Silence notifications" and "Keep screen on" (same as the Simple page; extract a shared SessionOptions component instead of duplicating).
   - START button -> focusController.start with mode 'pomodoro'.
   - Same routing as Simple: active -> ActiveSessionView, lastResult -> FinishedView, else the form.
2) ActiveSessionView updates:
   - Focus phase: red ring, "FOCUS", "Round x / y", dots with filled dots for completed rounds.
   - Break / long break: teal ring (counting down the break), "BREAK" or "LONG BREAK", a friendly line ("Stretch, drink water, rest your eyes"). Below it render `<Slot name="focus.breakPanel" />` (empty for now; the Cards feature will plug into it in SD-022). A "Skip break" button calls skipBreak.
   - awaitingNext: a calm view "Break over. Ready for round 3?" with a primary "Start round 3" button (startNext) and a secondary "End session" (stop). No countdown is shown.
   - Phase change transitions: crossfade 250ms.
3) FinishedView for pomodoro: "Session complete" with "4 rounds - 1h 40m focused". A stopped-early pomodoro says how many rounds were completed.
4) Round-dot logic and labels are computed by pure functions in features/focus/logic/labels.ts (unit-tested): roundLabel(state), phaseTitle(state), nextActionLabel(state).

LIBRARIES: none new.

DONE WHEN
- A full pomodoro (use dev-only tiny durations, see TEST) goes focus -> break -> awaitingNext -> focus -> ... -> long break -> finished from the real UI.

TEST
1. Unit tests for labels.ts (round labels, long break label, last round, awaitingNext text for round N, stopped-early text).
2. Add a dev-only way to run tiny durations (for example the dev menu's focus playground can start the real Pomodoro screen config with focus 15s / break 10s / 2 rounds). Run the whole flow on the emulator and take a screenshot at: focus, break (check the teal ring and the empty breakPanel does not leave a gap), awaitingNext, round 2 focus, long break, finished.
3. Skip break during a break -> next focus round starts immediately; skip during the long break -> finished.
4. "End session" from awaitingNext saves a session with completed = false and focused time of the finished rounds only.
5. Background the app during a focus phase, return after it ended: the UI shows the break (or awaitingNext) correctly with correct times.
6. Custom sheet: rounds 0 or 9 rejected, break 0 rejected, long break text updates live.
7. Force-stop during a break and reopen: break continues with the right remaining time.
8. Regression: the Simple page from SD-011 still works while a Pomodoro is active (shows the active session); logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-013 — Background timer & notifications

| Size | Depends on | Libraries & tech |
|---|---|---|
| L | SD-012 | @notifee/react-native, Android foreground service, Android 13+ notification permission, Android alarms (via Notifee trigger notifications) |

**Goal:** The timer keeps working with the screen off, shows an ongoing notification with the remaining time, and alerts you when a phase ends — even if the app was killed.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-013 — Background timer & notifications
GOAL: Make sessions reliable in the background: (a) an ongoing notification (foreground service) while a session is running, (b) a scheduled alert at the end of every phase that fires even if the app process is dead, (c) the Android 13+ notification permission flow.

1) INSTALL @notifee/react-native (follow the official Android setup, including the foreground-service requirements for the Android version targeted by this project). Android 14+ requires a foreground service TYPE: choose the type Notifee's docs recommend for a timer (likely "specialUse" with the required <property> justification text, plus the matching FOREGROUND_SERVICE_* permission). Add permissions POST_NOTIFICATIONS and FOREGROUND_SERVICE in AndroidManifest.xml. If Notifee cannot work with this React Native version, STOP and ask me.
   Register the foreground-service task at app entry (index.js): a task that stays alive until we stop the service.

2) Channels (created once at startup in the focus feature's init()):
   - 'focus-running': importance LOW, no sound, no vibration, name "Running session".
   - 'session-end': importance HIGH, default sound, vibration, `bypassDnd: true` (this only takes effect when the user has granted Do Not Disturb access; harmless otherwise), name "Session alerts".
   - 'session-end-silent': importance HIGH, no sound, vibration on, `bypassDnd: true`, name "Session alerts (silent)".
   The soundEnabled pref chooses between the last two when scheduling.
3) features/focus/services/notificationService.ts (own file, started from the focus feature's init(); it only listens to the event bus and reads focusController.getActive()):
   - On 'focus/phaseStarted' and 'focus/resumed': start/update the foreground-service notification (id 'focus-running'): title "<Phase> - <Subject or 'Study'>", body "Round 2 of 4" (pomodoro) or "Stay focused", chronometer counting DOWN to endsAt (showChronometer + chronometerDirection 'down' + timestamp = endsAt) so the system updates it without our code running; for the stopwatch use a chronometer counting UP from the start. Small icon: create a simple white vector drawable for the status bar. Tapping opens the app (launch activity). Ongoing, not dismissible, no actions.
     Also schedule ONE trigger notification (id 'focus-alert') at endsAt using a TimestampTrigger with alarmManager { allowWhileIdle: true } (inexact, needs no special permission). Its text depends on what follows: focus ends -> "Round 2 done - take a 5 min break"; break ends -> "Break over - ready for round 3?"; long break ends or countdown ends -> "Session complete - 30m of Physics". Cancel any previous trigger first so there is never more than one.
   - On 'focus/paused': cancel the trigger, update the ongoing notification to "Paused" (no chronometer).
   - On 'focus/awaitingNext': stop the foreground service and cancel the ongoing notification (the alert already informed the user).
   - On 'focus/stopped' and 'focus/finished': cancel the trigger, stop the foreground service, cancel the ongoing notification.
   - Phase text/next-phase description comes from a pure function in features/focus/logic/notificationText.ts (unit-tested).
   Never post an immediate alert from JS; alerts always come from the scheduled trigger (so behavior is identical in foreground, background and killed states).
4) Permission flow: `ensureNotificationPermission()` in the service: before the FIRST session start call notifee.requestPermission(). If denied, the session still works; show a Toast once: "Notifications are off. The timer still works, but you will not be alerted in the background." Add an onboarding step through the `onboarding.steps` slot (order 50, id 'focus.notifications', title "Stay on track", explanation, button "Allow notifications" and "Not now").
5) Re-sync on app start: in restore() flow (SD-010) the notification service must rebuild the ongoing notification and re-schedule the trigger for a session that is still running (use the re-emitted 'focus/phaseStarted').
6) Know the limitation and write it in the README (section "Known limits"): inexact alarms can be delayed by a few minutes in Doze on some phones. Do NOT switch to exact alarms without asking me (it requires an extra user permission on Android 12+).

LIBRARIES: @notifee/react-native (new).

DONE WHEN
- Start a session, lock/background the app: the ongoing notification shows a live countdown; at the end of the phase an alert appears; the app does not need to be open.

TEST
1. Unit tests: notificationText for every phase transition (focus->break, break->awaitingNext, last focus->long break, long break->finish, countdown, stopwatch), singular/plural text, subject missing.
2. Emulator: grant notification permission (`adb shell pm grant <applicationId> android.permission.POST_NOTIFICATIONS`), start a 1-minute countdown, press Home, pull down the shade (screenshot or `adb shell dumpsys notification --noredact | grep -A15 <applicationId>`): the ongoing notification exists with a chronometer. After the minute the alert notification exists ("Session complete...").
3. Kill test: start a 1-minute countdown, swipe the app away or `adb shell am force-stop <applicationId>` — note: force-stop cancels alarms by design, so ALSO test the realistic case: swipe away from recents (`adb shell input keyevent KEYCODE_APP_SWITCH` then swipe) and verify with `adb shell dumpsys alarm | grep -i <applicationId>` that the alarm is scheduled. Report honestly which cases deliver the alert.
4. Doze test: `adb shell dumpsys deviceidle force-idle`, wait past the end time, `adb shell dumpsys deviceidle unforce`: the alert arrives (it may be late); report the delay.
5. Pause cancels the trigger (`dumpsys alarm` no longer lists it); resume re-schedules it with the new end time; stop removes everything and the foreground service stops (`adb shell dumpsys activity services <applicationId>`).
6. Denied permission: revoke (`adb shell pm revoke <applicationId> android.permission.POST_NOTIFICATIONS`), start a session: it works, the Toast appears once, and no crash.
7. Pomodoro: the notification text changes between focus and break; the end-of-focus alert says to take a break.
8. Onboarding step appears at order 50 after the goal step (clear app data to test) and works for Allow and Not now.
9. Regression: SD-010/011/012 behavior unchanged; logcat shows no Notifee or foreground-service exceptions (check Android 14+ "ForegroundServiceStartNotAllowed" and missing type errors).
10. Mark as NOT VERIFIED (needs me): the audible sound of the alert and behavior on Xiaomi/Oppo/Vivo/Samsung battery savers.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-014 — End-of-session feedback (haptics, celebration)

| Size | Depends on | Libraries & tech |
|---|---|---|
| S | SD-012 | react-native-haptic-feedback, react-native-svg + Reanimated (confetti, flame) |

**Goal:** A satisfying finish: vibration, a short celebration and streak display — drawn with SVG, no extra asset files.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-014 — End-of-session feedback
GOAL: Add haptic feedback and a celebration to the finish screen, respecting the user's haptics preference.

1) INSTALL react-native-haptic-feedback (official guide; rebuild; confirm launch). If incompatible, STOP and ask me.
2) src/core/feedback/haptics.ts: `haptic(kind: 'light' | 'medium' | 'success' | 'warning')`, silent when prefs.hapticsEnabled is false, never throws (wrap library errors), ignores calls when the device has no vibrator.
3) features/focus/services/feedbackService.ts (init() subscribes to bus events): 'focus/phaseStarted' -> 'medium'; 'focus/paused' and 'focus/resumed' -> 'light'; 'focus/finished' with completed = true -> 'success'; 'focus/stopped' -> 'light'.
4) src/core/ui/Celebration.tsx: a one-shot confetti burst of about 24 SVG particles (circle/rect, theme colors, random angles and speeds, gravity, fade out) animated with Reanimated in 1.2s; it plays once on mount, never loops, uses the UI thread, and is skipped when reduced motion is on. src/core/ui/FlameBadge.tsx: a flame icon with a streak number and a small scale pulse (once).
5) Upgrade features/focus/components/FinishedView.tsx: Celebration plays only when completed = true; shows "Session complete", focused time, subject; a streak row using lastResult.streakBefore/After: if streakAfter > streakBefore show "Streak +1! Day N" with FlameBadge, else show "Current streak: N days"; and if the session was not saved (under 30s) show a plain "Too short to save" message instead (no celebration).
6) Add the haptics toggle behavior test hooks: prefs.hapticsEnabled is read at call time (not cached).

LIBRARIES: react-native-haptic-feedback (new).

DONE WHEN
- Finishing a session gives a short vibration + confetti once, streak line is correct; turning haptics off silences vibrations.

TEST
1. Unit tests: haptic() with the pref on/off, library throwing, unknown kind; feedbackService maps each event to the right kind (mock the haptic module and use the real bus).
2. Emulator: finish a short session (use the dev tiny config): screenshot the FinishedView during the confetti and after; confirm confetti plays once and does not replay when you switch tabs and come back.
3. Cross the 10-minute streak threshold with the sessions playground and finish a session: shows "Streak +1!". Finish another session the same day: shows "Current streak" (no +1).
4. Stop early under 30s: "Too short to save", no confetti, no haptic 'success'.
5. Reduced motion (`adb shell settings put global animator_duration_scale 0` and transition scales 0): the finish screen is still correct, no confetti, nothing stuck. Restore the scales to 1 afterwards.
6. Not verified (needs me): the feel of the vibration on a real device.
7. Regression: SD-011/012/013 flows unchanged; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````


---

### Epic D — Silence (Do Not Disturb)

---

### SD-015 — Do Not Disturb native module (Kotlin)

| Size | Depends on | Libraries & tech |
|---|---|---|
| L | SD-002 | Kotlin, Android `NotificationManager` interruption filter, `AlarmManager`, `BroadcastReceiver`, `SharedPreferences`, React Native native modules |

**Goal:** A small, safe native module that turns Do Not Disturb on and restores it. It only restores what **it** changed, so it never overrides the user's own DND choice. It also schedules a backup alarm so DND is restored even if the app dies.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-015 — Do Not Disturb native module (Kotlin)
GOAL: Build the Android native layer for "Silence": enable Priority-only Do Not Disturb, restore the user's previous state, and schedule a backup restore alarm. Wrap it in a typed TypeScript API inside the `silence` feature. No timer integration yet (that is SD-016).

NATIVE (android/app/src/main/java/<your package path>/dnd/)
1) Manifest: <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />. Register the receiver <receiver android:name=".dnd.DndRestoreReceiver" android:exported="false" />.
2) DndModule.kt — a React Native native module named "DndModule". Use whichever native-module style the INSTALLED React Native version officially supports (check the official "Native Modules" guide for this exact version; legacy-style ReactContextBaseJavaModule through the interop layer is fine if supported). Tell me which style you used and why. Methods (all return Promises, never throw to JS; resolve with structured values):
   - isPolicyAccessGranted(): boolean  -> NotificationManager.isNotificationPolicyAccessGranted()
   - openPolicyAccessSettings(): void  -> startActivity(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)) with FLAG_ACTIVITY_NEW_TASK
   - getStatus(): { granted: boolean; currentFilter: number; ownedByApp: boolean; endsAt: number }   (currentFilter = NotificationManager.currentInterruptionFilter)
   - enter(endsAtMs: number): 'applied' | 'already_quiet' | 'not_granted' | 'error'
       * not granted -> 'not_granted', change nothing.
       * Read the current filter. If it is INTERRUPTION_FILTER_ALL (or UNKNOWN): save it as previousFilter, set INTERRUPTION_FILTER_PRIORITY, mark ownedByApp = true, save endsAt, return 'applied'.
       * If the user is ALREADY in a quiet mode (PRIORITY, ALARMS or NONE): do NOT change anything and do NOT take ownership (ownedByApp = false), return 'already_quiet'. We never override or later "restore" the user's own setting.
       * If we already own the state (ownedByApp = true): do not overwrite previousFilter; just update endsAt and re-schedule the alarm, return 'applied'.
       * Always (re)schedule the backup alarm for endsAt + 15 seconds when we own the state.
   - exit(): 'restored' | 'nothing_to_restore' | 'error'
       * If ownedByApp: restore previousFilter ONLY IF the current filter is still the one we set (PRIORITY). If the user changed it meanwhile, leave it. Then clear ownership and cancel the alarm. If not granted anymore, clear ownership and cancel the alarm anyway.
       * If not owned: 'nothing_to_restore'.
   Persist previousFilter / ownedByApp / endsAt in SharedPreferences "studydojo_dnd" (commit synchronously with commit(), not apply(), so it survives a kill right after).
3) DndRestoreReceiver.kt: a BroadcastReceiver that performs the same logic as exit() (restore only if owned and current filter is still ours). Alarm: AlarmManager.setAndAllowWhileIdle(RTC_WAKEUP, time, PendingIntent.getBroadcast(..., FLAG_IMMUTABLE or FLAG_UPDATE_CURRENT)). Put the shared logic in one Kotlin object `DndController` used by both the module and the receiver (no duplicated logic).
4) DndPackage.kt + register it in MainApplication (match the project's existing Kotlin style).
5) The module must be safe if called from a headless/killed-app receiver context (no React context needed inside DndController).

TYPESCRIPT (features/silence/native/DndModule.ts)
- A typed wrapper object `dnd` with the same methods, a guard `isAndroid`, and a graceful "unsupported" fallback (all methods resolve with safe values) when the module is missing (for Jest and non-Android).
- A Jest manual mock (features/silence/native/__mocks__ or jest setup) so other tests can import it.
- features/silence/index.ts exports `silenceApi` = { isPolicyAccessGranted, openPolicyAccessSettings, getStatus, enter, exit } (thin pass-through). No UI in this ticket.
- Dev menu: "DND playground" with buttons: Status, Open settings, Enter (now + 60s), Exit, and a text area showing the last result and the raw system value.

LIBRARIES: none (own Kotlin code).

DONE WHEN
- The playground can turn DND on/off, never overrides a pre-existing user DND, and the backup alarm restores DND with the app process dead.

TEST (use adb; replace <pkg> with the applicationId)
1. Grant access without UI: `adb shell cmd notification allow_dnd <pkg>`. Check state any time with `adb shell settings get global zen_mode` (0 = off, 1 = priority only, 2 = total silence, 3 = alarms only).
2. Enter from normal state: zen_mode becomes 1; status says ownedByApp true. Exit: zen_mode back to 0.
3. User already in DND: `adb shell cmd notification set_dnd alarms` (if unsupported on this emulator image, set it from the quick settings tile via UI). Enter -> 'already_quiet', zen_mode stays 3, ownedByApp false. Exit -> 'nothing_to_restore', zen_mode still 3 (the user's setting is untouched). Reset with `adb shell cmd notification set_dnd off`.
4. User changed DND while we owned it (enter, then `set_dnd alarms`, then exit): we must NOT overwrite it; zen_mode stays 3.
5. Not granted: `adb shell cmd notification disallow_dnd <pkg>`; Enter -> 'not_granted', nothing changes; no crash.
6. Backup alarm: Enter with endsAt = now + 5s; then kill the app process without force-stop (`adb shell am kill <pkg>` after pressing Home); wait 25s: zen_mode returns to 0 although the app is dead. Also verify the alarm exists via `adb shell dumpsys alarm | grep -i <pkg>` and is gone after a normal Exit.
7. Call enter twice and exit twice: idempotent, no state corruption; previousFilter is not overwritten by the second enter.
8. Unit tests (TypeScript wrapper): unsupported fallback values, Android guard, every method forwards arguments. Kotlin pure logic (decision table for enter/exit) should have a JVM unit test if the project's Gradle setup supports it with little effort; if not, say so and keep the decision table in the Ticket Report with the adb results above as evidence.
9. Regression: app builds and starts; navigation and timers unaffected; logcat shows no module-registration errors.
10. Not verified (needs me): behavior on Xiaomi/Samsung/Oppo where DND policy access screens differ.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-016 — Silence integration with the timer

| Size | Depends on | Libraries & tech |
|---|---|---|
| L | SD-013, SD-015 | event bus, slots, MMKV prefs, AppState, SD-003 UI kit |

**Goal:** DND turns on automatically in focus phases and off in breaks/pause/stop/finish, with a clear permission experience. The timer code does not know the Silence feature exists.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-016 — Silence integration with the timer
GOAL: Connect the DND module to the timer through EVENTS only, add the permission UX, and add the safety nets.

1) CORE ADDITIONS (additive and backward compatible; tell me about each):
   - add 'focus.activeBadges' to the SlotName union in src/core/registry/types.ts;
   - add `silenceDefault` (boolean, default true) to src/core/prefs/prefs.ts (it lives in core so that the focus forms can read it without importing the silence feature);
   - in the focus feature: render `<Slot name="focus.activeBadges" />` under the phase label in ActiveSessionView, and make the "Silence notifications" toggle in SessionOptions start from prefs.silenceDefault (the last-used config value still wins when present). Nothing else in focus changes.
2) features/silence/logic/silencePlan.ts — pure function: planFor(event, ctx) -> { action: 'enter'; endsAt: number } | { action: 'exit' } | { action: 'none' } with these rules:
   - 'focus/phaseStarted' or 'focus/resumed' with phase 'focus' and silence = true -> enter (endsAt from the event; if null (stopwatch) use now + 12h as the cap);
   - 'focus/phaseStarted' with phase 'break' or 'longBreak' -> exit (breaks are for reviewing cards, so notifications are allowed);
   - 'focus/resumed' in a break phase -> none;
   - 'focus/paused', 'focus/stopped', 'focus/finished', 'focus/awaitingNext' -> exit;
   - silence = false -> exit/none, never enter.
3) features/silence/services/silenceService.ts: in the feature's init() subscribe to those focus events, run `planFor` and call the native API. All native calls go through ONE serial queue (a promise chain) so enter/exit never race. Keep a small zustand store `useSilenceStore`: { granted: boolean; state: 'idle' | 'active' | 'blocked' | 'already_quiet'; lastError?: string } updated after each call ('blocked' = silence was wanted but permission is missing).
   Order in src/app/features.ts: the `focus` manifest must come BEFORE `silence` (silence's init reads focus state after focus has restored its session). If you need to change the order, tell me.
4) Safety nets:
   a) Launch: after features are initialized, if the native status says ownedByApp = true but there is NO active focus-phase session with silence on (use focusController.getActive() from '@/features/focus'), call exit(). If there IS one, call enter(endsAt) again (idempotent).
   b) App returns to foreground (AppState 'active'): refresh granted/status; if a focus phase with silence is running and permission was just granted, call enter().
   c) If the permission is revoked mid-session, exits and enters fail softly (state 'blocked'), never crash and never loop.
5) UI contributed through slots (all in features/silence/components):
   - `focus.setupHints` (order 10): SilenceHint card shown only when prefs.silenceDefault is true AND permission is not granted: "Allow Do Not Disturb access so Study Dojo can silence your phone while you focus." + button "Allow" (openPolicyAccessSettings) + "Not now" (hides it until the next app launch; keep in memory only).
   - `focus.activeBadges` (order 10): a small chip: "Silence ON" (success color) when state = 'active'; "Silence needs permission - tap to fix" (danger color, tappable -> openPolicyAccessSettings) when blocked; "Already in Do Not Disturb" (muted) for already_quiet; renders nothing when the session has silence = false.
   - `settings.sections` (order 10, id 'silence.section'): a section "Silence" with a Toggle "Silence notifications while focusing" bound to prefs.silenceDefault, and a row "Do Not Disturb access" with a status chip GRANTED / NOT GRANTED and a "Fix" button when not granted, plus a caption "Android only. Calls and alarms from your priority list still come through." (The Settings page that renders sections is built in SD-025; make the component self-contained and testable.)
   - `onboarding.steps` (order 40, id 'silence.permission'): OnboardingStepLayout titled "Stay in the zone": explains the feature, button "Open settings" (then, when the app returns to the foreground, auto-detect and show "Access granted" with a Continue button), and "Skip for now".
6) Dev menu: add the live silence state to the Focus playground.

LIBRARIES: none new.

DONE WHEN
- With DND access granted, starting a focus session turns DND on; breaks, pause, stop and finish turn it off; killing the app never leaves DND stuck on.

TEST (adb: `cmd notification allow_dnd/disallow_dnd <pkg>`, `settings get global zen_mode`)
1. Unit tests: planFor for every event/phase/silence combination, including stopwatch endsAt null and silence=false; serial queue ordering test (enter then exit issued instantly end in exit); store transitions.
2. Countdown session with access granted: zen_mode 1 while running; 0 after pause; 1 after resume; 0 after stop; 0 after natural finish; the "Silence ON" badge appears and disappears accordingly (screenshots).
3. Pomodoro (dev tiny durations): zen_mode 1 in focus, 0 in break, 0 in awaitingNext, 1 again in focus 2, 0 in the long break, 0 at the end.
4. Silence toggle OFF in the form: zen_mode never changes; no badge.
5. Access NOT granted: hint card appears on both timer forms; "Allow" opens the system screen; grant it there (or with adb), return to the app: hint disappears; start session: DND enters. Start a session without access: it runs normally, badge says "needs permission". Revoke access mid-session: no crash, badge changes to blocked.
6. Kill tests: start a focus session, `adb shell am kill <pkg>` after pressing Home, wait past the phase end + 20s: zen_mode returns to 0 (backup alarm). Start a session, force-stop the app (alarm is cancelled by force-stop), reopen: the launch safety net restores DND immediately (zen_mode 0) and the session is restored/finished correctly.
7. User already in DND (`set_dnd alarms`): session does not change it; badge "Already in Do Not Disturb"; after the session zen_mode is still 3.
8. Onboarding step (clear app data): appears after the notification step order (40 before 50 as specified), "Open settings" flow works, and Skip works.
9. The end-of-session alert still reaches the user: after a natural finish with DND on, verify with `adb shell dumpsys notification --noredact | grep -i -B2 -A12 session-end` that the channel has bypassDnd and the alert was posted. Mark the audible check as "Not verified — needs me".
10. Architecture check: `grep -R "silence" src/features/focus` finds NO import of '@/features/silence' (the focus feature must not know Silence exists). The lint rule from SD-002 passes.
11. Regression: all earlier flows; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### Epic E — Cards

---

### SD-017 — Cards data layer

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-006 | op-sqlite (through `Db`), dayjs, zustand/hooks, Jest |

**Goal:** Tables and repository for flashcards and reviews, with the queries the review screen, home and stats will need.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-017 — Cards data layer
GOAL: Create the `cards` feature's database layer and a clean public API. No screens yet.

1) MIGRATIONS (new files, do not edit older ones):
   0004_cards.ts
     CREATE TABLE cards (id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE, front TEXT NOT NULL, back TEXT NOT NULL, ease REAL NOT NULL DEFAULT 2.5, interval_days INTEGER NOT NULL DEFAULT 0, reps INTEGER NOT NULL DEFAULT 0, lapses INTEGER NOT NULL DEFAULT 0, due_at INTEGER NOT NULL, introduced_at INTEGER, last_reviewed_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
     CREATE INDEX idx_cards_due ON cards(due_at);  CREATE INDEX idx_cards_subject ON cards(subject_id);
   0005_reviews.ts
     CREATE TABLE reviews (id TEXT PRIMARY KEY, card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE, rating TEXT NOT NULL CHECK (rating IN ('forgot','hard','easy')), reviewed_at INTEGER NOT NULL, interval_before INTEGER NOT NULL, interval_after INTEGER NOT NULL);
     CREATE INDEX idx_reviews_card ON reviews(card_id);  CREATE INDEX idx_reviews_time ON reviews(reviewed_at);
   Meaning: a card is NEW while introduced_at IS NULL (never reviewed). New cards get due_at = created_at. Deleting a subject deletes its cards and their reviews (cascade).
2) features/cards/data/cardsRepo.ts (through getDb()): createCard({subjectId, front, back}, now), updateCard(id, {front?, back?, subjectId?}, now), deleteCard(id), getCard(id), listBySubject(subjectId, {limit, offset}), countsBySubject(endOfTodayMs): [{subjectId, total, due, new}] (due = introduced AND due_at <= endOfToday), getDueCards(endOfTodayMs, limit), getNewCards(limit), countDue(endOfTodayMs), countNew(), countIntroducedSince(startOfDayMs), recordReview({cardId, rating, reviewedAt, next: {ease, intervalDays, reps, lapses, dueAt}, intervalBefore}) in ONE transaction: update the card (set introduced_at if null, last_reviewed_at, updated_at) and insert the review row, getCardStats(startOfDayMs): { total, mastered (interval_days >= 21), reviewedToday }.
3) features/cards/logic/validateCard.ts (pure): trim; front and back required, max 500 characters each; Result type with error codes 'front_empty' | 'back_empty' | 'front_too_long' | 'back_too_long'. isDuplicate(front, existingFronts) helper (case-insensitive, trimmed) used for a soft warning later.
4) Events: createCard/updateCard/deleteCard/recordReview emit 'cards/changed' { subjectId } (and recordReview also 'cards/reviewed'). Hooks: useCardCounts() (by subject), useDueCount(), useCardStats() that refresh on 'cards/changed', 'cards/reviewed', 'subjects/changed', app foreground and day change.
5) index.ts public API: hooks above, types Card, Rating, and a minimal `cardsApi` ({ countDue, getCardStats }) for other features. Dev menu "Cards playground": add 5 sample cards to a chosen subject, list counts, delete all.

LIBRARIES: none new.

DONE WHEN
- Cards can be created, queried and reviewed (via the playground) and survive restarts; counts are right.

TEST
1. Unit tests with a fake Db: create/update/delete; new vs introduced semantics; countsBySubject due/new numbers; getDueCards ordering (earliest due first) and limit; recordReview is atomic (simulate a failure on the review insert -> card unchanged); introduced_at set only on the FIRST review; getCardStats mastered threshold at 20 vs 21 days.
2. validateCard: empty, spaces, 500 vs 501 chars, duplicate detection (case/space differences).
3. Emulator via the playground: add cards, restart the app, counts persist; delete a subject -> its cards disappear (cascade) and counts update; no foreign-key errors in logcat.
4. Time boundaries: a card due at 23:59 today is "due"; due at 00:01 tomorrow is not (test with an injected endOfToday).
5. Regression: earlier tickets, `npm run check`, logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-018 — Scheduler & queue builder (pure logic)

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-017 | TypeScript only, Jest |

**Goal:** The invisible "brain": a simplified SM-2 spaced-repetition formula and the daily queue rules. Users never see settings for it.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-018 — Scheduler & queue builder (pure logic)
GOAL: Implement the scheduling brain in features/cards/logic/ as pure, fully tested functions (no React, no database, `now` passed in).

TYPES
  export type Rating = 'forgot' | 'hard' | 'easy';
  export interface SchedState { ease: number; intervalDays: number; reps: number; lapses: number; dueAt: number; isNew: boolean }
  export interface SchedResult { ease: number; intervalDays: number; reps: number; lapses: number; dueAt: number }

CONSTANTS: START_EASE = 2.5, MIN_EASE = 1.3, MAX_EASE = 3.0, DAY_MS = 86_400_000, RELEARN_MS = 10 * 60_000, MASTERED_INTERVAL_DAYS = 21.

schedule(card: SchedState, rating: Rating, now: number): SchedResult — rules (these exact rules, do not "improve" them):
  FORGOT: reps = 0; lapses += 1 (not for new cards: a brand-new card forgotten does not count as a lapse); intervalDays = 1 (this is the interval the card will use for its next successful review); ease = max(MIN_EASE, ease - 0.20); dueAt = now + RELEARN_MS (shown again in 10 minutes).
  HARD: first successful review (reps === 0): intervalDays = 1; otherwise intervalDays = max(prevInterval + 1, round(prevInterval * 1.2)); ease = max(MIN_EASE, ease - 0.15); reps += 1; dueAt = now + intervalDays * DAY_MS.
  EASY: first successful review (reps === 0): intervalDays = 3; otherwise intervalDays = max(hardInterval + 1, round(prevInterval * ease)) where hardInterval is what HARD would give; ease = min(MAX_EASE, ease + 0.15); reps += 1; dueAt = now + intervalDays * DAY_MS.
  Use the card's ease BEFORE this update when multiplying the interval.
previewIntervals(card, now): { forgot: string; hard: string; easy: string } labels for the buttons: under 60 minutes '10m'; under 24 hours 'Nh'; under 30 days 'Nd'; under 365 days 'Nmo' (round(days/30)); otherwise 'Ny' (one decimal only if needed). Computed from the real `dueAt - now` of each result.
isMastered(intervalDays) -> intervalDays >= MASTERED_INTERVAL_DAYS.

QUEUE (queue.ts)
  dailyNewLimit(dueCount): <= 30 -> 15; 31..50 -> 10; 51..100 -> 5; > 100 -> 0.
  buildQueue({ due: CardRow[], newCards: CardRow[], newIntroducedToday: number, now, startOfToday, limit?: number }): CardRow[]
    order: overdue (dueAt < startOfToday) by dueAt ascending, then due today by dueAt ascending, then new cards by createdAt ascending (at most max(0, dailyNewLimit(due.length) - newIntroducedToday)). If `limit` is given, cut the final list to `limit` (used by the break quick review: due cards first).
  requeueForgotten(queue, index, card): when the user answers 'forgot' in a session the card is inserted again 5 positions later (or at the end when fewer remain) — return the new queue; do not mutate the input.
  sessionSummary(results: Rating[]) -> { total, forgot, hard, easy, accuracyPct } where accuracyPct = round(100 * (hard + easy) / total) (0 when total = 0).

LIBRARIES: none.

DONE WHEN
- All functions exist with JSDoc and exhaustive tests.

TEST (Jest, fixed timestamps)
1. Table-driven tests for schedule(): new card forgot/hard/easy; second review hard/easy at interval 1, 3, 10, 30; ease floor 1.3 reached after repeated forgets and never lower; ease cap 3.0; hard always greater than the previous interval; easy always greater than hard; forgot after a long interval resets reps and interval to 1; lapses counting; dueAt values exact; input object not mutated.
2. A simulation test: a card answered 'easy' 8 times in a row follows intervals 3, then increasing, and never decreases; a card alternating forgot/easy never produces NaN/Infinity.
3. previewIntervals boundaries: 59 minutes vs 60 minutes, 23h vs 24h, 29 vs 30 days, 364 vs 365 days.
4. dailyNewLimit boundaries (30, 31, 50, 51, 100, 101). buildQueue: ordering, the new-card quota with newIntroducedToday = 10 and 15, limit parameter, empty inputs, overdue vs due-today split at startOfToday.
5. requeueForgotten: positions, short queue, immutability. sessionSummary with 0 results.
6. `npm run check` green; app still launches (no UI change).

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-019 — Library page & subject card list

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-017, SD-003 | React Navigation (root screen), FlatList, SD-003 UI kit |

**Goal:** The Library page: your subjects with card counts, and a list of cards for each subject.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-019 — Library page & subject card list
GOAL: Build the "Library" sub-tab (Cards tab) and the per-subject card list. Adding/editing cards arrives in SD-020, so here the "+" and "edit" actions call a stub that shows a Toast "Editor arrives in the next step".

1) features/cards/screens/LibraryScreen.tsx (replace the placeholder):
   - Header text "My subjects".
   - FlatList of subject rows: color bar, name, "48 cards  |  5 due" (from useCardCounts), tap -> root screen 'SubjectCards' with { subjectId }.
   - Subjects with 0 cards still show ("0 cards").
   - A floating "+" button (bottom-right, above the tab bar) -> `openCardEditor({ mode: 'create' })` (stub for now, implemented in SD-020).
   - Empty state when there are no subjects: "Add a subject first" with a button -> navigateToScreen('ManageSubjects'). Empty state when subjects exist but total cards = 0: "Add your first flashcard".
2) features/cards/screens/SubjectCardsScreen.tsx registered as a root-stack screen 'SubjectCards' (header shows the subject name + color dot):
   - FlatList (paged: load 30 at a time with onEndReached) of card rows: front text (2 lines max), a small badge NEW / DUE / "in 5d" (computed by a pure function cardStatusLabel(card, now, endOfToday) in logic/, unit-tested), tap -> openCardEditor({ mode: 'edit', cardId }) (stub).
   - Empty state with "Add card" button (stub).
   - Pull to refresh; refreshes on 'cards/changed'.
3) src/features/cards/api/openCardEditor.ts: `openCardEditor(params)` — for now shows the Toast. (SD-020 replaces the body; keep the signature.) Export it from the cards index.ts.
4) Performance: memoized row components, getItemLayout if rows are fixed height, no inline lambdas in renderItem props that break memo.

LIBRARIES: none new.

DONE WHEN
- Library shows real counts; each subject opens its card list; empty and loading states are handled.

TEST
1. Unit tests: cardStatusLabel (new, due today, overdue, due in 1 day, in 3 days, in 2 months), paging helper if you wrote one.
2. Emulator: use the Cards playground to create 3 subjects with 0, 5 and 70 cards; Library shows the right counts; open the 70-card subject: scrolling loads more pages smoothly (check there is no jank and logcat has no warnings about VirtualizedList).
3. Delete a subject (ManageSubjects) -> Library updates without restarting the app.
4. Empty states: no subjects; subjects but no cards.
5. Pull to refresh works; large font 1.3 does not break the rows; light and dark theme screenshots.
6. The Android back button from SubjectCards returns to the Library tab on the same sub-tab.
7. Regression: Review placeholder and everything earlier still work; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-020 — Add / edit card sheet

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-019 | SD-003 BottomSheet + TextField, React Navigation transparent modal, MMKV `createSetting` |

**Goal:** Adding a card in 3 taps: front, back, Save & next. The most important flow of the whole flashcard side.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-020 — Add / edit card sheet
GOAL: Implement the card editor as a root-stack transparent modal showing the shared BottomSheet. Replace the stub `openCardEditor` from SD-019 (same signature). It must be reachable from anywhere in the app through navigateToScreen, so later features (for example Home) can open it without importing cards internals.

1) Root screen 'CardEditor' registered in cards/feature.ts with options: transparent modal presentation, animation 'fade' (the BottomSheet does its own slide), no header, gesture dismissal disabled. Params: { mode: 'create'; subjectId?: string } | { mode: 'edit'; cardId: string }.
2) features/cards/screens/CardEditorScreen.tsx (UI only; logic in logic/cardEditorForm.ts):
   - Title "New card" or "Edit card".
   - Fields in this order: FRONT (multiline, autofocus in create mode, max 500 with counter), BACK (multiline, max 500), subject chip (SubjectPicker from '@/features/subjects', allowNone = false).
   - Subject default: params.subjectId, else the last used subject (createSetting 'cards.lastSubjectId'), else the first subject. If no subject exists at all: show an inline EmptyState with "Create a subject" -> navigateToScreen('ManageSubjects') and hide the form.
   - Create mode buttons: primary "Save & next" (saves, shows a Toast "Saved", clears both fields, returns focus to FRONT, keeps the subject), plus a small text button "Save & close". Close (X / backdrop / drag down) with unsaved text asks ConfirmDialog "Discard this card?".
   - Edit mode buttons: primary "Save", danger text button "Delete card" (ConfirmDialog; deleting closes the sheet and shows a Toast).
   - Live validation with validateCard error messages; the Save button is disabled while invalid; trimming on save.
   - Soft duplicate warning: if the front matches an existing card in the same subject (case-insensitive), show a caption "A card with this question already exists" but still allow saving.
   - Keyboard: fields and buttons always visible above the keyboard; the sheet scrolls if needed; pressing "next" on the keyboard moves from FRONT to BACK.
3) Save logic uses the cardsRepo and emits 'cards/changed' (already done by the repo). Remember the subject in 'cards.lastSubjectId' on every successful save.
4) Replace the SD-019 stubs: Library "+" opens create (with the first/last subject), SubjectCards "+" opens create for that subject, tapping a card row opens edit.
5) Dev check: from the Library "+" add 10 cards quickly.

LIBRARIES: none new.

DONE WHEN
- Create (with Save & next), edit and delete work; the Library and the card list update immediately; adding a card takes 3 taps.

TEST
1. Unit tests for logic/cardEditorForm.ts (initial values per mode, default subject resolution order, validity, dirty detection, reset after save-and-next, duplicate detection).
2. Emulator: from Library press "+", type a front and back (use `adb shell input text`), tap "Save & next" three times: three cards saved, fields cleared, focus back on FRONT, subject unchanged; "Save & close" closes. Count the taps for the happy path and report it.
3. Validation: empty front/back and 501 characters block saving with messages; spaces-only counts as empty.
4. Edit: change text and subject, save: the card row and counts update; delete: confirm dialog, then it disappears and counts change.
5. Discard dialog appears only when there is unsaved text.
6. Open the sheet with the keyboard up on a small display (`adb shell wm size 720x1280; adb shell wm density 320`): buttons stay visible; then restore `adb shell wm size reset; adb shell wm density reset`.
7. Rotate/back: Android back closes the sheet (with the discard check). Open the editor, background the app, return: state is intact.
8. No subjects at all: the inline empty state appears and leads to ManageSubjects.
9. Regression: Library + SubjectCards, subjects, timers still work; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-021 — Review page (flip, 3 buttons)

| Size | Depends on | Libraries & tech |
|---|---|---|
| L | SD-014, SD-018, SD-020 | Reanimated (3D flip), react-native-haptic-feedback (through `haptic()`), zustand, SD-018 scheduler |

**Goal:** The daily review: a card appears, you flip it, you press Forgot / Hard / Easy, and the app schedules everything by itself.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-021 — Review page
GOAL: Build the "Review" sub-tab: a summary, then a review session using the SD-018 scheduler. Design the session as a REUSABLE component (`ReviewSession`) because the break quick review (SD-022) will embed it with a card limit.

1) features/cards/store/reviewSessionStore.ts (zustand, in-memory only): { queue, index, flipped, results: Rating[], status: 'idle'|'loading'|'running'|'done' }, actions: begin({ limit? }), flip(), answer(rating), end(). begin() loads due cards (getDueCards with endOfToday), new cards (getNewCards) and countIntroducedSince(startOfToday), then calls buildQueue. answer(): computes schedule(...) (pure), calls recordReview in one transaction, plays a haptic ('light'), updates results, re-queues a forgotten card with requeueForgotten, moves to the next card; if answering fails (database error) show a Toast and stay on the same card (no skipping).
2) features/cards/components/ReviewSession.tsx — props: { limit?: number; onExit: () => void; header?: ReactNode }. Layout:
   - Top: progress bar (reviewed / total) and "11 left".
   - Card area: a tall card (surface color, subject color stripe + subject chip) showing the FRONT. Tap the card or the yellow "Show answer" button to flip: 300ms 3D flip with Reanimated (rotateY with perspective, backfaceVisibility hidden on both faces); with reduced motion use a 150ms crossfade. The back face shows the question small and muted on top, a divider, and the answer large in the primary color.
   - Long text: the card body scrolls inside a fixed max height; font size never below 14.
   - After the flip: three buttons in a row — Forgot (danger), Hard (primary), Easy (success) — each with "next: 10m / 2d / 5d" caption from previewIntervals. Buttons are disabled for 250ms after the flip to prevent accidental double taps.
   - Header slot (the `header` prop) renders above the progress bar.
   - "End" text button (top right) -> if any card was answered show a summary, else onExit.
3) Summary view when the queue is empty or ended: "Review complete", counts (Forgot/Hard/Easy), accuracyPct, a flame/check illustration (reuse core Celebration only if accuracyPct >= 70 and total >= 5), and a Done button -> onExit.
4) features/cards/screens/ReviewScreen.tsx (replace the placeholder): idle state shows: big "12 due - 3 new" (counts from cardsRepo with the same quota rule as buildQueue so the number matches what the session will contain; add a pure helper `previewCounts` to logic/ and unit-test it), "Start review" button (disabled when nothing to review), and when nothing is due a friendly "All caught up" empty state with the time until the next due card ("Next card in 3h" / "tomorrow"). Pressing Start renders <ReviewSession onExit={...}/> inline.
5) Emit 'cards/reviewed' for each answer (the repo already does; do not duplicate).
6) Accessibility: the card has an accessibilityLabel that includes the visible text and "double tap to flip"; the buttons announce their next-interval text.

LIBRARIES: none new (uses haptic() from core and Reanimated already installed).

DONE WHEN
- A user can review all due cards, ratings reschedule cards correctly in the database, and the summary appears.

TEST
1. Unit tests: previewCounts matches buildQueue's size for many combinations; reviewSessionStore with a fake repo: begin builds the queue; answer('forgot') requeues; answer('easy') writes the exact schedule() result; a failing repo call keeps the same card; end() resets; limit works.
2. Emulator: create a subject with 6 cards via the editor (SD-020). Open Review: shows "0 due - 6 new" (new cards count as available up to the quota). Start, flip, answer all with different ratings. After the session: check the database values for each card with the playground (or a dev query) and compare with the scheduler rules: forgot -> due in ~10 minutes; hard -> 1 day; easy -> 3 days (first review).
3. The forgotten card returns within the same session after about 5 other cards (or at the end).
4. Quota: create 20 new cards: only 15 appear in a day's queue (or fewer if some were introduced today); next day logic is covered by unit tests (also simulate by changing the device date with `adb shell` only if safe; otherwise rely on tests and say so).
5. Flip animation: take screenshots mid-flip if possible; confirm the back face is never mirrored; test with `adb shell settings put global animator_duration_scale 0` -> crossfade or instant flip, nothing stuck; restore to 1.
6. Long answer text (400 characters) scrolls inside the card; very short text is centered; light and dark themes.
7. Leave the screen mid-session and come back: the session state is sensible (either resumed from the DB state or restarted from the current due list — never showing an already-answered card as unanswered, check by comparing counts).
8. Empty state: no cards due -> "All caught up" with a sensible "next due" text.
9. Regression: Library/editor, timers, silence still work; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-022 — Break-time quick review

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-012, SD-021 | slots (`focus.breakPanel`), React Navigation root screen, focus public API hooks |

**Goal:** The signature loop: study, then during the break a quick 2–3 minute card review pops up — wired through a slot, without editing the timer screens.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-022 — Break-time quick review
GOAL: During a Pomodoro break, offer a quick review of up to 5 due cards. The Cards feature plugs into the `focus.breakPanel` slot; you must NOT edit the focus feature's files except for exporting what the public API already should expose (see step 4).

1) features/cards/components/BreakReviewCard.tsx registered in cards/feature.ts as a slot item `focus.breakPanel` (id 'cards.breakReview', order 10):
   - Uses useDueCount (cards) and renders: if due > 0 -> a Card "5 cards are due" + primary button "Quick review (5 cards)" (the number is min(5, due + available new)); if nothing is due -> a muted "No cards due. Nice work!".
   - Pressing the button -> navigateToScreen('QuickReview').
2) Root screen 'QuickReview' registered in cards/feature.ts (card presentation, header hidden): features/cards/screens/QuickReviewScreen.tsx renders <ReviewSession limit={5} onExit={goBack} header={<BreakBanner/>} />.
   BreakBanner: reads the active session from '@/features/focus' (useFocusActive, useRemainingMs): shows "Break ends in 3:12" while phase is break/longBreak; when the break is over or the session ended shows "Break is over" with a button "Back to timer" (goBack). The countdown keeps ticking because the timer lives in the focus store, not in this screen.
3) The quick review uses due cards first, then new cards (buildQueue with limit 5). It never blocks the timer: the break timer continues; if the break ends while reviewing, the user can finish the card they are on (the banner changes), and the focus alert notification still fires.
4) If the focus public API (features/focus/index.ts) does not yet export what the banner needs (useFocusActive, useRemainingMs, Phase type), add those exports ONLY (additive). Mention it in the report.
5) Make sure ActiveSessionView (focus) renders the slot only in break phases (it already does from SD-012). Do not add any cards-related code to the focus feature.

LIBRARIES: none new.

DONE WHEN
- During a Pomodoro break, the break panel shows the quick-review card; the session runs; returning goes back to the timer.

TEST
1. Unit tests: breakCount helper (min(5, due + newAvailable)), BreakBanner state function (break running, break over, session ended).
2. Emulator with dev tiny pomodoro (focus 15s / break 60s): create 8 cards (due/new). During the break the panel shows "Quick review (5 cards)". Open it: the banner counts down; answer 5 cards; the summary appears; Done returns to the break view with the timer still correct. Screenshots at each step.
3. With 0 due and 0 new cards: the panel shows the muted message.
4. Let the break end while the quick review is open: the banner changes to "Break is over" and "Back to timer" works; DND state (SD-016) was already off during the break and the alert fired.
5. Pressing Android back from QuickReview returns to the timer; the review answers already given are saved (check the database/playground).
6. Architecture check: `grep -R "cards" src/features/focus` finds no imports from '@/features/cards'; the lint rule passes.
7. Regression: normal Review tab, library, all timer flows; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````


---

### Epic F — Progress & home

---

### SD-023 — Stats data layer

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-009, SD-017 | dayjs, sessions + cards + subjects public APIs, Jest |

**Goal:** Turn raw sessions and cards into the numbers the Stats page and Home need. Pure aggregation functions + one hook.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-023 — Stats data layer
GOAL: Build features/stats data + logic. Stats imports ONLY the public APIs of sessions, cards and subjects.

1) features/stats/logic/aggregate.ts — pure functions (all take `today: string` 'YYYY-MM-DD' and plain data):
   - weekBars(totalsByDay, today): 7 items Monday..Sunday of the CURRENT week: { day, label: 'M'|'T'|'W'|'T'|'F'|'S'|'S', secs, isToday, isFuture }.
   - weekTotalSecs(bars).
   - subjectSplit(rows: {subjectId: string|null; secs: number}[], subjectsById, maxSegments = 4): segments { subjectId, name, color, secs, fraction } sorted by secs desc; anything beyond maxSegments-1 is merged into "Other" (muted color); null subject = "No subject"; fractions sum to 1; empty input -> [].
   - streakGrid(totalsByDay, today, weeks = 4, minSecs = STREAK_MIN_SECS): rows of 7 cells (Monday..Sunday), oldest week first, the last row is the current week: { day, secs, qualified, isToday, isFuture }.
   - formatStatsDuration(secs): '9h 40m', '45m', '0m'.
2) features/stats/hooks/useStats.ts: combines sessions hooks (useDailyTotals for the 4 weeks range, useSubjectTotals for the current week, useStreak, total focused seconds) and cards (useCardStats) and subjects (useSubjects) into:
   { status: 'loading' | 'ready' | 'empty', weekBars, weekTotalSecs, split, grid, tiles: { cardsMastered: number; bestStreak: number; currentStreak: number; totalFocusedSecs: number; totalSessions: number } }.
   'empty' = no sessions and no reviewed cards at all. It must update live on 'sessions/saved', 'cards/reviewed', 'subjects/changed', on app foreground and on day change.
3) features/stats/index.ts exports useStats and the types.
4) Dev menu: "Stats playground" printing the useStats JSON (and a button to seed 30 days of fake sessions in a DEV-ONLY helper; the helper must refuse to run in release builds).

LIBRARIES: none new.

DONE WHEN
- useStats returns correct numbers for seeded data and updates live.

TEST
1. Unit tests for every function: weekBars with today = Monday, Wednesday, Sunday and across a month/year boundary; future days flagged; split with 0, 1, 4, 6 subjects, null subject, equal seconds (stable order), fractions sum to 1; streakGrid alignment on every weekday for `today`, qualified threshold at 599/600 seconds; format helper cases.
2. Hook test with mocked public APIs: status transitions loading -> ready/empty; recomputes after a fake 'sessions/saved' event.
3. Emulator: seed fake data in the playground, compare printed numbers with a manual calculation from the seed (print the seed table in the report). Delete a subject: the split updates; clear data: status 'empty'.
4. Day change: with `adb shell` date changes NOT allowed (do not modify the emulator clock); instead unit-test the day-change logic with an injected clock and say so.
5. Regression: all earlier flows; `npm run check` green; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-024 — Stats page UI

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-023 | react-native-svg, Reanimated, SD-003 UI kit |

**Goal:** The Me → Stats page: weekly bars, subject split, streak grid, tiles.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-024 — Stats page UI
GOAL: Replace the Stats placeholder with the real page using useStats. Charts are drawn with react-native-svg (no chart library).

Layout (scrollable, theme tokens only):
1) "THIS WEEK" caption + big total (e.g., "9h 40m").
2) Weekly bar chart: 7 bars (M..S) with day labels; today's bar in the focus (red) color, other bars in accent (blue); future days drawn as a thin muted stub; bar height proportional to the max of the week (minimum visible height for non-zero days); bars grow from 0 in 350ms on first show (skip with reduced motion). Tap a bar -> small tooltip with the exact duration and the weekday.
3) "BY SUBJECT": one horizontal stacked bar with segments in subject colors + a legend (color dot, name, duration, percent). "Other" and "No subject" use muted colors.
4) "STREAK (last 4 weeks)": 4 rows x 7 squares (Monday..Sunday); qualified days in primary color, others in surface color, future days transparent with a dashed border, today has an outline. Caption "A day counts after 10 minutes of focus."
5) Tiles row: "Cards mastered", "Best streak (days)", "Current streak", "Total focus time". Two tiles per row.
6) Empty state when status = 'empty': an illustration (simple SVG), "Your progress will appear here" and a button "Start a focus session" -> navigateTo('focus').
7) Loading state: skeleton blocks (no spinner flash if data arrives in under 200ms).
8) Accessibility: the chart has one summary accessibilityLabel ("This week: 9 hours 40 minutes. Monday 45 minutes, ...") and each bar is an accessible element with its own label.
9) Components in features/stats/components: WeekBarChart, SubjectSplitBar, StreakGrid, StatTile (each pure UI, props-driven, no data fetching).

LIBRARIES: none new.

DONE WHEN
- The page matches the described layout with real data and updates live after a session or a review.

TEST
1. Unit tests for chart geometry helpers (bar heights, minimum height, stub for future days, label text builders).
2. Emulator: seed data (dev stats playground), open Me -> Stats: screenshots in dark and light. Compare displayed numbers with the playground JSON.
3. Finish a real short session (dev tiny config) while on the Stats tab: the numbers update without a restart.
4. Empty state (clear data) and loading state look right.
5. Tap bars: tooltip shows and disappears; large font 1.3 keeps labels readable; 360dp-wide layout check (`adb shell wm size 720x1280; adb shell wm density 320`, then `wm size reset; wm density reset`).
6. Scroll performance: no jank; logcat shows no warnings.
7. Regression: Settings placeholder tab next to it still works; swipe between Stats and Settings.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-025 — Settings page

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-007, SD-016 | slots (`settings.sections`), MMKV prefs, @react-native-community/datetimepicker, SD-003 UI kit |

**Goal:** One settings page assembled from sections that every feature contributes. Adding a new setting later = adding a slot item, never editing this page.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-025 — Settings page
GOAL: Build the Me -> Settings page as a list rendered from `<Slot name="settings.sections" />`, plus the settings feature's own sections.

1) Shared components in src/core/ui (new files): SettingsSection (title + card container), SettingsRow (label, optional caption, optional right element: value text with chevron, Toggle, or status chip; whole row pressable when onPress is given, 48dp min height). Refactor the two section components that already exist (subjects 'subjects.manage' and silence 'silence.section') to use them so the page looks consistent. Behavior must not change.
2) The page: features/settings/screens/SettingsScreen.tsx = a ScrollView with the slot, ordering by item `order`, followed by a small footer "v<version> - 100% offline - no account" (version from package.json via resolveJsonModule). Each section is already wrapped in an error boundary by Slot.
3) Settings feature sections (register in settings/feature.ts):
   - 'settings.goal' (order 5) "Study goals": row "Daily study goal" -> opens a BottomSheet with the stepper (-/+ 15 min, 15 min..12 h, uses clampGoal); row "Exam" shows "NEET - 14 May 2027 (87 days)" or "Not set"; tapping opens a BottomSheet with name field, date (datetimepicker), "Clear exam".
   - 'settings.feedback' (order 30) "Feedback": Toggle "Vibration" (prefs.hapticsEnabled), Toggle "Alert sound" (prefs.soundEnabled; caption "Applies to the next session alert").
   - 'settings.appearance' (order 40) "Appearance": SegmentedControl System | Dark | Light bound to prefs.themeMode; the whole app re-themes instantly.
   - 'settings.about' (order 90) "About": rows "Version", "How your data is stored" (a BottomSheet explaining: everything is stored only on this phone; backups are files you control).
4) The 'me' tab container remains owned by the settings feature (SD-005); do not change its registration.
5) Changing a goal/exam must update Home/Stats live (they read the same createSetting hooks); no event wiring is needed, but verify it.

LIBRARIES: none new.

DONE WHEN
- All sections from all features appear in order and every control works and persists.

TEST
1. Unit tests: section ordering through the registry (silence 10, subjects 20, feedback 30...), clampGoal edge cases, exam text builder (no exam, exam in future, exam today, past exam -> shows "Exam passed" and offers Clear).
2. Emulator: screenshots of the whole page in dark and light; change each setting, force-stop and reopen: values persist.
3. Theme segmented control: switching System/Dark/Light re-themes immediately, including the tab bar and status bar; "System" follows the emulator's dark mode (`adb shell cmd uimode night yes|no`).
4. Daily goal 15 min and 12 h limits; exam date picker rejects past dates; clearing works.
5. Vibration/alert sound toggles change `prefs` values and the next scheduled alert uses the right channel (check `dumpsys notification` after scheduling a short session).
6. Silence section from SD-016 and Subjects row from SD-006 are present, ordered, and functional (open ManageSubjects).
7. A broken section (temporarily throw inside one test slot item) does not crash the page; remove the temporary code afterwards.
8. Large font 1.3: rows wrap, nothing is cut off.
9. Regression: onboarding goal step and settings values agree; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-026 — Backup export / import

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-025 | react-native-fs, @react-native-documents/picker, react-native-share, op-sqlite transaction, Jest |

**Goal:** Because the app is offline with no account, a backup file is the only safety net when changing phones. One JSON file, validated before import, all-or-nothing.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-026 — Backup export / import
GOAL: Build the `backup` feature: export everything to one JSON file the user can save anywhere, and import it back safely. Each feature contributes its own data through a BackupProvider (so future features are included automatically).

1) INSTALL react-native-fs, @react-native-documents/picker, react-native-share (official guides; for react-native-share configure the Android FileProvider as documented; rebuild; confirm launch). If one is incompatible, STOP and ask me.

2) CORE CHANGE (allowed here because no provider exists yet; tell me): change the BackupProvider type in src/core/registry/types.ts to:
   { id: string; order: number; export: () => Promise<unknown>; clear: (db: Db) => Promise<void>; import: (data: unknown, db: Db) => Promise<void> }
   so import/clear run inside ONE database transaction handed in by the backup engine. Add the event 'backup/restored': {} to AppEvents.
3) Providers (add `backup:` to these manifests — additive; each in its own file features/<name>/data/backupProvider.ts, with hand-written validators, no validation library):
   - subjects (order 10): rows of subjects.
   - sessions (order 20): rows of sessions.
   - cards (order 30): rows of cards and reviews (reviews after cards).
   - settings (order 40): the allow-listed MMKV keys: 'settings.*', 'onboarding.done', 'focus.lastConfig', 'cards.lastSubjectId', and the prefs keys (themeMode, hapticsEnabled, soundEnabled, silenceDefault). NEVER 'focus.activeState'. MMKV writes are applied only AFTER the database transaction succeeds.
   `clear` order is the reverse of `order` (reviews/cards before subjects, etc.).
4) features/backup/logic: buildBackup(providersData, schemaVersion, now) -> { app: 'study-dojo', format: 1, schemaVersion, exportedAt, data: { [providerId]: unknown } }; parseBackup(text) -> Result with error codes: 'not_json' | 'wrong_app' | 'unsupported_format' | 'newer_schema' (schemaVersion greater than getLatestMigrationId()) | 'invalid_data' (a provider validator rejected it, include provider id) | 'too_large' (over 20 MB). Older schemaVersion is accepted (rows are validated per provider; missing optional fields get defaults). summarize(parsed) -> counts for the confirmation text.
5) Services:
   - exportBackup(): collect every provider's export (ordered), buildBackup, write to the app cache dir as `study-dojo-backup-YYYY-MM-DD.json` with react-native-fs, then open the share sheet with react-native-share (type application/json) so the user can save it to Drive/Files or send it to themselves. Save `backup.lastExportAt` (createSetting). Delete the cache file after sharing finishes or fails.
   - importBackup(): pick a file with @react-native-documents/picker (copy to a local cache file using the library's documented local-copy helper), read with react-native-fs, parseBackup, show the summary in a ConfirmDialog ("Replace ALL data on this phone with this backup? 12 subjects, 340 cards, 58 sessions. This cannot be undone."), refuse with a clear message if a focus session is active (use focusController.getActive()), then run clear + import for all providers in ONE db.transaction; on any error everything rolls back and the database and MMKV stay untouched; then apply the settings provider's MMKV values, emit 'subjects/changed', 'cards/changed', 'backup/restored', show a success Toast and navigate to the Home tab.
6) UI: settings slot section `settings.sections` (id 'backup.section', order 50) "Your data": rows "Export backup" (caption "Last backup: 12 Mar 2027" or "Never"), "Import backup" (danger style). Busy state while working; errors shown as Toast with human-readable text for each error code.
7) Docs: add README section "Backup format" describing the JSON structure and how a new feature adds a BackupProvider (3 lines).

LIBRARIES: react-native-fs, @react-native-documents/picker, react-native-share (new).

DONE WHEN
- Export -> wipe app data -> import restores everything (subjects, cards with their schedules, sessions, settings).

TEST
1. Unit tests: buildBackup/parseBackup for every error code; validators for each provider (missing fields, wrong types, negative numbers, unknown rating value, card pointing to a missing subject, duplicate ids); import ordering and reverse clear ordering with a fake Db; a provider throwing in the middle rolls back everything (fake Db transaction) and MMKV is untouched; settings provider excludes 'focus.activeState'.
2. Emulator round trip: seed data (subjects, cards with different schedules, sessions, settings changes). Export (the share sheet appears; save/copy the JSON out with the share target available on the emulator, or read it from the cache dir with adb before deletion, or add a DEV-only option "export to /sdcard/Download"), inspect the JSON. Clear app data (`adb shell pm clear <pkg>`), reopen (skip onboarding), import the JSON (`adb push backup.json /sdcard/Download/` then pick it with the system picker; use uiautomator/screenshots), and compare every table's row counts and a few cards' due dates with the originals.
3. Corrupt files: edit the JSON to (a) invalid syntax, (b) a different app name, (c) schemaVersion 999, (d) a card with an unknown subject, (e) a 25 MB file: each shows the right message and changes nothing.
4. Import while a session is active: refused with a clear message.
5. A failure injected in the middle of import (dev-only switch) leaves the original data intact.
6. Large data: 2000 cards + 500 sessions export and import in reasonable time without freezing the UI (report timings).
7. Regression: after import, Home/Stats/Library/Review show the restored data without restarting the app; logcat clean.
8. Not verified (needs me): saving the export to Google Drive / Files on a real phone and importing from there.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-027 — Home dashboard

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-010, SD-021, SD-023 | public APIs of focus, sessions, cards, subjects, settings; slot `home.dashboard`; SD-003 UI kit |

**Goal:** The Home tab: what to do right now. Greeting, exam countdown, goal ring, streak, cards due, one big Start button and subject chips.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-027 — Home dashboard
GOAL: Build the Home tab. Home reads other features ONLY through their index.ts public APIs and ends with a `home.dashboard` slot for future widgets.

1) Public API additions (additive; mention them): focus index exports `focusController.setLastSubject(subjectId | null)` (updates focus.lastConfig's subject only) and `getLastConfig()`. Do not change anything else in focus.
2) features/home/screens/HomeScreen.tsx (ScrollView, theme tokens only), top to bottom:
   a) Greeting: "Good morning / afternoon / evening" (by local hour: <12, <17, else) and "Hey, Aspirant!" (no name; there is no account). At the right an exam chip "EXAM IN 87 DAYS" (red) shown only when useExam().daysLeft is not null; "TODAY!" on exam day; tap -> navigateTo('me', 'settings').
   b) Goal card: ProgressRing (progress = min(1, todaySecs / goalSecs)) with the percentage in the middle, caption "TODAY'S GOAL", big "1h 18m", small "of 2h target"; when reached: check icon + "Goal reached!" (ring in success color).
   c) Two tiles: Streak ("7 day streak" with Flame; if today has not yet qualified and current > 0 add the muted caption "Study 10 min to keep it") -> tap navigateTo('me', 'stats'); Cards due ("12 cards due"; "All clear" at 0) -> tap navigateTo('cards', 'review').
   d) Primary big button:
      - no active session: "START FOCUS 25:00" with the second line "<Subject or 'No subject'> | <Pomodoro or Simple>" from getLastConfig() (default when none: Pomodoro 25/5, no subject). Pressing it calls focusController.startLast() and then navigateTo('focus', 'pomodoro' | 'simple'); if start is rejected show a Toast.
      - active session: "RESUME SESSION - 12:40" (remaining or elapsed) -> navigateTo('focus'). Re-renders every second only inside this button component.
   e) "SUBJECTS" caption + horizontally scrolling SubjectChip row; tapping a chip selects the subject for the Start button (focusController.setLastSubject) with a selected style; a trailing "+ Add" chip -> navigateToScreen('ManageSubjects'). When there are no subjects show a friendly single line + the Add chip.
   f) `<Slot name="home.dashboard" />` at the bottom.
3) A small pure helper file features/home/logic/homeText.ts (unit-tested): greetingFor(hour), examChipText(daysLeft), goalProgress(todaySecs, goalMin), startButtonLabels(config|null, subjectName|null).
4) First-launch state: with no data at all the page must look intentional (goal 0%, streak 0, "All clear", Start button works).

LIBRARIES: none new.

DONE WHEN
- Home shows live data; the Start button starts the last-used timer in one tap; chips choose the subject.

TEST
1. Unit tests for homeText helpers (hours 0, 11, 12, 16, 17, 23; days left 0/1/87; goal progress 0, 50%, 100%, above 100%; labels with and without subject/config).
2. Emulator: fresh install state, then after onboarding: screenshot Home (dark + light). Seed sessions with the sessions playground and check the ring, text and streak tile values.
3. Press START FOCUS: the Focus tab opens on the correct sub-tab with the session running; Home now shows RESUME SESSION with a changing time; Pause/stop there and Home returns to START.
4. Pick another subject chip, start: the session uses that subject (check the sessions table after finishing).
5. Streak tile -> Stats; cards-due tile -> Review; exam chip -> Settings.
6. With 0 subjects: the empty chip row + Add works; after adding the subject it appears without restart.
7. Change daily goal in Settings: Home updates live. Finish a session: ring/streak update live.
8. Architecture check: grep shows home imports only '@/features/<name>' index files and core. `npm run check` green.
9. Regression: all earlier flows; logcat clean.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### Epic G — Release

---

### SD-028 — Polish: states, accessibility, device sizes

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-027 | existing libraries only; adb display tools (`wm size`, `wm density`, `font_scale`) |

**Goal:** Make the whole app feel finished: no blank screens, no crashes screens, readable on small phones and with big fonts, edge-to-edge correct on Android 15.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-028 — Polish: states, accessibility, device sizes
GOAL: A cross-app quality pass. Fix problems you find, in the owning feature, with minimal changes. Do not add features.

1) Global safety: add a root ErrorBoundary (src/app) with a friendly "Something went wrong" screen, a "Restart app" button (resets the navigation/state tree) and a dev-only error text. Make sure bootstrap errors (SD-004) and slot errors (SD-002) still work as designed.
2) States audit: for EVERY screen and sheet list its states (loading, empty, error, normal, long text, many items) in a table in your report and verify each on the emulator. Fix missing ones (use EmptyState, Toast).
3) Edge-to-edge: the emulator is Android 15 (API 35) where apps are drawn edge-to-edge by default. Verify no content is hidden under the status bar, gesture/navigation bar or camera cutout on every screen, sheet and the tab bar; fix with safe-area insets.
4) Contrast & accessibility: write a Jest test that computes WCAG contrast for the text/background token pairs in both themes (body text and muted text on background/surface must be >= 4.5:1; large text >= 3:1; onPrimary on primary >= 4.5:1). Adjust tokens only if a pair fails (tell me the new values). Check that every touchable has an accessibilityLabel/role, the ring/timer announces remaining time sensibly (not every second), headings have accessibilityRole="header", and the tab bar items announce selected state.
5) Font scale: test at 1.0, 1.3 and 1.5 (`adb shell settings put system font_scale 1.5`) on Home, Focus (both pages + active), Cards (Review, Library, editor), Stats, Settings, onboarding: no cut-off buttons, overlapping text or unreachable controls; allow wrapping or cap scaling with `maxFontSizeMultiplier` on the big timer only. Restore font_scale to 1.0 at the end.
6) Small and large screens: test `adb shell wm size 720x1280` + `wm density 320` (small), the default Pixel 6, and a wide tall one `wm size 1080x2640`; restore with `wm size reset` and `wm density reset`.
7) Keyboard: every TextField screen/sheet works with the keyboard open (onboarding custom subject, subject form, card editor, custom timer sheets, exam name).
8) Back button & lifecycle: Android back behaves sensibly everywhere (sheets close first, then screens, then tab history, exit only from Home); background/foreground with an active session on every screen; rapid taps (double tap Start/Stop/Save) never create duplicates (disable buttons while an async action runs).
9) Remove leftover dev code from production paths: all dev screens/menus only under __DEV__; no console.log; no TODO comments without an issue note.

LIBRARIES: none new.

DONE WHEN
- The states table is complete and all rows pass; contrast test passes; no layout problems at the tested sizes.

TEST
1. Run every check above and attach, in the report, a compact table: screen x (state/size/font) -> pass/fixed/not applicable.
2. Run the contrast Jest test; show its output.
3. Double-tap protection: rapidly tap Start, Save & next, Delete, Import/Export: only one action happens.
4. Monkey test: `adb shell monkey -p <pkg> --pct-syskeys 0 -v 500` (no system keys) — no crashes or ANRs in logcat (`adb logcat -d | grep -E "FATAL|ANR"`).
5. Full `npm run check` green; regression of all main flows (onboarding, timer, cards, stats, settings, backup).

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-029 — Performance & app size

| Size | Depends on | Libraries & tech |
|---|---|---|
| M | SD-028 | Hermes, R8/ProGuard, Gradle ABI splits, `depcheck` (dev-only, temporary), adb profiling commands |

**Goal:** A small, fast app: measure first, then optimize only what the numbers show.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-029 — Performance & app size
GOAL: Measure, then optimize. Report before/after numbers. My laptop has little RAM and slow internet: run one heavy Gradle task at a time and do not delete caches without asking.

1) BASELINE (before changing anything): build a release APK (`cd android && ./gradlew assembleRelease`, signed with the debug key for now), record: APK size, per-ABI size if splits are enabled, installed size (`adb shell dumpsys package <pkg> | grep -i codePath` then size of the dir), JS bundle size, cold start time (`adb shell am start -W <pkg>/.MainActivity`, 5 runs after `force-stop`, report median), memory (`adb shell dumpsys meminfo <pkg>` after opening each tab), and idle CPU while a session runs with the screen on.
2) OPTIMIZE (only what is justified by the numbers; list each change and its effect):
   - Confirm Hermes is enabled. Enable R8/ProGuard minification and resource shrinking for release (`enableProguardInReleaseBuilds`, `shrinkResources`) and add the keep rules the libraries need (op-sqlite, MMKV, Reanimated, Notifee, gesture-handler, our DND module/receiver). Enable ABI splits so one APK per CPU architecture is produced (keep a universal APK for testing if cheap).
   - Remove unused dependencies (`npx depcheck`, then confirm each one is really unused before removing; do not remove libraries named in this document that are in use). Do not leave depcheck installed.
   - JS: check for work at startup (bootstrap should run migrations only when needed and not block the first frame longer than necessary; a splash is shown meanwhile). Lazy-load heavy screens if it helps. Check Zustand selectors and memoization so a timer tick re-renders ONLY the clock components (use the React DevTools profiler or a render counter in dev; report the numbers).
   - Lists: confirm FlatList settings (windowSize, initialNumToRender, removeClippedSubviews where safe) with a 2000-card library.
   - Images/assets: there should be no large assets; confirm.
3) VERIFY the release build works: install the release APK on the emulator and run the smoke checklist (onboarding, start/finish a short session, DND on/off, add/review cards, stats, backup export) — R8 often breaks libraries, so this is mandatory.

LIBRARIES: none new (depcheck only temporarily via npx).

DONE WHEN
- Before/after table exists; release build is smaller or equal, works, and starts no slower than before.

TEST
1. The release APK installs and passes the smoke checklist; `adb logcat -d | grep -E "FATAL|ClassNotFound|NoSuchMethod"` is empty.
2. Cold start median reported (before/after). If it got slower, find out why and fix or revert.
3. A running session shows the timer re-rendering only the clock subtree (report the evidence); idle CPU in a running session stays low (report `dumpsys cpuinfo` snippet).
4. 2000-card Library and Review start screens open without visible jank.
5. `npm run check` green; debug build still works (hot reload unaffected).
6. Not verified (needs me): performance on a real low-end phone.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-030 — Extensibility drill (prove nothing breaks)

| Size | Depends on | Libraries & tech |
|---|---|---|
| S | SD-029 | the feature registry, slots, `createSetting` — no new libraries |

**Goal:** Prove the architecture really lets you add a feature without touching existing ones. We add a tiny temporary feature, check that only one existing file changed, then remove it.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-030 — Extensibility drill
GOAL: Add a throwaway feature "quotes" that shows a motivational line on Home and has a toggle in Settings, using ONLY the extension points. Then verify that no existing feature was modified, and delete the drill feature.

1) Create src/features/quotes/ with: index.ts, feature.ts, data/quotes.ts (12 short offline quotes), logic/pickQuote.ts (pure: picks a quote by day number so it changes daily, unit-tested), components/QuoteCard.tsx, a createSetting 'quotes.enabled' (default true).
2) feature.ts registers: a slot item in 'home.dashboard' (id 'quotes.card', order 50) that renders QuoteCard when enabled; a slot item in 'settings.sections' (id 'quotes.section', order 60) with a Toggle "Show daily quote"; a backup provider is NOT needed.
3) Plug it in by adding ONE import line + ONE array entry in src/app/features.ts. Touch nothing else that already exists.
4) VERIFY the claim: list every pre-existing file you modified (if the project is a git repository, use `git status` / `git diff --stat`; otherwise compare file timestamps). Expected: only src/app/features.ts. If anything else had to change, that is an architecture problem: explain exactly what was missing, fix the extension point properly (additively), and report it.
5) Run the whole app: the quote appears on Home, the toggle appears in Settings, toggling hides/shows it live, and everything else works exactly as before (full regression of main flows, `npm run check`).
6) CLEAN UP: delete src/features/quotes and remove its lines from src/app/features.ts. Verify the app returns to the previous behavior and `npm run check` is green. (Do not keep the drill feature unless I ask.)
7) Update the README section "Adding a feature" with the real steps you just used (folder -> manifest -> one line in features.ts) and a table of the available slots and events (copy from Appendix A of the build document if it exists in the repo; otherwise generate it from the code).

LIBRARIES: none.

DONE WHEN
- The drill proves (or fixes) the extension points, then leaves no trace in the code except the improved README.

TEST
1. Unit test for pickQuote (same day -> same quote, next day -> next, wraps around, index never out of range, negative/large day numbers).
2. Emulator screenshots with the quote on Home and the toggle in Settings; after cleanup, screenshots without them.
3. The architecture lint rules pass with the drill present (no forbidden imports) and after removal.
4. Full regression of: onboarding path, timers, silence, cards, stats, settings, backup export/import, with the drill both present and removed (report which checks you ran in each state).

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

### SD-031 — Full regression & release build

| Size | Depends on | Libraries & tech |
|---|---|---|
| L | SD-030 | Gradle release signing, Android adaptive icon (vector XML), AAB/APK builds, `keytool` (JDK) |

**Goal:** The finish line: a complete end-to-end check of version 1, the real app name and icon, a signed release build, and a README that lets you (or an AI) continue development safely.

**Prompt**

````
Read AGENTS.md first and follow it for this whole ticket.

TICKET SD-031 — Full regression & release build
GOAL: Final verification of version 1 and a signed release build. Before you start, ASK ME two things and wait for the answers: (1) the final app name (display name) and (2) whether I already have a release keystore. Do not guess either.

1) FULL REGRESSION (run on the debug build, then again on the release build). Script these as a numbered checklist in docs/TEST_PLAN.md (a plain list I can re-run later) and execute it, with evidence for each line:
   A. Fresh install: onboarding (subjects, goal/exam, DND step, notification step) -> Home.
   B. Simple timer: countdown start/pause/resume/stop/finish; stopwatch; custom duration; keep-awake on/off; background and return; kill and restore.
   C. Pomodoro: 25/5 (dev tiny durations for speed) full cycle with awaitingNext, skip break, long break, finish; notifications at each phase end; ongoing notification.
   D. Silence: zen_mode 1 in focus, 0 in breaks/pause/stop/finish/kill (backup alarm), safety net on launch, user already in DND untouched, permission missing/revoked.
   E. Cards: add (Save & next), edit, delete, review all ratings, forgotten card requeue, daily new-card quota, library counts, break quick review during a pomodoro break.
   F. Stats/Home: seed + live updates, streak rule (10 minutes), goal ring, exam chip, subject chips, start/resume buttons.
   G. Settings: every control persists; theme switching; silence default; sound/vibration toggles.
   H. Backup: export, wipe, import, corrupt-file rejection, active-session refusal.
   I. Robustness: airplane mode on (nothing breaks), low storage message path if applicable, device rotate (locked), font scale 1.5, small screen, monkey test 500 events, 20 minutes of idle with a session running.
   J. Architecture: lint rules pass; `grep` checks: core imports no features; no feature imports another feature's inner files; migrations 0001..0005 unchanged since creation (compare to the migration list in Appendix A of docs/BUILD_PROMPTS.md if it exists, otherwise to the migrations folder history).
2) OFFLINE PROOF: the React Native template declares android.permission.INTERNET in the MAIN manifest. The debug build needs it (Metro), the release build must NOT have it. Move it to android/app/src/debug/AndroidManifest.xml (keep it there) and remove it from the main manifest; check no library adds it back to the release build by inspecting the merged manifest (`./gradlew :app:processReleaseMainManifest`, then read app/build/intermediates/merged_manifests/release/.../AndroidManifest.xml). Report the full list of permissions in the release build: expected are only POST_NOTIFICATIONS, FOREGROUND_SERVICE (+ its special-use type permission), ACCESS_NOTIFICATION_POLICY and VIBRATE (if the haptics library adds it). If a library adds anything else, tell me before removing it.
   APP IDENTITY: set the final display name; create an adaptive launcher icon as Android vector XML (a simple original design: a yellow rounded clock/book shape on the dark-blue #1B1E3A background; no copyrighted characters or logos) for mipmap-anydpi-v26 plus a legacy fallback; set versionName "1.0.0" and versionCode 1; keep the applicationId unchanged unless I say otherwise.
3) SIGNING: if I have no keystore, tell me the exact `keytool -genkeypair` command to run MYSELF (with alias, 10000-day validity, RSA 2048) and where to put the file; I will run it and keep the passwords private. Configure android/app/build.gradle to read the keystore path and passwords from a git-ignored file (android/keystore.properties) or from ~/.gradle/gradle.properties. NEVER write passwords, keystore files or keystore.properties into the repository, the README or your report. If the keystore is not ready yet, produce the debug-signed release APK and clearly mark the signed build as "waiting for me".
4) BUILDS: `./gradlew assembleRelease` (APK for testing) and `./gradlew bundleRelease` (AAB for the Play Store). Report file paths and sizes. Install the release APK on the emulator and re-run the whole checklist on it.
5) README.md final: what the app is, folder structure, the 5 architecture rules, how to add a feature (3 steps), slots/events/migrations tables (from Appendix A of docs/BUILD_PROMPTS.md, or generated from the code), backup format, known limits (inexact alarms in Doze, Android-only silence, OEM battery savers), build commands (debug, release APK, AAB), how to run tests, and a "Next ideas" list (iOS focus-mode guide, app blocking, card images, widgets — these are NOT built).

LIBRARIES: none new.

DONE WHEN
- docs/TEST_PLAN.md is fully executed with passes, release APK/AAB builds exist (signed if my keystore was ready), README is complete.

TEST
1. Every line of the checklist with evidence (screenshots / command output) in the report, grouped A-J; any failure is fixed and the full affected section is re-run.
2. `adb logcat -d | grep -E "FATAL|ANR|ClassNotFound|NoSuchMethod"` is empty after the whole run on the release build; the merged release manifest has no INTERNET permission and the app (including backup, notifications and silence) works fully with it removed.
3. Release build size and cold start are within 10% of the SD-029 numbers (explain otherwise).
4. Not verified (needs me): everything that needs a real phone — audible alert, vibration feel, OEM battery savers (Xiaomi/Oppo/Vivo/Samsung), Do Not Disturb system screens on those brands, backup to Google Drive. List the exact steps for me.

Run the Test & Fix loop from AGENTS.md, then give the Ticket Report and stop.
````

---

## Appendix A — Reference tables (keep these updated when you add features)

**Database migrations (forward-only)**

| ID | File | Creates | Ticket |
|---|---|---|---|
| 0001 | 0001_app_meta | app_meta | SD-004 |
| 0002 | 0002_subjects | subjects | SD-006 |
| 0003 | 0003_sessions | sessions | SD-009 |
| 0004 | 0004_cards | cards | SD-017 |
| 0005 | 0005_reviews | reviews | SD-017 |

**Event bus**

| Event | Emitted by | Used by |
|---|---|---|
| focus/phaseStarted, focus/resumed, focus/paused, focus/stopped, focus/finished, focus/awaitingNext | focus controller | silence, notifications, feedback |
| sessions/saved | sessions | sessions hooks, stats |
| cards/changed, cards/reviewed | cards | counts hooks, stats, home |
| subjects/changed, subjects/deleted | subjects | cards, stats, home |
| backup/restored | backup | all stores reload |

**Slots**

| Slot | Hosted by | Filled by |
|---|---|---|
| home.dashboard | Home | (future widgets) |
| focus.setupHints | Simple + Pomodoro forms | silence (permission hint) |
| focus.activeBadges | Active session view | silence (Silence ON badge) |
| focus.breakPanel | Break view | cards (quick review) |
| onboarding.steps | Onboarding | onboarding (10), subjects (20), settings (30), silence (40), focus notifications (50) |
| settings.sections | Settings page | settings goal (5), silence (10), subjects (20), feedback (30), appearance (40), backup (50), about (90) |

**Root screens** (registered by features): Onboarding, ManageSubjects, SubjectCards, CardEditor, QuickReview, and dev-only DevMenu.

**Main storage keys (MMKV)**: settings.dailyGoalMin, settings.examName, settings.examDate, onboarding.done, focus.lastConfig, focus.activeState, cards.lastSubjectId, backup.lastExportAt, prefs (themeMode, hapticsEnabled, soundEnabled, silenceDefault).

**Feature plug-in order in `src/app/features.ts`**: subjects, sessions, focus, silence, cards, stats, settings, backup, onboarding, home (focus before silence).

---

## Appendix B — Definition of Done for Version 1

- [ ] All 31 tickets reported "done", with an empty "Not verified" list or items checked by me on the emulator.
- [ ] Core loop works: start session -> phone goes quiet -> break shows due cards -> session saved -> streak updates.
- [ ] No network permission in AndroidManifest (the app has no INTERNET permission in release).
- [ ] No data leaves the phone; backup is a file I control.
- [ ] Adding the drill feature in SD-030 changed only `features.ts`.
- [ ] Release APK/AAB built and tested; README complete.