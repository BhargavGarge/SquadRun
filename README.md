# Squad Goals ⚡

A production-ready React Native fitness accountability app for small private groups (3–6 people). Think Strava — but optimized for intimate social accountability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 51) |
| Authentication | Clerk (`@clerk/clerk-expo`) |
| Backend / DB | Supabase (PostgreSQL + Realtime) |
| Navigation | React Navigation v6 |
| State | Zustand |
| Animations | React Native Reanimated 3 |
| Typography | Lexend + Manrope (Google Fonts) |
| UI Effects | Expo BlurView, Expo Linear Gradient |
| Notifications | Expo Notifications |

---

## Project Structure

```
SquadGoals/
├── App.tsx                        # Entry: fonts, Clerk, Theme, Auth providers
├── index.js                       # Expo root component registration
├── app.json                       # Expo config (bundle ID, permissions, etc.)
├── package.json
├── tsconfig.json
├── babel.config.js
├── .env.example                   # Copy to .env and fill in keys
│
├── src/
│   ├── types/
│   │   └── index.ts               # All domain types (User, Squad, Goal, Workout…)
│   │
│   ├── theme/
│   │   ├── colors.ts              # Dark/light tonal surface palettes
│   │   ├── typography.ts          # Lexend + Manrope type scale
│   │   ├── spacing.ts             # 4px base grid, radius, shadows
│   │   └── index.ts               # createTheme() barrel
│   │
│   ├── services/
│   │   ├── supabase.ts            # Supabase client + typed API helpers
│   │   └── notifications.ts       # Expo push notification helpers
│   │
│   ├── contexts/
│   │   ├── ThemeContext.tsx        # Dark/light mode state
│   │   ├── AuthContext.tsx         # Clerk ↔ Supabase user sync
│   │   └── SquadContext.tsx        # Zustand store (squads, goals, workouts)
│   │
│   ├── navigation/
│   │   ├── types.ts               # Param-list types for all navigators
│   │   ├── AppNavigator.tsx        # Root: Auth vs Main
│   │   ├── AuthNavigator.tsx       # Welcome → SignIn/Up → Onboarding
│   │   └── TabNavigator.tsx        # Main tab bar (custom glass design)
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── GlassCard.tsx      # Glassmorphic card (BlurView + animated press)
│   │   │   ├── GradientButton.tsx # Primary/secondary/tertiary/danger buttons
│   │   │   ├── ProgressRing.tsx   # SVG animated arc ring
│   │   │   ├── AnimatedProgressBar.tsx  # Gradient progress bar
│   │   │   ├── Avatar.tsx         # Avatar with fallback initials + badge
│   │   │   ├── Badge.tsx          # Achievement badge with pop-in animation
│   │   │   ├── Chip.tsx           # Selectable filter chip
│   │   │   └── Input.tsx          # Styled text input (glow on focus)
│   │   ├── squad/
│   │   │   ├── SquadCard.tsx      # Glass squad card with progress
│   │   │   ├── MemberRow.tsx      # Leaderboard row with animated bar
│   │   │   └── ActivityFeedItem.tsx  # Feed item (workout/join/goal)
│   │   └── workout/
│   │       └── WorkoutCard.tsx    # Workout summary card
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx  # Animated hero landing
│   │   │   ├── SignInScreen.tsx   # Clerk email/password sign-in
│   │   │   ├── SignUpScreen.tsx   # Clerk sign-up + email verification
│   │   │   └── OnboardingScreen.tsx  # 3-slide squad concept intro
│   │   ├── home/
│   │   │   └── HomeScreen.tsx     # Dashboard: active goal, quick log, feed
│   │   ├── squad/
│   │   │   ├── SquadListScreen.tsx
│   │   │   ├── SquadDetailScreen.tsx  # Goal ring, leaderboard, activity
│   │   │   ├── CreateSquadScreen.tsx
│   │   │   └── JoinSquadScreen.tsx
│   │   ├── goals/
│   │   │   └── CreateGoalScreen.tsx
│   │   ├── workout/
│   │   │   └── LogWorkoutScreen.tsx   # Workout type picker + stats + celebration
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   │
│   └── utils/
│       ├── helpers.ts             # Formatters, date helpers, clamp, etc.
│       └── sampleData.ts          # Static sample users/squads/workouts
│
└── supabase/
    ├── migrations/
    │   └── 001_initial.sql        # Full schema with RLS policies + triggers
    └── seed.sql                   # Sample data for local development
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo`
- iOS: Xcode 15+ (macOS only)
- Android: Android Studio with an emulator configured

### 2. Clone and install

```bash
git clone <repo-url>
cd squad-goals
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_KEY
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Also update `app.json` → `expo.extra` with the same values (required for `expo build`).

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In **SQL Editor**, run `supabase/migrations/001_initial.sql`
3. Optionally run `supabase/seed.sql` for sample data
4. Copy your Project URL and `anon` key into `.env`

**Enable Realtime** (Supabase Dashboard → Database → Replication):
- Turn on for: `workouts`, `activity_feed`, `notifications`, `goals`

### 5. Set up Clerk

1. Create an app at [clerk.com](https://clerk.com)
2. Enable **Email/Password** authentication
3. Copy the **Publishable Key** into `.env`
4. In Clerk Dashboard → JWT Templates → Create a **Supabase** template
5. In Supabase → Authentication → JWT Settings → paste Clerk's JWKS endpoint

This bridges Clerk auth tokens with Supabase RLS policies.

### 6. Run the app

```bash
# Start Expo dev server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

---

## Key Features Walkthrough

### Authentication Flow
- Clerk handles all auth (sign up, sign in, email verification)
- On sign-in, `AuthContext` upserts the user in Supabase
- The `AppNavigator` automatically routes to the correct flow

### Squad System
- Create squads with 3–6 max members
- Join via a 6-character invite code
- Real-time member list via Supabase

### Goals & Progress
- Set shared goals: distance, time, sessions, or calories
- Progress bar updates in real-time as members log workouts
- Supabase trigger auto-marks goals as "completed" when target is hit

### Workout Logging
- 7 workout types with matching color accents
- Workouts are tied to a squad + goal for contribution tracking
- Activity feed gets a new entry via `activityApi.insert()`
- Local push notification fires to simulate squad awareness

### Leaderboard
- Each squad detail screen shows ranked member contributions
- Animated bars scale proportionally to the top contributor

### Real-Time Updates
- `subscribeToSquadWorkouts` → live progress bar updates
- `subscribeToActivityFeed` → live activity feed inserts

---

## Deployment

### Expo EAS Build

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios     # or android / all
```

### Supabase
Already hosted. Configure connection pooling for production if needed.

### Clerk
Already hosted. Configure production instance and update keys.

---

## Design System

**Colors**: Two-tone violet/amber on a deep dark base. Tonal surface hierarchy following Material You conventions.

**Typography**:
- `Lexend` — display and headlines (expressive, large text)
- `Manrope` — body, labels, UI (clean, readable)

**Animations**:
- All buttons: spring scale on press (`react-native-reanimated`)
- Progress bars / rings: `withTiming` entrance on mount
- Cards: spring scale on press with subtle opacity shift
- Celebration screen: `withSequence` bounce on workout save
- Onboarding dots: interpolated width based on scroll position

**Glassmorphism**: `expo-blur` `BlurView` on iOS; semi-transparent fallback on Android.

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
#   S q u a d R u n  
 