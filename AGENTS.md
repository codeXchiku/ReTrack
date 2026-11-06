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