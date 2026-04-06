# Phase 2 App Flow & Architecture

## Screen Navigation Map

```
┌─────────────────────────────────────────────────────────────┐
│                     TAB NAVIGATOR                           │
│  [Home] [Squads] [Log] [Notifications] [Profile]            │
└─────────────────────────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────┐
    │       HomeScreen                   │
    │  ─────────────────────────────────  │
    │  • Hero card (squad goal + %bar)   │
    │  • Quick actions (Start Run, Log)  │
    │  • Activity Feed (5 latest items)  │
    │  • Filter button (funnel icon)     │
    ├────────────────────────────────────┤
    │  ACTIONS:                          │
    │  1. [Start Run] → ActiveWorkout    │
    │  2. [Activity Card] → WorkoutDetail│
    │  3. [Filter Icon] → FilterModal    │
    └────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────────┐
    │        ActiveWorkoutScreen (FULLSCREEN)             │
    │  ─────────────────────────────────────────────────  │
    │  • MapView (react-native-maps)                      │
    │  • Blue polyline (route recording)                  │
    │  • Start/Stop buttons                               │
    │  • Distance (live), Duration (live)                 │
    ├─────────────────────────────────────────────────────┤
    │  DATA FLOW:                                         │
    │  Location.watchPositionAsync()                      │
    │    (5m distance threshold)                          │
    │      ↓                                              │
    │  route_coords[] accumulates                         │
    │      ↓                                              │
    │  [Stop] → calls workoutsApi.log()                   │
    │      ↓                                              │
    │  Saves to Supabase workouts table                   │
    │      ↓                                              │
    │  Auto-navigate to WorkoutDetail                     │
    └─────────────────────────────────────────────────────┘
         ↓
    ┌──────────────────────────────────────────────────────┐
    │       WorkoutDetailScreen                            │
    │  ──────────────────────────────────────────────────  │
    │  ┌─ HEADER ──────────────────────────────────────┐   │
    │  │ [Back] | Workout Title | [×]                 │   │
    │  └────────────────────────────────────────────────┘   │
    │                                                      │
    │  ┌─ MAP VIEWER (height: 300) ────────────────────┐   │
    │  │ • Polyline (route)                            │   │
    │  │ • Green marker (start)                        │   │
    │  │ • Red marker (end)                            │   │
    │  │ • Auto-fit to bounds                          │   │
    │  └────────────────────────────────────────────────┘   │
    │  ┌─ PLAYBACK CTA ─────────────────────────────────┐   │
    │  │ [▶ Play Replay] / [⏸ Hide Replay]             │   │
    │  └────────────────────────────────────────────────┘   │
    │                                                      │
    │  ┌─ ROUTE PLAYBACK (height: 400, conditional) ──┐   │
    │  │ • Animated blue dot along path                │   │
    │  │ • Progress bar (% of duration)                │   │
    │  │ • Play/Pause/Stop controls                    │   │
    │  └────────────────────────────────────────────────┘   │
    │                                                      │
    │  ┌─ STATS GRID (2 cols) ──────────────────────────┐   │
    │  │ 📍 Distance   │  ⏱ Duration                   │   │
    │  │ 📍 Pace /km   │  🔥Calories                    │   │
    │  └────────────────────────────────────────────────┘   │
    │                                                      │
    │  ┌─ BEST SEGMENTS ─────────────────────────────────┐  │
    │  │ [1km Segment]  [5km Segment]  [10km Segment]   │  │
    │  │  98s, 7:25/km  512s, 7:28/km  1025s, 7:20/km  │  │
    │  │               ⭐ PR flag on fastest            │  │
    │  └────────────────────────────────────────────────┘  │
    │                                                      │
    │  ┌─ USER CARD ─────────────────────────────────────┐  │
    │  │ [Avatar] John Doe                               │  │
    │  │           2 hours ago                           │  │
    │  └────────────────────────────────────────────────┘  │
    │                                                      │
    │  ┌─ NOTES (if present) ───────────────────────────┐  │
    │  │ "Great run in Golden Gate Park!"                │  │
    │  └────────────────────────────────────────────────┘  │
    ├──────────────────────────────────────────────────────┤
    │  DATA PIPELINE:                                     │
    │  1. fetchWorkout() → workoutsApi.getById()         │
    │  2. detectSegments(route_coords)                   │
    │  3. FOR each segment:                              │
    │     • getSegmentPR() → query past segments         │
    │     • Compare pace: if faster → isPR = true        │
    │  4. saveSegments() → persist to workout_segments  │
    └──────────────────────────────────────────────────────┘
         ↓
    ┌──────────────────────────────────────────────────────┐
    │       ActivityFilterModal                            │
    │  ──────────────────────────────────────────────────  │
    │  ┌─ HEADER ──────────────────────────────────────┐   │
    │  │ Filter Activity | [Close]                     │   │
    │  └────────────────────────────────────────────────┘   │
    │                                                      │
    │  ┌─ WORKOUT TYPES (scrollable) ─────────────────┐   │
    │  │ ☑ 🏃 Running                                 │   │
    │  │ ☐ 🚴 Cycling                                 │   │
    │  │ ☐ 🏊 Swimming                                │   │
    │  │ ☐ 💪 Strength                                │   │
    │  │ ☐ 🧘 Yoga                                    │   │
    │  │ ☐ 🥾 Hiking                                  │   │
    │  │ ☐ ⚡ Other                                    │   │
    │  └────────────────────────────────────────────────┘   │
    │                                                      │
    │  ┌─ FOOTER ──────────────────────────────────────┐   │
    │  │ [Clear All Filters] [Done]                    │   │
    │  └────────────────────────────────────────────────┘   │
    │                                                      │
    │  STATE:                                            │
    │  • types = Set<string> (selected types)            │
    │  • Applied to feed: activity.filter(item =>        │
    │    item.kind==='workout' && types.has(item.type))  │
    └──────────────────────────────────────────────────────┘


FROM ANY SCREEN:
         ↓
    ┌─────────────────────────────────────┐
    │       StatsScreen (MODAL)           │
    │  ────────────────────────────────── │
    │                                     │
    │  ┌─ TIME PERIODS (scrollable) ────┐│
    │  │ TODAY | THIS WEEK | THIS MONTH ││
    │  │ THIS YEAR                      ││
    │  └────────────────────────────────┘│
    │                                     │
    │  ┌─ STATS GRID (per period) ──────┐│
    │  │ 📍 Distance  │  ⏱ Duration     ││
    │  │ 🏋️ Workouts  │  📊 Avg Pace    ││
    │  │ 🚀 Best Pace │  🔥 Calories    ││
    │  └────────────────────────────────┘│
    │                                     │
    │  ┌─ TYPE BREAKDOWN ───────────────┐│
    │  │ Run: 3        Cycle: 1          ││
    │  │ Swim: 0       Strength: 2      ││
    │  └────────────────────────────────┘│
    │                                     │
    │  ┌─ ACTIVITY HEATMAP (52-week) ──┐│
    │  │ Sun Mon Tue Wed Thu Fri Sat    ││
    │  │ [░] [░] [▓] [░] [▓] [░] [░]    ││
    │  │ [░] [░] [░] [░] [░] [█] [░]    ││
    │  │ ... (48 more weeks)             ││
    │  │                                ││
    │  │ Legend:                        ││
    │  │ ░ = None  ▒ = Light  ▓ = Med  ││
    │  │ █ = High (based on km/day)    ││
    │  └────────────────────────────────┘│
    │                                     │
    │  DATA PIPELINE:                    │
    │  1. fetchWorkouts(userId)          │
    │  2. getTimePeriodStats(workouts)   │
    │  3. Filter by date & aggregate     │
    │  4. computeHeatmapData(workouts)   │
    └─────────────────────────────────────┘
```

---

## Data Flow: Record → Detail → Stats → Heatmap

```
┌─────────────────────────────────────────────────────────────┐
│                    GPS RECORDING                            │
│                                                              │
│  Location callback every 5m distance:                       │
│  ┌──────────────────────────────────┐                       │
│  │ { latitude, longitude, timestamp}│  × N coords           │
│  └──────────────────────────────────┘                       │
│           ↓                                                  │
│      route_coords[]                                         │
└─────────────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────────┐
│               SAVE TO SUPABASE: workouts                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ id: UUID                                            │   │
│  │ user_id: UUID (Clerk ID)                            │   │
│  │ type: 'run' | 'cycle' | 'swim' | ...              │   │
│  │ distance_km: 5.2                                    │   │
│  │ duration_minutes: 35                                │   │
│  │ calories: 420                                       │   │
│  │ route_coords: [{lat, lon, timestamp}, ...]         │   │
│  │ logged_at: NOW()                                    │   │
│  │ squad_id: UUID (optional)                           │   │
│  │ goal_id: UUID (optional)                            │   │
│  │ notes: "Great run!" (optional)                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────────┐
│           SEGMENT DETECTION & PR CHECKING                   │
│   (happens in WorkoutDetailScreen on mount)                 │
│                                                              │
│  detectSegments(route_coords):                              │
│  ├─ Haversine distance calc between points                  │
│  ├─ Divide into 1km, 5km, 10km chunks                       │
│  ├─ Calc pace per chunk                                     │
│  └─ Return WorkoutSegment[]                                 │
│       ↓                                                      │
│  FOR each segment:                                          │
│  ├─ Extract start_lat/lon, end_lat/lon                      │
│  ├─ Query: getSegmentPR(user_id, distance, coords)          │
│  │   → Find past segments ±0.01° (±1km)                     │
│  ├─ Compare paces: ispendence newer than best?              │
│  └─ Mark isPR = true/false                                  │
│       ↓                                                      │
│  saveSegments(segment_data[]):                              │
│  └─ INSERT into workout_segments table                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ workout_segments table                              │   │
│  │                                                     │   │
│  │ id, workout_id, user_id                            │   │
│  │ distance_km, start_lat/lon, end_lat/lon            │   │
│  │ duration_seconds, pace_min_per_km                   │   │
│  │ created_at                                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────────┐
│        STATS AGGREGATION (StatsScreen)                      │
│                                                              │
│  getUserStats(userId) → fetch all workouts ordered desc    │
│       ↓                                                      │
│  getTimePeriodStats(workouts[]):                           │
│  ├─ Filter: workouts in TIME_PERIOD                        │
│  ├─ Sum distance_km                                        │
│  ├─ Sum duration_minutes                                   │
│  ├─ Avg pace (sum durations / sum distances)               │
│  ├─ Best pace (min pace value)                             │
│  ├─ Count workout types                                     │
│  └─ Return TimeRangeStats × 4 (today/week/month/year)      │
│       ↓ (stats grid renders per period)                    │
└─────────────────────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────────┐
│           ACTIVITY HEATMAP (52-week calendar)               │
│                                                              │
│  computeHeatmapData(workouts[]):                           │
│  ├─ Init: 52 weeks back → today (365 days)                 │
│  ├─ For each day: sum distance_km                          │
│  ├─ Calc intensity:                                        │
│  │   - Find max km in 52 weeks                             │
│  │   - Light: 0-25% of max                                 │
│  │   - Medium: 25-60% of max                               │
│  │   - High: 60%+ of max                                   │
│  └─ Return DayStats[][]  (52 rows = weeks)                 │
│       ↓ (heatmap renders color grid)                       │
│                                                              │
│  [░] [░] [░] [░] [▓] [░]  Week 1                           │
│  [░] [░] [░] [░] [░] [░]  Week 2                           │
│  [▒] [▓] [▒] [▓] [▓] [░]  Week 3                           │
│  ...                       (52 weeks)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
RootNavigator
  ├─ TabNavigator
  │   ├─ HomeScreen
  │   │   ├─ GoalCard (skeleton while loading)
  │   │   ├─ ActivityFeedFilter (filter button + modal)
  │   │   │   └─ ActivityFilterButton
  │   │   │   └─ ActivityFilterModal
  │   │   └─ ActivityFeed (scrollview with cards)
  │   │       └─ WorkoutActivityCard[] (or ActivityFeedItem[])
  │   │           └─ onPress → navigate("WorkoutDetail", {workoutId})
  │   │
  │   ├─ SquadListScreen
  │   ├─ LogWorkoutScreen
  │   ├─ NotificationsScreen
  │   └─ ProfileScreen
  │
  ├─ WorkoutDetailScreen (modal)
  │   ├─ WorkoutMapViewer
  │   │   └─ MapView + RoutePolyline + Markers
  │   ├─ RoutePlayback (conditional, toggle via button)
  │   ├─ StatCard[] (Distance, Duration, Pace, Calories)
  │   ├─ SegmentCard[] (1km, 5km, 10km with PR badges)
  │   ├─ UserCard
  │   └─ NotesCard
  │
  ├─ ActiveWorkoutScreen (fullscreen modal)
  │   ├─ MapView (react-native-maps)
  │   │   └─ Polyline (route_coords, live updating)
  │   ├─ DistanceDisplay (live)
  │   ├─ DurationDisplay (live, stopwatch)
  │   ├─ StartButton | StopButton
  │   └─ StatusIndicator (recording/paused)
  │
  ├─ StatsScreen (modal)
  │   ├─ TabView (Today, Week, Month, Year)
  │   ├─ StatTile[] (Distance, Duration, Workouts, Pace, etc.)
  │   ├─ TypeBreakdown (run count, cycle count, etc.)
  │   └─ ActivityHeatmap
  │       ├─ DayLabels (Sun-Sat)
  │       ├─ WeekRow[] (52 rows)
  │       │   └─ Cell[] (7 cols = days)
  │       └─ Legend (No activity, Low, Medium, High)
  │
  └─ Other Modal Screens
      ├─ SquadDetailScreen
      ├─ CreateSquadScreen
      ├─ etc.
```

---

## Key Imports & Utilities

```typescript
// Segment Detection
import { detectSegments, formatSegmentPace, getSegmentData, haversineKm } from '@/utils/segmentDetection'

// Stats Aggregation
import { getTimePeriodStats, formatDurationHours, formatPace, computeRangeStats } from '@/utils/statsHelpers'

// Heatmap
import { computeHeatmapData, ActivityHeatmap } from '@/components/common/ActivityHeatmap'

// Filtering
import { ActivityFilterButton, ActivityFilterModal, type ActivityFilters } from '@/components/squad/ActivityFeedFilter'

// Map Components
import { WorkoutMapViewer, RoutePlayback, RoutePolyline, MapView } from '@/components/map'

// API
import { workoutsApi, workoutsApi.getById, workoutsApi.getSegmentPR, workoutsApi.saveSegments, workoutsApi.getUserStats } from '@/services/supabase'
```

---

## State Management Summary

**Zustand Store** (`useSquadStore`):

- `activeSquad`, `activeGoal`, `goalProgress`
- `activity[]` (feed items), `activityLoading`
- `workouts[]`, `workoutsLoading`
- `selectSquad()`, `refreshGoal()`, `loadSquads()`

**Local Component State**:

- `ActiveWorkoutScreen`: route_coords[], distance, duration, isRecording
- `WorkoutDetailScreen`: workout, segments[], showPlayback, isLoading
- `StatsScreen`: stats[], isLoading
- `HomeScreen`: filters (ActivityFilters), showFilterModal
- `RoutePlayback`: playbackStatus, elapsedSeconds, currentIndex

---

## Testing Entry Points

```typescript
// Start a Test Workout
adb shell input keyevent KEYCODE_W  // Simulate walking (if using Genymotion)

// Or manually in __DEV__ mode add:
const TEST_COORDS = [
  { latitude: 37.7749, longitude: -122.4194, timestamp: Date.now() },
  { latitude: 37.7750, longitude: -122.4193, timestamp: Date.now() + 60000 },
  // ... 100+ coords to make 5km route
];

// Check Supabase directly
SELECT * FROM workouts WHERE user_id = 'YOUR_ID' ORDER BY logged_at DESC;
SELECT * FROM workout_segments WHERE user_id = 'YOUR_ID' ORDER BY created_at DESC;

// Check computed stats
const workouts = await workoutsApi.getByUser(userId);
const stats = getTimePeriodStats(workouts);
console.log('Today stats:', stats[0].stats); // First item is TODAY
```
