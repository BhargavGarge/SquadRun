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
Leaderboard | 🟠 Partial | SquadDetailScreen has goal-based member leaderboard + Medium
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
What │ Honest effort │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Live pace matching ("squad is 200m ahead") │ Medium — needs real-time location diff calc │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Accountability feed / streak nudges │ Medium — needs scheduled push logic │ │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Route sharing queue │ Low-medium — basically a saved routes list │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Squad insights dashboard (trends, week-over-week) │ Low — data exists, just more charts │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
Blockers — App won't work in production without these

┌─────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────┐  
 │ What │ Why it's blocking │  
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤  
 │ Supabase prod environment │ You're likely on dev keys. Real users need prod project, RLS policies verified, no test data │  
 │ │ leaking │  
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤  
 │ Push notifications (prod) │ Squad alerts, accountability nudges — configured for dev only right now │  
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤  
 │ Live squad sync — 2-device test │ Shipped but never verified with 2 real phones. Could be completely broken │  
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤  
 │ Error states + loading │ If API is slow or fails, does the app crash or show blank screens? │  
 │ skeletons │ │  
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤  
 │ Auth edge cases │ What happens if Clerk token expires mid-session? User gets stuck? │  
 └─────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────┘

---

Must-have for real users (not blocking but close)

┌──────────────────┬───────────────────────────────────────────────────────────────────────────────────┐
│ What │ Why │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ Onboarding flow │ First-time user lands where exactly? Is it clear what the app does in 30 seconds? │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ Empty states │ New squad with no workouts — does everything look broken or intentional? │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ Offline handling │ Phone loses signal mid-run — does GPS recording survive? │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ Deep links │ Squad invite code tapped from iMessage — does it open the right screen? │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ Account deletion │ Apple requires this. Legal requires this. │
└──────────────────┴───────────────────────────────────────────────────────────────────────────────────┘

---

Features genuinely not built yet

┌───────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ What │ Honest effort │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Live pace matching ("squad is 200m ahead") │ Medium — needs real-time location diff calc │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Accountability feed / streak nudges │ Medium — needs scheduled push logic │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Workout export (GPX / Apple Health) │ Medium — well-documented APIs but tedious │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Route sharing queue │ Low-medium — basically a saved routes list │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Squad insights dashboard (trends, week-over-week) │ Low — data exists, just more charts │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Performance metrics / heart rate │ High — needs hardware sensor integration, skip for now │
├───────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Global leaderboard │ Low — you have the data, just a new screen │
└───────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘

---

For App Store specifically

┌───────────────────────────────────────────────┬────────────────────────────────────────────────────┐
│ What │ Notes │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ Sign in with Apple │ Required by Apple if Clerk social login is offered │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ Privacy policy (hosted URL) │ Required field — use a generator │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ App icon 1024×1024 │ Need a proper one, not a placeholder │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ Screenshots (6.7" + 6.1") │ 6–10 screens minimum, staged and polished │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ Location permission strings │ Apple reads these carefully for fitness apps │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ Background location entitlement justification │ You record GPS mid-run — Apple will ask why │
├───────────────────────────────────────────────┼────────────────────────────────────────────────────┤
│ Test account for reviewers │ Apple needs to log in and test │
└───────────────────────────────────────────────┴────────────────────────────────────────────────────┘

---

Honest Priority Order

1. Fix prod environment (Supabase + auth)
2. Test live squad sync on 2 real devices
3. Onboarding + empty states
4. Account deletion
5. Offline GPS recording resilience
6. Sign in with Apple
7. Screenshots + icon
8. Submit

Everything below line 8 is post-launch.

The app is genuinely close. The features are built. What's missing is the reliability layer — the stuff that breaks for real users that  
 never breaks in your own testing because you know how to use it.
