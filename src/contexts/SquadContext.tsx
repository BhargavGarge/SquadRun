// ─────────────────────────────────────────────────────────────
// SquadContext — Zustand store for squad-level state.
// Active squad, goal, workouts, activity feed, and real-time
// subscription teardowns all live here.
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import {
  squadsApi,
  goalsApi,
  workoutsApi,
  activityApi,
  subscribeToSquadWorkouts,
  subscribeToActivityFeed,
} from '../services/supabase';
import type { Squad, Goal, Workout, ActivityItem } from '../types';

interface SquadState {
  // All squads the current user belongs to
  squads: Squad[];
  squadsLoading: boolean;

  // Currently selected / active squad
  activeSquad: Squad | null;
  activeGoal: Goal | null;
  goalProgress: number; // 0–100

  // Squad workouts feed
  workouts: Workout[];
  workoutsLoading: boolean;

  // Activity feed
  activity: ActivityItem[];
  activityLoading: boolean;

  // Real-time unsub functions
  _unsubWorkouts: (() => void) | null;
  _unsubActivity: (() => void) | null;

  // Actions
  loadSquads: (userId: string) => Promise<void>;
  selectSquad: (squad: Squad) => Promise<void>;
  createSquad: (
    name: string,
    description: string,
    ownerId: string
  ) => Promise<Squad>;
  joinSquad: (inviteCode: string, userId: string) => Promise<void>;
  refreshGoal: () => Promise<void>;
  addWorkout: (workout: Workout) => void;
  addActivity: (item: ActivityItem) => void;
  clearSquad: () => void;
}

export const useSquadStore = create<SquadState>((set, get) => ({
  squads: [],
  squadsLoading: false,
  activeSquad: null,
  activeGoal: null,
  goalProgress: 0,
  workouts: [],
  workoutsLoading: false,
  activity: [],
  activityLoading: false,
  _unsubWorkouts: null,
  _unsubActivity: null,

  // ── Load all squads for a user ──────────────────────────────
  loadSquads: async (userId) => {
    set({ squadsLoading: true });
    try {
      const squads = await squadsApi.getByUser(userId);
      set({ squads, squadsLoading: false });
    } catch (err) {
      console.error('[SquadContext] loadSquads:', err);
      set({ squadsLoading: false });
    }
  },

  // ── Select a squad and load its goal + workouts + activity ──
  selectSquad: async (squad) => {
    // Tear down previous subscriptions
    get()._unsubWorkouts?.();
    get()._unsubActivity?.();

    set({
      activeSquad: squad,
      workouts: [],
      activity: [],
      activeGoal: null,
      goalProgress: 0,
      workoutsLoading: true,
      activityLoading: true,
    });

    try {
      // Load full squad detail (members)
      const detail = await squadsApi.getById(squad.id);
      set({ activeSquad: detail });

      // Load active goal
      const goal = await goalsApi.getActiveGoal(squad.id);
      if (goal) {
        await computeGoalProgress(goal);
      }

      // Load recent workouts
      const workouts = await workoutsApi.getBySquad(squad.id);
      set({ workouts, workoutsLoading: false });

      // Load activity feed
      const activity = await activityApi.getBySquad(squad.id);
      set({ activity, activityLoading: false });

      // Subscribe to real-time updates
      const unsubWorkouts = subscribeToSquadWorkouts(squad.id, (w) => {
        get().addWorkout(w);
        // Recompute progress if tied to active goal
        const ag = get().activeGoal;
        if (ag && w.goal_id === ag.id) {
          computeGoalProgress(ag);
        }
      });

      const unsubActivity = subscribeToActivityFeed(squad.id, (item) => {
        get().addActivity(item);
      });

      set({ _unsubWorkouts: unsubWorkouts, _unsubActivity: unsubActivity });
    } catch (err) {
      console.error('[SquadContext] selectSquad:', err);
      set({ workoutsLoading: false, activityLoading: false });
    }
  },

  // ── Create a new squad and auto-join as owner ───────────────
  createSquad: async (name, description, ownerId) => {
    const squad = await squadsApi.create({ name, description, owner_id: ownerId });
    // Add owner as a member automatically
    await squadsApi.addMember(squad.id, ownerId, 'admin');
    set((s) => ({ squads: [squad, ...s.squads] }));
    return squad;
  },

  // ── Join a squad via invite code ────────────────────────────
  joinSquad: async (inviteCode, userId) => {
    const member = await squadsApi.joinByCode(inviteCode, userId);
    const squad = await squadsApi.getById(member.squad_id);
    set((s) => ({ squads: [squad, ...s.squads] }));
  },

  // ── Refresh goal progress ───────────────────────────────────
  refreshGoal: async () => {
    const squad = get().activeSquad;
    if (!squad) return;
    const goal = await goalsApi.getActiveGoal(squad.id);
    if (goal) await computeGoalProgress(goal);
  },

  // ── Add a newly received real-time workout ──────────────────
  addWorkout: (workout) =>
    set((s) => ({ workouts: [workout, ...s.workouts] })),

  // ── Add a newly received real-time activity item ────────────
  addActivity: (item) =>
    set((s) => ({ activity: [item, ...s.activity] })),

  // ── Clear state on sign-out ─────────────────────────────────
  clearSquad: () => {
    get()._unsubWorkouts?.();
    get()._unsubActivity?.();
    set({
      squads: [],
      activeSquad: null,
      activeGoal: null,
      goalProgress: 0,
      workouts: [],
      activity: [],
      _unsubWorkouts: null,
      _unsubActivity: null,
    });
  },
}));

// ─── Helpers ─────────────────────────────────────────────────

async function computeGoalProgress(goal: Goal) {
  try {
    const rows = await goalsApi.getProgress(goal.id);
    let total = 0;

    for (const row of rows) {
      // Sum the metric matching the goal unit
      if (goal.unit === 'km' && row.distance_km) total += row.distance_km;
      else if (goal.unit === 'hours' && row.duration_minutes)
        total += row.duration_minutes / 60;
      else if (goal.unit === 'calories' && row.calories) total += row.calories;
      else if (goal.unit === 'sessions') total += 1;
    }

    const pct = Math.min((total / goal.target_value) * 100, 100);
    useSquadStore.setState({
      activeGoal: { ...goal, current_value: total, progress_percent: pct },
      goalProgress: pct,
    });
  } catch (err) {
    console.error('[SquadContext] computeGoalProgress:', err);
  }
}
