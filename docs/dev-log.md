# Development Log

This file keeps the project handoff context inside the repository so another machine or a fresh Codex thread can resume quickly.

## How To Resume

1. Pull the latest code from GitHub.
2. Read `self-discipline-app-plan.md`, `README.md`, and this file.
3. Check recent commits with `git log --oneline -8`.
4. Run `corepack pnpm run build` before continuing feature work.

## Current Baseline

- Stack: Vue 3, Ionic Vue, Capacitor, Pinia, pnpm.
- Target: local-first Android MVP.
- Remote: `https://github.com/Clementine1995/self-discipline-app.git`.
- Latest known commit after the 2026-06-04 session: `c960c4f Add AI review planning repeat rules themes and points`.

## Implemented

- Project scaffold, Ionic routing, Android project, debug build path.
- Habit CRUD with repository/storage layer.
- Today check-in, undo check-in, and history make-up check-ins.
- Streak, longest streak, total check-ins, failures, seven-day trend.
- Reward and punishment prompts.
- Failure downgrade suggestions.
- Local notification permission status, test notification, and task reminder sync.
- Theme system with `fresh-schedule`, `game-achievement`, and `dark-discipline`.
- Tone system with structured profiles and a safe low-stimulation meme pack placeholder.
- Local data export and reset.
- AI daily review placeholder using local rules.
- AI habit plan placeholder using local rules.
- Repeat rules: daily, weekdays, weekends, and selected weekdays.
- Points system: check-in points, milestone bonus, level progress.

## Important Notes

- Android true-device regression is not done yet because there is no test condition right now.
- Avoid running `cap sync` casually before commit review. It may rewrite `android/capacitor.settings.gradle` with a machine-specific absolute path.
- If `cap sync` is needed, check `git diff -- android/capacitor.settings.gradle` before committing.
- Current AI features are local-rule placeholders only. No real AI API is connected.
- Theme and tone systems are intentionally extensible for later styles such as 腹黑掌控型, but MVP work should still follow `self-discipline-app-plan.md`.

## Suggested Next Steps

1. Push/pull with GitHub when switching computers.
2. When Android test conditions are available, do the plan's 第八步: install/debug APK, notification permission, reminder trigger, notification click, persistence, and date rollover.
3. If continuing without Android hardware, follow the plan's later expansion list in order and keep each step small.
4. Consider documenting test results in this file after each session.
