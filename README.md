# LR Timer

A React-based scheduled timer application designed for **Lineage Remastered**, an MMORPG with time-based boss spawn mechanics. This timer helps players track and get notified when bosses appear at scheduled intervals (12-hour cycles).

## Purpose

Lineage Remastered features bosses that spawn at specific, recurring times. LR Timer provides reliable notifications to ensure players never miss important raid opportunities. The application is designed to be extensible for tracking other time-based game events in the future.

## Features

- ⏰ **Scheduled Timer**: Set target times and get notified at specific times of day
- 🎨 **Circular Progress Visualization**: Real-time visual feedback with SVG-based progress bar
- 🔔 **Multi-Stage Notifications**: 15-minute, 5-minute, and target time alerts
- 🔊 **Multiple Alarm Sounds**: Choose from 5 different programmatically generated sounds (beep, low, phone, pulse, ascending)
- 📢 **Browser Notifications**: Native browser notifications with audio alerts
- � **Web Push (PWA)**: Server-side Web Push を使ってアプリが閉じている時でも 15/5 分通知が送れる（実装手順は `docs/PUSH.md` を参照）
- �🌓 **Dark/Light Theme**: Toggle between dark and light themes with persistent storage
- 💾 **Settings Persistence**: User preferences saved to localStorage automatically
- ♿ **Accessibility**: Full ARIA labels and keyboard navigation support
- ⚡ **Modern Stack**: React 19 with Vite for fast development and hot module replacement

## Project Structure

```
src/
├── App.jsx                    # Main app component with theme toggle
├── App.css                    # Global app styles and theme variables
├── components/
│   ├── Timer.jsx              # Main UI component
│   └── CircularProgress.jsx   # SVG-based progress visualization
├── contexts/
│   └── TimerContext.jsx       # Global settings context with localStorage
├── hooks/
│   └── useScheduledTimer.js   # Timer logic and notification management
├── styles/
│   └── Timer.css              # Component styling
└── utils/
    ├── alarmSounds.js         # Web Audio API sound generation
    └── timeUtils.js           # Time formatting and calculations
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create an optimized production build:

```bash
npm run build
```

## Usage Guide

### Basic Usage

1. **Start the application**: Open the app in your browser
2. **Set the target time**: Use the +/- buttons to adjust hours, minutes, and seconds
3. **Choose alarm sound**: Select from the dropdown and preview if desired
4. **Click "開始" (Start)**: The timer will begin monitoring for the target time
5. **Notifications**: You'll receive notifications at 15 min, 5 min, and at the target time

### Settings & Customization

- **Theme Toggle**: Click the sun/moon icon in the header to switch between dark and light themes
- **Alarm Sound**: Select your preferred sound from the dropdown (changes are saved automatically)
- **Notifications**: All settings persist automatically using browser localStorage

### Keyboard Navigation

- Use arrow keys to increment/decrement time values (when focused on time adjustment buttons)
- Tab to navigate between buttons
- Space/Enter to activate buttons

### Preview

Preview the production build locally:

```bash
npm run preview
```

### Lint

Check code quality with ESLint:

```bash
npm run lint
```

## How It Works

### Timer Logic

1. **Set Target Time**: Enter the desired time (HH:MM:SS)
2. **Scheduled Mode**: Timer targets that specific time of day and repeats every 12 hours
3. **Notification Sequence**:
   - 15 minutes before: Modal + browser notification
   - 5 minutes before: Modal + browser notification
   - At target time: Modal + browser notification + audio alarm

### Audio System

- Sounds are generated using the Web Audio API
- No external audio files required
- Choose from 5 different alarm sounds
- Preview feature allows 5-second looped playback before selection

### Progress Display

- Full circular progress indicator
- Orange warning state during the last 15 minutes
- Countdown display (seconds only) during the final 10 seconds

## Settings

The application automatically saves all settings to browser localStorage:

- **Theme**: Dark or light theme preference (persisted)
- **Default Alarm Type**: Select your preferred alarm sound (persisted)
- **Enable Notifications**: Toggle browser notifications on/off (persisted)

All settings changes are saved automatically and restored when you return to the app.

## Browser Support

Requires support for:
- Web Audio API (for sound generation)
- Notification API (for browser notifications)
- Modern JavaScript (ES6+)

## Extensibility

The project is designed to be extensible for adding other time-based timers:
- Add new timer presets for different boss spawn times
- Create timer templates for various game events
- Support for multiple timers running simultaneously
- Customizable notification schedules per timer

## Future Enhancements

Potential additions for other game timers:
- World bosses with varying spawn windows
- Raid time coordination
- Event-based timers
- Guild-specific timer configurations
- Timer management dashboard for multiple events

## Development Notes

- Changes are automatically reflected via Vite Hot Module Replacement during development
- Time calculations always use `calculateTargetTimeInSeconds()` and `calculateTimeLeft()` from utilities
- State management uses React Context for global settings and refs in custom hooks for notification tracking
- All sounds are generated programmatically for consistency and to reduce bundle size

## License

This project is open source and available under the MIT License.
