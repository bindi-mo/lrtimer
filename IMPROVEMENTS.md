# LB Timer Improvements

This document lists the improvements identified during code review, prioritized by urgency.

## High Priority (Bug Fixes)
- [x] Fix negative time display in `Timer.jsx`: When target time is in the past, show time until next cycle instead of negative values.
- [x] Fix notification timing logic in `useScheduledTimer.js`: Relax strict second-based comparisons to prevent missed notifications.
- [x] Fix memory leaks in `useScheduledTimer.js`: Add cleanup for setTimeout/setInterval on component unmount.

## Medium Priority (Stability Improvements)
- [x] Add error handling in `alarmSounds.js` and `useScheduledTimer.js`: Handle AudioContext creation failures and Notification permission denials.
- [x] Fix useMemo dependency array in `Timer.jsx`: Ensure `currentTimeInSeconds` updates in real-time.

## Low Priority (Quality Enhancements)
- [ ] Improve accessibility in `Timer.jsx`: Add aria-labels to buttons and support keyboard navigation.
- [ ] Refactor code: Consolidate constants, unify comments to English, remove unused variables.
- [ ] Add features: Persist settings with localStorage, add theme toggle.
- [ ] Add tests: Introduce Jest and React Testing Library for utility functions and components.
- [ ] Update documentation: Revise README.md with project description and usage instructions.

## Implementation Notes
- Use VS Code TODO comments (e.g., `// TODO: description`) in code for tracking.
- Test changes with `npm run dev` and `npm run lint`.
- Commit changes with descriptive messages.