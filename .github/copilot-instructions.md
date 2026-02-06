# AI Coding Assistant Instructions for LR Timer

## Project Overview
LR Timer is a React-based scheduled timer application designed for **Lineage Remastered**, an MMORPG with time-based boss spawn mechanics. It helps players track and get notified when bosses appear at scheduled intervals (typically 12-hour cycles). The application is designed to be extensible for tracking other time-based game events.

## Architecture
- **Framework**: React 19 with Vite build system
- **State Management**: React Context (`TimerProvider`) for global settings
- **Component Structure**:
  - `Timer`: Main UI component handling time input and controls
  - `CircularProgress`: SVG-based circular progress bar for time visualization
- **Custom Hook**: `useScheduledTimer` manages all timer logic and notifications
- **Utilities**:
  - `timeUtils.js`: Time formatting and calculations (12-hour cycle)
  - `alarmSounds.js`: Web Audio API sound generation

## Key Patterns & Conventions

### Timer Logic
- **Scheduled Mode**: Targets specific time of day (HH:MM:SS), repeats every 12 hours
- **Time Calculations**: Always use `calculateTargetTimeInSeconds()` and `calculateTimeLeft()` from `timeUtils.js`
- **Notification Sequence**: 15min → 5min → target time, with modal + browser notification + audio
- **State Tracking**: Use refs in `useScheduledTimer` to prevent duplicate notifications

### Audio System
- **Web Audio API**: All sounds generated programmatically, no audio files
- **Sound Types**: beep, low, phone, pulse, ascending
- **Preview**: 5-second looped playback for sound selection
- **Context Reuse**: Single `AudioContext` instance shared across all sounds

### UI Components
- **Time Input**: Custom increment/decrement buttons, validates 00-23 hours, 00-59 min/sec
- **Progress Display**:
  - Shows full circle until 15min remaining
  - Warning state (orange) in last 15min
  - Countdown display (seconds only) in last 10sec
- **Modal System**: Overlay for notifications, dismisses with OK button

### Context Usage
```jsx
const { globalSettings, updateSettings } = useTimerContext();
// Settings: defaultAlarmType, enableNotifications, theme
```

## Development Workflow
- **Start Dev Server**: `npm run dev` (Vite HMR enabled)
- **Build**: `npm run build` (outputs to `dist/`)
- **Lint**: `npm run lint` (ESLint with React rules)
- **Preview**: `npm run preview` (serve built files)

## Code Changes
- Code modifications are automatically reflected via Vite HMR (Hot Module Replacement)
- No manual build or test execution required after changes
- Changes are immediately visible in the browser during development
- **When user runs `npm run dev`: do NOT suggest browser reloads** - Changes are automatically updated via Vite HMR

## Common Tasks
- **Add New Alarm Sound**: Extend `playAlarmSound()` switch in `alarmSounds.js`
- **Modify Timer Logic**: Update `useScheduledTimer` hook, maintain notification refs
- **Add Settings**: Update `TimerContext` state and `useTimerContext` hook
- **Time Formatting**: Use `formatTime()` for consistent HH:MM or MM:SS display

## File Organization
- `src/components/`: UI components
- `src/hooks/`: Custom React hooks
- `src/utils/`: Pure utility functions
- `src/styles/`: CSS files (Timer.css)
- `public/`: Static assets

## Browser APIs Used
- `Notification`: Browser notification permission and display
- `AudioContext`: Web Audio API for sound generation
- No external APIs or server communication required