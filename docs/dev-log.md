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
- Latest confirmed commit on 2026-06-12: `8b9989a 提交`.

## Implemented

- Project scaffold, Ionic routing, Android project, debug build path.
- Habit CRUD with repository/storage layer.
- Today check-in, undo check-in, and history make-up check-ins.
- Streak, longest streak, total check-ins, failures, seven-day trend.
- Reward and punishment prompts.
- Failure downgrade suggestions.
- Local notification permission status, test notification, and task reminder sync.
- Theme system with `fresh-schedule`, `game-achievement`, `dark-discipline`, `schemer-control`, `tsundere-challenge`, `adult-command` (成人调教型), and `minimal-data`.
- Tone system with structured profiles and a safe low-stimulation meme pack placeholder.
- Local data export and reset.
- AI daily review placeholder using local rules.
- AI habit plan placeholder using local rules.
- AI weekly report placeholder using local rules.
- Repeat rules: daily, weekdays, weekends, selected weekdays, and weekly target counts.
- Points system: check-in points, milestone bonus, level progress.
- Reward shop v1: local reward items, point redemption, and redemption history.
- First-run habit list now starts empty; Today and Tasks show onboarding prompts so users create their own check-in tasks.
- Theme choices now recommend and sync matching tone profiles; tone profiles are more granular than visual themes.
- Tone, reward, punishment, recovery, review, weekly report, and reward shop copy has been sharpened for a bolder personal-use discipline style.
- Today page prioritizes started, due, snoozed, untimed/waiting, abandoned, and completed tasks, and completed tasks cannot be undone from Today.
- Completing a task now shows immediate reward, points, streak, and milestone feedback.
- Reminder handling has a dedicated decision page with start, complete, snooze, and abandon-reason actions.
- Android notification taps route into the reminder decision page, and Android home-page back exits the app.
- Task editing uses Vant form controls, including a time picker and repeat-rule controls.
- Strong reminder channels, follow-up reminders, Java `int` notification IDs, and the `reminderActions` local data loop are implemented.
- Stats page now has a monthly calendar view with per-day completion status and selected-day task details.
- Today task cards were redesigned into a clearer execution layout, and the Stats page now puts the calendar first with a simplified summary below it.
- Review tab visibility is now controlled from Settings and defaults to hidden while the review flow is not needed.
- Task create/edit now uses a mission-style setup screen with live preview, execution rhythm cards, and a separated reward/punishment section.
- Today page now uses small state icons in the command panel, task cards, and prompt lines to better match theme/tone feedback.
- Weekly target tasks now run as flexible weekly goals: each day can record one completion, and Today shows current weekly progress such as `1/3`.

## Important Notes

- Android true-device regression is not done yet because there is no test condition right now.
- Avoid running `cap sync` casually before commit review. It may rewrite `android/capacitor.settings.gradle` with a machine-specific absolute path.
- If `cap sync` is needed, check `git diff -- android/capacitor.settings.gradle` before committing.
- Current AI features are local-rule placeholders only. No real AI API is connected.
- Some Chinese text in terminal output may appear garbled depending on the PowerShell encoding, but source files should stay UTF-8.
- On this Windows machine, use Node from `D:\Program Files\nvm\v24.16.0` for project commands; the older shell Node 16 is too old for Vite 7.
- Theme and tone systems are intentionally extensible for later styles such as 腹黑掌控型, but MVP work should still follow `self-discipline-app-plan.md`.

## Suggested Next Steps

1. Push/pull with GitHub when switching computers.
2. When Android test conditions are available, do the plan's 第八步: install/debug APK, notification permission, reminder trigger, notification click, persistence, and date rollover.
3. If continuing without Android hardware, follow the plan's later expansion list in order and keep each step small.
4. Feed `reminderActions` data into stats/review/weekly report so snooze and abandon reasons become useful feedback.
5. Consider documenting test results in this file after each session.
