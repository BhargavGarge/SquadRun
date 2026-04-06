# Phase 2 Testing Guide — Route Visualization & History

## App Flow for Phase 2

```
HomeScreen (Activity Feed)
    ↓
    ├─→ Start Run (ActiveWorkoutScreen)
    │       ↓
    │       GPS Recording (5m distance threshold)
    │       ↓
    │       Save Workout
    │
    └─→ Activity Card (WorkoutActivityCard)
            ↓
            [TAP] → WorkoutDetailScreen
                        ↓
                        ├─ Map Viewer (route display)
                        ├─ Route Playback (animated replay)
                        ├─ Stats Grid (Distance, Duration, Pace, Calories)
                        ├─ Segments (1km/5km/10km with pace)
                        ├─ PR Detection (if geospatial match found)
                        └─ User Card + Notes

Profile/Stats Navigation
    ↓
    Stats Screen
        ↓
        Time Period Tabs (Today, Week, Month, Year)
        ├─ Stats Grid (6 cards per period)
        ├─ Type Breakdown (run count, cycle count, etc.)
        └─ Activity Heatmap (52-week calendar)
```

---

## Test Case 1: GPS Recording & Route Capture

**Prerequisite**: Location permissions enabled

| Step | Action                                             | Expected Result                                  |
| ---- | -------------------------------------------------- | ------------------------------------------------ |
| 1    | HomeScreen → "Start Run" button                    | ActiveWorkoutScreen opens full-screen            |
| 2    | Map displays with blue dot at user location        | Current location visible, "User Location" marker |
| 3    | Start walking/running (or simulate with dev tools) | Blue polyline appears on map showing path        |
| 4    | Record ~1-2 km of movement                         | Polyline updates every 5m (distance threshold)   |
| 5    | Tap "Stop Workout"                                 | Sync confirmation, saves to Supabase             |
| 6    | Redirect to HomeScreen                             | New workout appears in activity feed             |

**Debug**: Check Supabase `workouts` table for `route_coords` JSON (array of lat/lon/timestamp)

---

## Test Case 2: WorkoutDetailScreen Integration

**Prerequisite**: At least 1 workout logged (see Test Case 1)

| Step | Action                                         | Expected Result                                                                 |
| ---- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| 1    | HomeScreen → Tap workout activity card         | WorkoutDetailScreen opens                                                       |
| 2    | Verify header with workout title & back button | Title displays, back button works                                               |
| 3    | Observe MapViewer section                      | Route polyline visible, start (green) + end (red) markers                       |
| 4    | Scroll down to see stats grid                  | 4 cards show: Distance (km), Duration (h:mm:ss), Pace (min/km), Calories (kcal) |
| 5    | Verify user card displays                      | Avatar, name, "x time ago" timestamp                                            |
| 6    | If workout has notes, scroll to notes section  | Notes render below user card                                                    |

**Expected Stats Values**:

- Distance: `route_coords` haversine sum
- Duration: `logged_at` - first coord timestamp
- Pace: duration / distance / 60
- Calories: from `workouts.calories` column

---

## Test Case 3: Segment Auto-Detection & Display

**Prerequisite**: Workout with route_coords (see Test Case 1)

| Step | Action                         | Expected Result                                                                   |
| ---- | ------------------------------ | --------------------------------------------------------------------------------- |
| 1    | WorkoutDetailScreen displaying | "BEST SEGMENTS" section appears below stats                                       |
| 2    | Inspect segment cards          | Shows: distance (1km/5km/10km), duration, pace                                    |
| 3    | For run workout                | Pace displays as `MM:SS/km` format                                                |
| 4    | For cycle workout              | Pace displays as `XX.X km/h` format                                               |
| 5    | Check segment logic            | Only segments that fit within route appear (e.g., 5km segment only if route ≥5km) |

**Segment Examples**:

- 5km route → shows 1km segment only
- 15km route → shows 1km, 5km, 10km segments
- 3km route → shows 1km segment only

---

## Test Case 4: Segment PR Tracking

**Prerequisites**:

- Supabase `workout_segments` table created (see SEGMENT_TRACKING.md)
- 2+ workouts on same route (repeated segment)

| Step | Action                                                | Expected Result                                                  |
| ---- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Log first 5km run on route (coordinates A→B)          | WorkoutDetailScreen shows 1km, 5km segments                      |
| 2    | Segments save to `workout_segments` table             | Check Supabase: user_id, distance_km, start_lat/lon, end_lat/lon |
| 3    | Log second 5km run on **same route** (±1km tolerance) | After save, segments geospatially match first run                |
| 4    | On second workout detail screen                       | Check segment PR flags:                                          |
|      | • If 2nd pace > 1st pace (slower)                     | `isPR: false` (no PR badge)                                      |
|      | • If 2nd pace < 1st pace (faster)                     | `isPR: true` (PR badge appears)                                  |
|      | • If no previous segment                              | `isPR: true` (first time = PR)                                   |

**Geospatial Matching**: ±0.01° lat/lon threshold (~1km)

- Start point must be within ±0.01° of first run start
- End point must be within ±0.01° of first run end

**Debug**: Query `workout_segments` to inspect stored data:

```sql
SELECT * FROM workout_segments
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

---

## Test Case 5: Historical Stats Aggregation

**Prerequisite**: 3+ workouts across different days/types

| Step | Action                                 | Expected Result                        |
| ---- | -------------------------------------- | -------------------------------------- |
| 1    | Navigate to Stats screen (modal route) | From any screen, nav.navigate("Stats") |
| 2    | "TODAY" section                        | Shows today's workouts only (if any)   |
| 3    | "THIS WEEK" section                    | Monday-today's workouts summed         |
| 4    | "THIS MONTH" section                   | 1st-today's workouts summed            |
| 5    | "THIS YEAR" section                    | Jan 1-today's workouts summed          |

**Stats Computed**:

- **Distance**: Sum of `distance_km`
- **Duration**: Sum of `duration_minutes` (format as `Xh Ym`)
- **Workouts**: Count of workouts
- **Avg Pace**: Average pace across all workouts with valid distance
- **Best Pace**: Minimum pace (fastest)
- **Calories**: Sum of `calories`
- **Type Breakdown**: Tabulation of `type` (run, cycle, swim, etc.)

**Example Stats**:

```
THIS WEEK
- Distance: 25.3 km
- Duration: 3h 15m
- Workouts: 4
- Avg Pace: 7:45/km
- Best Pace: 6:30/km
- Calories: 2840 kcal
BY TYPE: Run: 3, Cycle: 1
```

---

## Test Case 6: Activity Feed Filtering

**Prerequisite**: ~5+ workouts of mixed types in activity feed

| Step | Action                                       | Expected Result                                            |
| ---- | -------------------------------------------- | ---------------------------------------------------------- |
| 1    | HomeScreen → Tap filter icon (funnel button) | ActivityFilterModal opens                                  |
| 2    | No filters selected                          | Button shows neutral color, no badge                       |
| 3    | Select "Running" only                        | Button turns primary color, badge shows "1"                |
| 4    | Select "Cycling" too                         | Badge updates to "2"                                       |
| 5    | Close modal ("Done")                         | Activity feed re-renders showing only Run + Cycle workouts |
| 6    | Tap filter again                             | Selections are persisted (still checked)                   |
| 7    | Tap "Clear All Filters"                      | All checkmarks removed, feed shows all activities          |

**Filter Logic**:

- Sport type filters by `item.payload.type` (if kind='workout')
- Empty filter = show all activities
- Multiple selections = OR logic (run OR cycle OR swim, etc.)

---

## Test Case 7: Calendar Activity Heatmap

**Prerequisite**: Workouts spread across several weeks

| Step | Action                                    | Expected Result                                                                               |
| ---- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1    | Stats screen or Heatmap component visible | 52-week grid displays (Sunday-Saturday columns)                                               |
| 2    | Each cell represents 1 day                | Colored by intensity: gray (none), light blue (light), medium blue (medium), dark blue (high) |
| 3    | Intensity calculation                     | Based on daily km total as % of max daily km in 52 weeks                                      |
| 4    | Days with no workouts                     | Gray cells (0 km)                                                                             |
| 5    | Days with workouts                        | Colored intensity (light: 0-25% of max, medium: 25-60%, high: 60%+)                           |
| 6    | Legend visible                            | Shows 4 intensity levels explained                                                            |

**Example Heatmap**:

```
Week 1: [gray] [gray] [blue] [gray] [darkblue] [gray] [gray]
        Sun   Mon   Tue   Wed   Thu       Fri   Sat
```

(Tue = light activity, Thu = high activity)

---

## Full End-to-End Test Flow (5-10 minutes)

```
1. RECORD WORKOUT
   HomeScreen → Start Run → Walk 5km → Save workout
   ✓ Route polyline saved to Supabase

2. VIEW WORKOUT DETAIL
   WorkoutDetailScreen appears auto-routing from save
   ✓ Map, stats, segments visible
   ✓ PR detection runs (first time = PR badge if enabled)

3. CHECK STATS
   Navigate to Stats screen
   ✓ Today's stats show your 5km workout
   ✓ Type shows "1 Run"

4. RECORD 2ND WORKOUT (same route)
   HomeScreen → Start Run → Walk same 5km route → Save
   ✓ Segments geospatially match first run
   ✓ PR badge appears if pace is faster

5. TEST FILTERING
   HomeScreen → Filter modal
   ✓ Select only "Running"
   ✓ Feed shows only your runs (2 total)
   ✓ Reset filters

6. CHECK HEATMAP
   Stats screen → scroll to heatmap
   ✓ 2 high-intensity days visible (today + yesterday)
   ✓ Legend explains color coding
```

---

## Manual Setup Checklist

Before Phase 2 testing, complete:

- [ ] Supabase `workout_segments` table created (see SEGMENT_TRACKING.md)
- [ ] RLS policies enabled on `workout_segments`
- [ ] Location permissions granted in app
- [ ] At least 1 test workout logged
- [ ] `workoutsApi.getUserStats()` method callable
- [ ] ActivityHeatmap, ActivityFilterModal, StatsScreen imported in navigation

---

## Common Issues & Debugging

| Issue                  | Likely Cause                     | Fix                                                 |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| Segments not showing   | Route has <2 coords              | Log workout with >5km distance                      |
| PR badge not appearing | Table doesn't exist              | Run SEGMENT_TRACKING.md SQL                         |
| Stats showing $0       | No workouts on that date         | Check date filtering logic                          |
| Heatmap cells all gray | All days < max km                | Log workouts with varying distances                 |
| Filter not persisting  | Modal closing without state save | Check `onFiltersChange` callback                    |
| Pace showing as "NaN"  | No distance or duration          | Ensure `distance_km` > 0 and `duration_minutes` > 0 |

---

## Navigation Route Recap

From any screen, test these nav routes:

```javascript
// Access Stats
navigation.navigate("Stats");

// Access Workout Detail (from activity card tap)
navigation.navigate("WorkoutDetail", { workoutId: "UUID" });

// Back to Home
navigation.navigate("Home");

// Open Filter Modal (in HomeScreen)
setShowFilterModal(true);
```

---

## Success Criteria for Phase 2

✅ **All 10 features working end-to-end:**

1. Maps display route polyline
2. GPS records with 5m distance threshold
3. Route playback animates blue dot
4. WorkoutDetailScreen navigation works
5. Segments display with pace calculations
6. PR detection flags faster segments
7. Stats aggregate by time period
8. Stats dashboard renders all 4 periods
9. Activity feed filters by type
10. Heatmap shows 52-week calendar

🎉 **Phase 2 complete when:** You can log a workout, see it in detail with segments/stats, filter activities, and view the heatmap.
