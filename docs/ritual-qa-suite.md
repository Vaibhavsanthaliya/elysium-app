# Elysium — Master E2E Ritual Checklist

This document serves as the authoritative manual E2E test suite for Elysium. It covers the entire system architecture and every philosophical layer from EA-1 through EA-110.

---

## Phase I: Arrival & The Gate
*Testing first-paint, PWA shell, and identity.*

- [ ] **Offline Launch:** Disable network. The app loads successfully via Service Worker (`v24`).
- [ ] **Boot Shell:** Refresh. The Aperture mark and "Elys*ium*" wordmark appear before the app shell paints.
- [ ] **Auth Identity:** Sign out. Verify the "OBSIDIAN TEMPLE" eyebrow and champagne-gold "Continue" button.
- [ ] **Auth Persistence:** Sign in. App redirects to Temple tab without a full page reload.

## Phase II: The Temple (Atmosphere)
*Testing the central organ of the room and temporal awareness.*

- [ ] **Daily Line:** A quiet Spectral italic greeting appears above the Care card (e.g., "The night moves quietly.").
- [ ] **Temporal Breath:** Gradient alpha on the featured card shifts subtly if the system clock is moved (Night → Morning → Dusk).
- [ ] **Domain Cards:** 6 domain cards (Care, Chronicle, Light, Sleep, Mind, Body, Water) are present.
- [ ] **Archetype Labels:** Mono labels like `HYPNOS`, `APOLLO`, `ATLAS`, `HYDROS` are visible and quiet.
- [ ] **Warmth (Patina):** (Visual check) If the room has history, the background gradient has a sub-perceptual depth lift (+0.024 max).
- [ ] **Dormant Check:** Water and Body are active (Stilled/Stood); no "IN STUDY" badges remain.

## Phase III: Care (Practical Ritual)
*Testing the 3-night cycle and de-checklist protocol.*

- [ ] **Rhythm Bars:** Today/Care tab shows 21 thin bars. Tonight's bar has a bronze glow.
- [ ] **Night Protocol:** Tapping "Keep tonight" marks the protocol, updates state to "Kept", and triggers a Temple Trace bloom.
- [ ] **Steps Reveal:** Tapping "Steps" reveals individual tasks. Adding a step here works without a toast notification.
- [ ] **Morning Protocol:** Tapping "Open the day" marks morning steps. The action is less prominent than Night.
- [ ] **Supporting Rituals:** Tapping "Additional" reveals "Kept aside" tasks. Plus/minus buttons are bronze-dim.
- [ ] **Astrolabe Arming:** Tap a node on the Cycle tab. It breathes for 2.5s. Leaving the tab cancels the arm.
- [ ] **Astrolabe Commit:** Double-tap an armed node. Cycle switches; center disc updates; no toast fires.

## Phase IV: Light & Body (Witnessing)
*Testing spatial memory and horizons.*

- [ ] **Light Sky:** Current time cursor is correctly positioned on the sky gradient.
- [ ] **Witness Action:** Tapping "I'm here" triggers 3s stillness. Close button is hidden during stillness.
- [ ] **Horizon Marks:** A 4px bronze circle appears on the horizon.
- [ ] **Light Linger:** (Requires setup) Yesterday's witness mark is visible as a faint 3px ghost.
- [ ] **Body Modal:** Tapping "Returned" in Body modal pauses, then places a square mark on the earth horizon.
- [ ] **Body Trace:** Temple card for Body shows a bronze shadow bloom after returning from the modal.

## Phase V: Mind & Water (Holding)
*Testing duration and stilled sessions.*

- [ ] **Mind Hold:** Begin session. The backdrop is locked. "End session" is hidden for the first 60 seconds.
- [ ] **Mind Reflection:** Writing a reflection in State C and tapping "Save line" updates the Temple Mind card.
- [ ] **Mind Resonance:** The Temple Mind card displays the reflection text as a single-line italic inscription.
- [ ] **Water Modal:** Tapping "Held" places a mark below the soft surface line. Temple status updates to "Stilled".

## Phase VI: Chronicle & Drift (Memory)
*Testing writing and resurfacing.*

- [ ] **Chronicle Autosave:** Type a line. Wait 800ms. Tab switch. Return. The text is preserved.
- [ ] **Drift Aging:** Scroll past entries. Entries >60 days old are visibly fainter than recent ones.
- [ ] **The Well:** (Requires setup) A single memory surfaces above the Drift with the label "From the beginning" or "A year ago today".
- [ ] **Source Ambiguity:** A resurfaced Mind reflection in the Well looks identical to a Chronicle note (source is hidden).
- [ ] **Well Stability:** The Well entry does not change when typing or re-entering the tab (cached per session).

## Phase VII: Stars & Progress (Records)
*Testing the constellation and day records.*

- [ ] **Constellation:** Kept days render as glowing dots. No numbers or weekday letters are visible on the grid.
- [ ] **Season Line:** The Progress tab shows one italic line (e.g., *"Season — foundation"*). No "Stage 1 of 4" math.
- [ ] **Day Record:** Tapping a dot opens "Day record". It is read-only.
- [ ] **Correction Link:** Tapping "correct record" reveals the Mark/Clear buttons behind a qualifier note.
- [ ] **Skin Memory:** The photo grid is labeled "Skin memory". Adding a photo triggers no success toast.

## Phase VIII: Sleep & Closure (Ending)
*Testing the day's end.*

- [ ] **Sleep Whisper:** State A surfaces yesterday's sleep note faintly above today's textarea.
- [ ] **Closure Lock:** Complete State B ("The room is quiet"). Tab navigation is now locked to the Sleep modal.
- [ ] **Temple Reciprocity:** After closing, Temple greeting says "The day has been closed."
- [ ] **First Light:** (Set clock to morning) Temple greeting says "The night has passed." if yesterday was closed.
- [ ] **Reopen:** Tapping "Reopen the day" clears closure, restores tabs, and removes the Temple closure line.

## Phase IX: The Workshop (Machinery)
*Testing system settings and data portability.*

- [ ] **Workshop Layout:** Three surfaces: Threshold, Cues, Archive. No iOS-style grouped lists.
- [ ] **Practice Cues:** Changing time inputs and toggling "Practice cues" fires a confirmation toast.
- [ ] **Archive Disclosure:** Tapping "Archive" reveals install text, export/import, and reset.
- [ ] **Export:** Tapping "Export" triggers a browser download of the JSON state blob.
- [ ] **Reset Everything:** Tapping "Reset everything" requires confirmation, then clears all local/cloud data and reloads.

## Phase X: Continuity (Environmental)
*Testing invisible persistence.*

- [ ] **Coordinate Imprinting:** (Technical verify) Inspect state. Chronicle/Sleep/Mind entries have a hidden `period` field.
- [ ] **Temple Trace TTL:** If you keep a ritual but stay away from Temple for 2 minutes, no trace bloom appears (TTL expired).
- [ ] **Reduced Motion:** If OS reduced-motion is on, all tab transitions are instant and Astrolabe breath is static.
- [ ] **Silence:** If no ritual is performed, the Temple greeting is completely hidden (no empty paragraph).
