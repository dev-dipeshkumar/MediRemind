# Smart Medicine Reminder

## Current State
Empty project scaffold. No frontend or backend implemented yet.

## Requested Changes (Diff)

### Add
- Internet Identity authentication (login/logout)
- Medicine reminder CRUD: add, edit, delete reminders with name, dosage, schedule (time + frequency), notes
- Reminder status tracking: taken, snoozed, missed per dose
- Medicine lookup using OpenFDA API (free, no key needed) for drug info: indications, warnings, side effects
- AI-enhanced medicine info via Hugging Face free Inference API (zero-shot or text-generation) for plain-language summaries
- Dose history log per medicine
- Dashboard: today's reminders sorted by time, overdue highlighting, taken/missed counts
- Notification badge / in-app alerts for upcoming doses
- Snooze functionality (15/30/60 min)
- Enhancements: streak tracker, weekly adherence chart, export history, dark mode toggle

### Modify
- Empty Motoko actor → full backend with stable storage

### Remove
- Nothing

## Implementation Plan
1. Select `authorization` and `http-outcalls` components
2. Generate Motoko backend with:
   - Medicine reminders (CRUD) per user principal
   - Dose log entries (taken/snoozed/missed with timestamp)
   - HTTP outcall to OpenFDA API for medicine lookup
3. Build React frontend:
   - Auth gate with Internet Identity
   - Dashboard page: today's schedule, overdue alerts, streak
   - Reminders page: list, add/edit/delete
   - Medicine search page: OpenFDA + AI summary
   - History page: dose log with adherence chart
   - Dark mode, responsive layout
