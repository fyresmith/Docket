📘 Notch – PWA Timeboxing Calendar
Tagline: Notch your time. Mark your hours with intention.

1. 🔧 Core Goals
Allow users to notch their day via a simple calendar interface.

Enable both recurring and one-time Notches with editable details.

Let users start a timer when they begin working on a task.

Store everything offline using IndexedDB.

Run smoothly on mobile via PWA principles.

2. 🧱 Technical Architecture
Frontend: React and Vite

Storage: IndexedDB (wrapped via a utility like idb or Dexie.js for ease)

PWA Essentials:

Service Worker for offline access

Web App Manifest

Add to Home Screen prompts

UI: Simple, mobile-first with:

Scrollable daily view

Minimal modal overlays for Notch editing

Large tap targets for mobile ergonomics

Backend
None. Fully offline-first architecture.

3. 📱 Features & UX
A. 🗓 Daily Calendar View
Notchline-style display: 24-hour vertical scroll

Notches are colored blocks representing timeboxes

Current time indicator line

Simple "+" FAB to add a Notch

B. ➕ Add / Edit Notch
Modal or full-screen sheet with:

Title

Start time / End time (or duration picker)

Repeat (none, daily, weekly, etc.)

Notes (optional)

Color label (optional)

C. 🔁 Recurring Notches Engine
Stored as recurrence rules (e.g., iCal RRULE or simplified object)

On app load, next 7–14 days are "hydrated" with generated instances

D. ⏱ Timer Mode
Tap Notch → opens detail view with:

Notch name, time, notes

Large "Start" button → begins countdown

Progress bar or circle + elapsed/remaining time

Visual emphasis on staying focused while task runs

Background service worker keeps timer running if app is backgrounded

E. ✅ Notch Completion
Auto-marked complete after timer ends

Manual "complete" button as well

Visual feedback (e.g., check mark, dim color)

F. 🔄 Syncing (Optional/Future)
Export/import database (JSON blob)

Optional account-free sync via shareable links or Dropbox/GDrive (v2 idea)

4. 🧪 UX Flow: Example Day
Morning: User opens Notch → sees today's Notchline

Taps "+" → adds "Write report" from 9:00 to 10:30

9:00 hits → taps "Write report" → opens details → hits "Start"

Timer begins; user focuses

Timer ends → Notch marked complete

User scrolls to see rest of day; adds or adjusts other Notches

5. 🗃 IndexedDB Data Model
Tables
notches: Each scheduled instance (whether recurring or not)

id

title

start / end

notes

color

recurrence_id (null if not repeating)

completed_at (null if incomplete)

recurrences: Master pattern

id

title

rule: e.g., { freq: 'weekly', interval: 1, days: ['Mon', 'Wed'] }

start_time, duration, notes, color

settings: Basic app settings like theme, default durations

6. 🧩 MVP Feature Set
Feature	Status
Daily timebox calendar	✅ Must-Have
Add/edit one-time Notch	✅ Must-Have
Recurring Notches	✅ Must-Have
Notch detail view	✅ Must-Have
Start/stop Notch timer	✅ Must-Have
Timer runs in background	✅ Must-Have
Notch completion tracking	✅ Must-Have
IndexedDB persistence	✅ Must-Have
PWA installable offline app	✅ Must-Have

7. 🧱 Future Roadmap (Optional V2 Ideas)
Daily, weekly, and monthly summaries

Stats dashboard (time spent by Notch type, completion rates)

Deep Notch mode with ambient sound and distraction blockers

AI-based suggestion: e.g., "You often do X at 10 AM"

Sync/export/import features

Tags and filters

Integrations with calendar APIs

8. 🎨 UI Style Guide (Minimalist)
Font: System default (for speed & compatibility)

Color Palette:

Background: Light/dark toggle

Notch blocks: Muted pastel color tags

Icons: SVG (timer, add, check, play/pause)

Animations: Snappy, quick fades and slide-ins only

9. 🧠 Naming/Brand
Name: Notch

Metaphor: Time is marked with notches; each notch represents a defined moment

Tagline ideas:

"Notch your time"

"Mark your hours with intention"

"One notch at a time"

10. 🧪 Testing & QA
Manual QA on:

Chrome Android

Safari iOS

PWA install flow

IndexedDB persistence under various storage quota conditions

Offline-first testing

Timer accuracy, resume after refresh/background

11. 📦 Deployment
Static build via vite or similar

Deploy on:

GitHub Pages

Netlify

Vercel

Configure manifest + service worker

Custom install prompt with instructions


NEVER EVER USE EMOJIS IN THE APP, ONLY USE REACT-ICON