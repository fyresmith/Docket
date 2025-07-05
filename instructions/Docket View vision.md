DOCKET VIEW – ACTIVE RUNNER LAYOUT & BEHAVIOR
=============================================

Core Structure
--------------
- Static, vertically scrollable list of task cards (do not re-order)
- Tasks are displayed in chronological order
- User builds spatial memory of the day’s flow
- Each card shows:
  - Time Range (e.g. 09:00 – 10:00)
  - Task Title
  - Category Label
  - Duration
  - Status Badge (if applicable)
  - Optional: Notes icon / completion count / interaction buttons

Active Runner Behavior
----------------------
- When current time falls within a task’s start and end time:
  → That task becomes the "active runner"
  → Card visually transforms:

    - Subtle background highlight (soft tint)
    - Glow or left accent strip
    - Animated “Now” tag or icon
    - Live countdown timer: "⏳ 27:42 remaining"
    - Optional: brief pulse animation when entering active state

- Tap active card → opens Fullscreen Timer view:
    - Minimalist
    - Large countdown
    - Task name
    - Buttons: [ Complete ] [ End Early ] [ Pause ]

Auto-Scroll Behavior
--------------------
- If user is NOT interacting and active task changes:
    → Gently scroll active task to near top of screen
- If user IS interacting or has scrolled away:
    → Show a toast: “Now: Deep Work Session” [Jump to Now]
    → Tap = scrolls to active task card

Pending Tasks (Post-Runner)
---------------------------
- When task end time is passed and task is not marked complete:
    → Status becomes “Pending”
    → Card visually updates:

    - Yellow left stripe or warning icon
    - Status: ⚠️ Pending
    - Shows 3 inline buttons:
        [ ✅ Complete ]   [ ❌ Missed ]   [ 🔁 Do Now ]

    → User must take action to resolve
    → After resolution:
        ✅ = Marked complete, faded & checkmarked
        ❌ = Marked missed, grayed/red accent
        🔁 = Restarts timer from now, becomes new active runner

Upcoming Tasks
--------------
- Shown normally, lightly dimmed
- a single 'more' button
- Swipe and menu available
- just, no color-accent highlights.

Completed Tasks
---------------
- Gray or slightly faded
- ✅ badge or checkmark (NOT THE EMOJI)
- Swipe disabled

Optional Enhancements
---------------------
- Toast on first missed task: “You have a pending task to resolve.”
- Progress bar for day completion (under top app bar). Make it a second sub menu like the day picker.
- Swipe:
    → Left = Reschedule
    → Right = Mark Complete (only if current or upcoming), otherwise it will mark it 'incomplete'

Design Summary
--------------
Card States:

1. Active Runner
    - Highlighted
    - Countdown shown
    - Tap = Fullscreen Timer

2. Pending
    - Yellow border or accent
    - Buttons inline (Complete, Missed, Do Now)

3. Completed
    EXACTLY how they are now

4. Upcoming
    - Normal/dimmed

Principles:
-----------
- Static list: tasks don’t re-order unless they are rescheduled.
- Visual consistency throughout the day
- Runner = gentle, living presence
- Pending = intentional friction point
- Fullscreen timer = focused mode, optional entry
