# Specification

## Summary
**Goal:** Implement auto-transition logic between test sections with timing controls and score calculation.

**Planned changes:**
- Add backend endpoints for getTestAttempt, startSection, and submitSection with timing validation
- Update test attempt data model to store section answers, scores, and timestamps
- Implement 90-minute countdown timer for each section with auto-submission at zero
- Add automatic section transition from Section 1 to Section 2 after submission
- Display transition screen between sections showing summary and start button
- Implement score calculation (1 mark per correct answer in Section 1, 2 marks in Section 2)
- Create React Query hooks for fetching attempt state and mutating section data

**User-visible outcome:** Users can take timed tests with automatic transitions between sections, see countdown timers for each 90-minute section, submit sections manually or have them auto-submit when time expires, and view a transition screen between sections showing their progress.
