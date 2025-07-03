DOCKET APP STRUCTURE
=====================

Main Views (Bottom Tab Navigation)
----------------------------------

1. Docket (Do)
---------------
- Primary default view
- Shows today's tasks in chronological order
- Live runner at top (current task with countdown)
- Supports status tags: Upcoming, Current, Pending, Missed, Completed
- Quick Task button only appears here
  - Name
  - Optional category
  - Duration
  - Start immediately
- Each task includes:
  - Complete
  - Mark as missed
  - Do Now
  - Reschedule
- Clicking current task opens Fullscreen Timer

2. Calendar (Plan)
------------------
- Daily timeline view (hour-by-hour layout)
- Swipe or navigate between days
- Tasks shown as blocks based on time
- "Current time" marker
- Tap a time to create a new task
  - Task name
  - Start + end time
  - Category
  - Repeat (e.g., M/W/F)
  - Optional notes
- Tap existing task to edit
- (Future) "Plan My Week" expanded view

3. Library (Organize)
---------------------
- Full list of all unique tasks (recurring + one-time)
- Non-chronological list grouped by category or name
- Tap to edit, duplicate, delete any task
- Track completion stats:
  - e.g. “Brush Teeth – 4x this week”
- Sort/filter by name, category, completion frequency, etc.
- No quick task allowed in this view
- Optional new recurring task creation allowed here
- (Optional section) Simple summary stats panel:
  - Tasks completed this week
  - Total hours scheduled
  - Current streaks

Special Views (Full-Screen Overlays)
------------------------------------

⏱ Fullscreen Timer
-------------------
- Triggered from Docket when tapping current task
- Large countdown timer
- Task name displayed prominently
- Minimalist design, ambient background
- Controls:
  - Complete
  - End early
  - Pause (optional)
- Future: lockscreen Live Activity display (Docket Cloud only)

⚙ Settings / Profile
---------------------
- Accessed via top-right or slide-in panel
- Includes:
  - Theme toggle (light/dark/system)
  - Break timer toggle + duration setting
  - Weekly planning prompt toggle
  - Export/import task data (JSON)
  - About / version info / credits
  - (Future) Sign in for sync with Docket Cloud

Navigation Layout
------------------
- Bottom tab bar with three core views:
  [ Docket ]   [ Calendar ]   [ Library ]

- Each view owns its own task creation flow:
  - Docket: floating Quick Task button
  - Calendar: tap-to-create on time grid
  - Library: new recurring task (optional)

Do NOT include a global “+” create button.
Let context guide behavior.

User Workflows
==============

📆 Planning Workflow (Weekend or Evening)
-----------------------------------------
1. Open Calendar View
2. Schedule timeboxed tasks for the upcoming days
3. Add/edit recurring tasks as needed
4. Check Library to manage tasks and stats
5. Done

⏱ Daily Execution Workflow
---------------------------
1. Open Docket View
2. Begin with first task or start a Quick Task
3. Use live runner for current task
4. Finish task → Complete
5. Missed task → resolve via:
   - Do Now
   - Reschedule
   - Skip
6. End of day: clear all pending/missed

🧹 Maintenance Workflow (Weekly)
--------------------------------
1. Visit Library
2. Review task completion stats
3. Prune unused tasks
4. Refine categories or repeat rules
5. Reflect → return to Calendar for planning

View Roles Summary
-------------------
- Docket = DO
  → Where the day happens
- Calendar = PLAN
  → Where time is allocated
- Library = ORGANIZE
  → Where your system lives

Tagline
-------
“Plan simply. Run your day clearly. Own your time.”

