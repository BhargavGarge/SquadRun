TODO — Strava-Parity Features (High Priority)
Feature | Status | Notes | Impact | Effort
--- | --- | --- | --- | ---
GPS Route Recording | ✅ Done | ActiveWorkoutScreen records GPS route + steps and passes route_coords into workout log | 🔴 High | 🔴 High
Route Map Display | ✅ Done | Workout detail shows route on map; activity cards show mini route preview | 🔴 High | 🔴 High
Best Segments | ✅ Done | Best segments detected per workout with PR flag on WorkoutDetailScreen | 🟠 Medium | 🟠 Medium
Performance Metrics | ❌ Not built | No heart-rate / zones yet; only basic pace + calories estimate | 🟠 Medium | 🟠 Medium
Activity Photos | ✅ Done | Photo upload on LogWorkout + display on WorkoutDetail; stored in workout-photos bucket | 🟡 Low | 🟡 Low
Comments on Activity | ✅ Done | Single comment thread per workout on WorkoutDetail (with keyboard-safe input) | 🟡 Low | 🟡 Low
Likes/Kudos | ✅ Done | Like/unlike (kudos) on WorkoutDetail with counts and per-user state | 🟡 Low | 🟡 Low
Leaderboard | 🟠 Partial | SquadDetailScreen has goal-based member leaderboard + "Your position" summary; no global app-wide leaderboard | 🟡 Low | 🟡 Low
Workout Export | ❌ Not built | No Strava/Apple Health export yet | 🟠 Medium | 🟠 Medium
Calendar View | ✅ Done | Stats screen shows monthly activity heatmap | 🟡 Low | 🟡 Low
Historical Data | ✅ Done | Stats screen aggregates past workouts; history list + heatmap; can refine further later | 🔴 High | 🔴 High
🚀 UNIQUE SQUAD-RUN FEATURES (Squad Goals Exclusive)
These differentiate from Strava:

Squad Velocity Sync ⚡

Real-time GPS feed of squad members during group runs
"See where your squad is" during live activity
Drop-in/drop-out mid-run without breaking the session
Collective Goal Bars 🎯

Squad-wide progress meter (e.g., "20km this week as a team")
Breakout by member contribution (mini leaderboard under main progress bar)
Milestone celebrations when squad hits targets
Live Pace Matching 🏃

Alert if squadmate is significantly ahead/behind
"Keep pace" mode: suggest target speed to stay together
Post-workout: "you averaged 5:30/km, squad avg 5:28"
Squad Challenges 🏆

Mini micro-goals within squads (e.g., "3 runs in 7 days")
Rotating weekly challenges (fastest 1km, most runs, longest streak)
Achievement badges earned collectively + individually
Accountability Feed 📢

"3 days without a workout — teammates logged in — stay in sync"
Streak tracking for squads + individuals
Customizable reminders (Slack-style push: "Your squad is active now")
Route Sharing Queue 🗺️

Squad uploads favorite routes
"Most run route this month" auto-suggested for next session
Difficulty ratings + time estimates
Squad Insights Dashboard 📊

Total squad stats: km/week, calories, workouts logged
Individual comparison (transparent % contribution)
Trends: "squad pace improving week-over-week"
📋 RECOMMENDED NEXT STEPS (Priority Order)
Phase 2 (Core Strava Parity):

✅ GPS route playback on map (use react-native-maps)
✅ Historical activity data aggregation (stats, calendar)
✅ Best segments detection (per-workout UI with PR badge)
✅ Workout comments (single comment thread per activity)
Phase 3 (Squad Differentiation):

🟠 Live squad sync during run (GPS feed real-time) — implemented but **not fully tested on 2 devices yet**
🟠 Collective goal breakdowns + leaderboard — core goal bar + leaderboard shipped; room to expand insights
🟠 Squad challenges UI — squad-level weekly challenges tab added; logic is derived client-side from recent workouts
Phase 4 (Polish):

✅ Calendar heatmap
✅ Likes/kudos system
✅ Photo uploads
✅ Settings refinement
