# SquadRun ⚡

A modern **fitness accountability app for small private squads** (3–6 people).

Think **Strava**, but focused on **tight social motivation instead of follower counts**.

Log workouts, contribute to shared goals, and stay accountable with your squad through **real-time progress, leaderboards, and activity feeds**.

Built with **React Native + Expo**, **Clerk authentication**, and **Supabase realtime infrastructure**.

---

# ✨ Features

### 🏃 Squad Accountability

Create private squads with a few friends and work toward shared fitness goals together.

### 🎯 Shared Goals

Set squad goals like:

* Distance
* Workout sessions
* Time trained
* Calories burned

Every workout automatically contributes toward the goal.

### 📊 Live Progress Tracking

Progress updates instantly for everyone in the squad using **Supabase Realtime**.

### 🥇 Leaderboards

See who’s contributing the most with animated leaderboard bars.

### 🧾 Activity Feed

Stay motivated with a live feed showing:

* Workouts logged
* Members joining
* Goals completed

### 📱 Push Notifications

Receive local push notifications when squad members log workouts.

### ⚡ Beautiful UI

The app includes:

* Glassmorphic cards
* Gradient progress bars
* Animated buttons
* Smooth Reanimated transitions
* Custom typography system

---

# 🧱 Tech Stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Framework        | React Native (Expo SDK 51)       |
| Authentication   | Clerk                            |
| Backend          | Supabase (PostgreSQL + Realtime) |
| Navigation       | React Navigation v6              |
| State Management | Zustand                          |
| Animations       | React Native Reanimated 3        |
| UI Effects       | Expo BlurView + Linear Gradient  |
| Notifications    | Expo Notifications               |
| Fonts            | Lexend + Manrope                 |

---

# 📁 Project Structure

```
SquadRun/
│
├── App.tsx
├── index.js
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
│
├── src/
│
│   ├── types/
│   │   └── index.ts
│
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│
│   ├── services/
│   │   ├── supabase.ts
│   │   └── notifications.ts
│
│   ├── contexts/
│   │   ├── ThemeContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── SquadContext.tsx
│
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│
│   ├── components/
│   │
│   │   ├── common/
│   │   │   ├── GlassCard.tsx
│   │   │   ├── GradientButton.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── AnimatedProgressBar.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Chip.tsx
│   │   │   └── Input.tsx
│   │
│   │   ├── squad/
│   │   │   ├── SquadCard.tsx
│   │   │   ├── MemberRow.tsx
│   │   │   └── ActivityFeedItem.tsx
│   │
│   │   └── workout/
│   │       └── WorkoutCard.tsx
│
│   ├── screens/
│   │
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── SignInScreen.tsx
│   │   │   ├── SignUpScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │
│   │   ├── squad/
│   │   │   ├── SquadListScreen.tsx
│   │   │   ├── SquadDetailScreen.tsx
│   │   │   ├── CreateSquadScreen.tsx
│   │   │   └── JoinSquadScreen.tsx
│   │
│   │   ├── goals/
│   │   │   └── CreateGoalScreen.tsx
│   │
│   │   ├── workout/
│   │   │   └── LogWorkoutScreen.tsx
│   │
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│
│   └── utils/
│       ├── helpers.ts
│       └── sampleData.ts
│
└── supabase/
    ├── migrations/
    │   └── 001_initial.sql
    └── seed.sql
```

---

# 🚀 Quick Start

## 1. Install Dependencies

```
git clone https://github.com/yourusername/squadrun.git

cd squadrun

npm install
```

---

# 🔑 Environment Variables

Create a `.env` file.

```
cp .env.example .env
```

Add your keys:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

---

# 🗄 Supabase Setup

1. Create a new project at
   https://supabase.com

2. Run the migration:

```
supabase/migrations/001_initial.sql
```

3. (Optional) seed the database:

```
supabase/seed.sql
```

4. Enable realtime for tables:

* workouts
* activity_feed
* goals
* notifications

---

# 🔐 Clerk Authentication Setup

1. Create a Clerk application

https://clerk.com

2. Enable **Email + Password authentication**

3. Copy the **Publishable Key**

4. Create a **Supabase JWT template**

5. Paste the Clerk JWKS endpoint into Supabase → Auth → JWT settings.

This allows Supabase to verify Clerk tokens for **RLS policies**.

---

# ▶️ Running the App

Start the Expo dev server:

```
npm start
```

Run on iOS:

```
npm run ios
```

Run on Android:

```
npm run android
```

---

# 🔄 Real-Time Updates

The app uses **Supabase subscriptions** for live updates:

* `subscribeToSquadWorkouts`
* `subscribeToActivityFeed`
* `subscribeToGoalProgress`

This allows:

* instant leaderboard updates
* live activity feed
* real-time goal progress

---

# 🎨 Design System

### Colors

Deep dark base with **violet + amber accents**.

### Typography

**Lexend**
Used for:

* Headlines
* Display text

**Manrope**
Used for:

* UI
* Labels
* Body text

### Animation System

All animations use **React Native Reanimated 3**.

Examples:

* Button press spring scale
* Animated progress bars
* Goal completion celebration
* Onboarding transitions

---

# 📦 Deployment

### Expo EAS

```
npm install -g eas-cli

eas login
eas build:configure

eas build --platform ios
eas build --platform android
```

---

# 🧠 Philosophy

Most fitness apps optimize for **followers and content**.

SquadRun focuses on something simpler:

**Accountability with a few close people.**

Small squads.
Shared goals.
Consistent progress.

---

# 📄 License

MIT License

---

# 👨‍💻 Author

Built with ❤️ using React Native, Supabase, and Clerk.
