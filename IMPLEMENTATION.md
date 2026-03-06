# Heatmap Location Tracking App - Implementation Guide

## Overview

A React Native app built with Expo SDK 52 that tracks user location in the background and displays movement history as a heatmap overlay on Google Maps.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Expo SDK 52 | React Native framework |
| expo-router | File-based navigation |
| react-native-maps | Google Maps + Heatmap |
| expo-location | Foreground/background location |
| expo-task-manager | Background task execution |
| expo-sqlite | Local SQLite database |

## Project Structure

```
heatmap-new/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout + providers
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Map screen (main)
│   │   └── history.tsx           # Series list screen
│   └── series/[id].tsx           # Series detail screen
│
├── src/
│   ├── components/
│   │   ├── map/
│   │   │   └── HeatmapOverlay.tsx
│   │   └── tracking/
│   │       ├── TrackingButton.tsx
│   │       └── SeriesPrompt.tsx
│   │
│   ├── contexts/
│   │   ├── DatabaseContext.tsx   # SQLite provider
│   │   └── TrackingContext.tsx   # Tracking state management
│   │
│   ├── db/
│   │   ├── schema.ts             # Table definitions + types
│   │   ├── client.ts             # DB initialization
│   │   └── queries/
│   │       ├── series.ts         # Series CRUD
│   │       └── locations.ts      # Location points CRUD
│   │
│   ├── hooks/
│   │   ├── useSeries.ts          # Series data hook
│   │   └── useHeatmapPoints.ts   # Heatmap data hook
│   │
│   └── services/
│       ├── backgroundTask.ts     # CRITICAL: Global task definition
│       └── location/
│           ├── tracking.ts       # Start/stop tracking
│           └── geocoding.ts      # Reverse geocoding
│
├── app.json                      # Expo config + permissions
├── package.json
└── tsconfig.json
```

## Database Schema

### Tables

**series** - Tracking sessions
```sql
CREATE TABLE series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_active INTEGER DEFAULT 0,
  point_count INTEGER DEFAULT 0
);
```

**location_points** - GPS coordinates
```sql
CREATE TABLE location_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  altitude REAL,
  accuracy REAL,
  timestamp TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);
```

## Key Implementation Details

### 1. Background Task (Critical)

The background task **must** be defined at the module level and imported at the app root. This is required by expo-task-manager.

**File**: `src/services/backgroundTask.ts`
```typescript
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data }) => {
  const { locations } = data;
  const db = getDatabaseSync();
  const activeSeries = db.getFirstSync('SELECT id FROM series WHERE is_active = 1');
  // Insert locations...
});
```

**Import in root layout**: `app/_layout.tsx`
```typescript
import '../src/services/backgroundTask';
```

### 2. Location Tracking Flow

1. User taps FAB on Map screen
2. `SeriesPrompt` modal appears with options:
   - "Start New Series" → creates series with auto-generated name
   - "Continue [existing series]" → resumes tracking to that series
3. Background location updates start (60s interval, 50m distance)
4. Locations are saved to SQLite in the background task
5. User taps FAB again → tracking stops, series marked inactive

### 3. Auto-Naming Series

When starting a new series, the app:
1. Gets current location
2. Reverse geocodes to get city/country
3. Names series: `"{City}, {Country} - {Date}"`
4. Fallback: `"Tracking - {Date}"`

**File**: `src/services/location/geocoding.ts`

### 4. Heatmap Rendering

The heatmap uses `react-native-maps` Heatmap component with Google Maps provider.

**File**: `src/components/map/HeatmapOverlay.tsx`
```typescript
<Heatmap
  points={points}
  opacity={0.7}
  radius={40}
  gradient={{
    colors: ['#79BC6A', '#BBCF4C', '#EEC20B', '#F29305', '#E50000'],
    startPoints: [0.01, 0.25, 0.5, 0.75, 1],
    colorMapSize: 256,
  }}
/>
```

### 5. Context Providers

**DatabaseContext** (`src/contexts/DatabaseContext.tsx`)
- Initializes SQLite database
- Runs migrations on startup
- Provides `useDatabase()` hook

**TrackingContext** (`src/contexts/TrackingContext.tsx`)
- Manages tracking state
- Provides: `isTracking`, `activeSeries`, `allSeries`
- Actions: `startNewSeries()`, `continueSeries()`, `stopCurrentTracking()`

## App Configuration

### Permissions (app.json)

```json
{
  "plugins": [
    ["expo-location", {
      "locationAlwaysAndWhenInUsePermission": "...",
      "isIosBackgroundLocationEnabled": true,
      "isAndroidBackgroundLocationEnabled": true,
      "isAndroidForegroundServiceEnabled": true
    }]
  ],
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["location"]
    },
    "config": {
      "googleMapsApiKey": "YOUR_API_KEY"
    }
  },
  "android": {
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION"
    ],
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

## Running the App

### Development Build (Required)

This app requires a development build - it won't work in Expo Go due to native modules.

```bash
# iOS
pnpm ios
# or
npx expo run:ios

# Android
pnpm android
# or
npx expo run:android
```

### First Build

The first build generates native projects in `/ios` and `/android` directories and compiles them. This takes several minutes.

## Screens

### Map Screen (`app/(tabs)/index.tsx`)
- Full-screen Google Maps
- Heatmap overlay showing location points
- Filter chip to select which series to display
- Recording status indicator when tracking
- FAB button to start/stop tracking

### History Screen (`app/(tabs)/history.tsx`)
- List of all series (cards)
- Shows: name, location, date, point count
- Actions: Continue tracking, Rename, Delete
- Long-press for action menu

### Series Detail (`app/series/[id].tsx`)
- Mini-map preview with heatmap
- Editable series name
- Stats: point count, date range
- Delete button

## Limitations

1. **Background interval**: iOS/Android throttle background location to ~5-20 min intervals (not the configured 60s)
2. **Simulator**: Background tracking doesn't work properly in simulators
3. **Battery**: Continuous tracking impacts battery life
4. **Maps**: Only Google Maps supports heatmaps (not Apple Maps)

## Testing Checklist

1. [ ] Build and run on device/simulator
2. [ ] Grant location permissions (foreground + background)
3. [ ] Start new tracking series
4. [ ] Verify heatmap appears on map
5. [ ] Background the app, move around, return
6. [ ] Check that new points were recorded
7. [ ] Stop tracking
8. [ ] View series in History
9. [ ] Edit series name
10. [ ] Delete a series

## Future Enhancements

- [ ] Export data (GPX, KML)
- [ ] Merge multiple series
- [ ] Custom heatmap colors/settings
- [ ] Statistics dashboard
- [ ] Cloud sync
