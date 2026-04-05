// ─────────────────────────────────────────────────────────────
// Supabase client — singleton instance
// Uses expo-secure-store for secure token storage on device
// ─────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Custom storage adapter using expo-secure-store
// Supabase client will use this to persist the auth session securely
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "";

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}
console.log("SUPABASE URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);

// Returns a one-off client authenticated with a Clerk JWT.
// Use this for operations that need RLS to recognise the user.
export function createAuthedClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

// Module-level token provider — set by AuthContext once Clerk is ready.
// All API helpers call getClient() so every request carries the Clerk JWT.
let _tokenProvider: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: (() => Promise<string | null>) | null) {
  _tokenProvider = fn;
}

async function getClient() {
  if (_tokenProvider) {
    const token = await _tokenProvider();
    if (token) return createAuthedClient(token);
  }
  return supabase;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Typed query helpers ─────────────────────────────────────

import type {
  User,
  Squad,
  SquadMember,
  Goal,
  Workout,
  ActivityItem,
  AppNotification,
} from "../types";

// ── Users ────────────────────────────────────────────────────

export const usersApi = {
  async upsert(user: Partial<User> & { clerk_id: string }) {
    const db = await getClient();
    const { data, error } = await db
      .from("users")
      .upsert(user, { onConflict: "clerk_id" })
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async getByClerkId(clerkId: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("clerk_id", clerkId)
      .single();
    if (error) throw error;
    return data as User;
  },

  async update(id: string, updates: Partial<User>) {
    const db = await getClient();
    const { data, error } = await db
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },
};

// ── Squads ───────────────────────────────────────────────────

export const squadsApi = {
  async create(payload: {
    name: string;
    description?: string;
    owner_id: string;
    max_members?: number;
  }) {
    const db = await getClient();
    // Generate a random 6-char invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await db
      .from("squads")
      .insert({
        ...payload,
        invite_code: code,
        max_members: payload.max_members ?? 6,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Squad;
  },

  async getByUser(userId: string) {
    const db = await getClient();
    // Get all squads where user is a member
    const { data, error } = await db
      .from("squad_members")
      .select(`squad:squads(*)`)
      .eq("user_id", userId);
    if (error) throw error;
    return (data?.map((row: any) => row.squad) ?? []) as Squad[];
  },

  async getById(squadId: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("squads")
      .select(`*, members:squad_members(*, user:users(*))`)
      .eq("id", squadId)
      .single();
    if (error) throw error;
    return data as Squad;
  },

  async getByInviteCode(code: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("squads")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .single();
    if (error) throw error;
    return data as Squad;
  },

  async joinByCode(code: string, userId: string) {
    const squad = await squadsApi.getByInviteCode(code);
    const db = await getClient();
    const { data, error } = await db
      .from("squad_members")
      .insert({ squad_id: squad.id, user_id: userId, role: "member" })
      .select()
      .single();
    if (error) throw error;
    return data as SquadMember;
  },

  async addMember(
    squadId: string,
    userId: string,
    role: "member" | "admin" = "member",
  ) {
    const db = await getClient();
    const { data, error } = await db
      .from("squad_members")
      .insert({ squad_id: squadId, user_id: userId, role })
      .select()
      .single();
    if (error) throw error;
    return data as SquadMember;
  },

  async removeMember(squadId: string, userId: string) {
    const db = await getClient();
    const { error } = await db
      .from("squad_members")
      .delete()
      .eq("squad_id", squadId)
      .eq("user_id", userId);
    if (error) throw error;
  },
};

// ── Goals ────────────────────────────────────────────────────

export const goalsApi = {
  async create(
    payload: Omit<
      Goal,
      "id" | "status" | "created_at" | "current_value" | "progress_percent"
    >,
  ) {
    const db = await getClient();
    const { data, error } = await db
      .from("goals")
      .insert({ ...payload, status: "active" })
      .select()
      .single();
    if (error) throw error;
    return data as Goal;
  },

  async getBySquad(squadId: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("goals")
      .select("*")
      .eq("squad_id", squadId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Goal[];
  },

  async getActiveGoal(squadId: string) {
    const db = await getClient();
    const now = new Date().toISOString();
    const { data, error } = await db
      .from("goals")
      .select("*")
      .eq("squad_id", squadId)
      .eq("status", "active")
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as Goal | null;
  },

  // Compute total progress by summing workout contributions
  async getProgress(goalId: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("workouts")
      .select("distance_km, duration_minutes, calories")
      .eq("goal_id", goalId);
    if (error) throw error;
    return data ?? [];
  },
};

// ── Workouts ─────────────────────────────────────────────────

export const workoutsApi = {
  async log(payload: Omit<Workout, "id" | "created_at" | "user">) {
    const db = await getClient();
    const { data, error } = await db
      .from("workouts")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Workout;
  },

  async getBySquad(squadId: string, limit = 30) {
    const db = await getClient();
    const { data, error } = await db
      .from("workouts")
      .select("*, user:users(*)")
      .eq("squad_id", squadId)
      .order("logged_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Workout[];
  },

  async getByUser(userId: string, limit = 20) {
    const db = await getClient();
    const { data, error } = await db
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Workout[];
  },

  async getMemberContributions(goalId: string) {
    const db = await getClient();
    // Returns sum per user_id for the goal
    const { data, error } = await db
      .from("workouts")
      .select(
        "user_id, distance_km, duration_minutes, calories, user:users(display_name, avatar_url)",
      )
      .eq("goal_id", goalId);
    if (error) throw error;
    return data ?? [];
  },
};

// ── Activity Feed ─────────────────────────────────────────────

export const activityApi = {
  async getBySquad(squadId: string, limit = 20) {
    const db = await getClient();
    const { data, error } = await db
      .from("activity_feed")
      .select("*, user:users(*)")
      .eq("squad_id", squadId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as ActivityItem[];
  },

  async insert(
    item: Omit<ActivityItem, "id" | "created_at" | "user" | "workout">,
  ) {
    const db = await getClient();
    const { data, error } = await db
      .from("activity_feed")
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data as ActivityItem;
  },
};

// ── Notifications ────────────────────────────────────────────

export const notificationsApi = {
  async getByUser(userId: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data as AppNotification[];
  },

  async markRead(notificationId: string) {
    const db = await getClient();
    const { error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    if (error) throw error;
  },

  async markAllRead(userId: string) {
    const db = await getClient();
    const { error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
  },
};

// ── Storage ──────────────────────────────────────────────────

export const storageApi = {
  /**
   * Upload a local image URI to the `avatars` Supabase storage bucket.
   * Returns the permanent public URL — safe to persist in the DB.
   *
   * @param clerkUserId - The Clerk user ID (auth.uid() in storage RLS).
   *   Must match the folder name so RLS `(storage.foldername(name))[1] = auth.uid()` passes.
   */
  async uploadAvatar(clerkUserId: string, localUri: string): Promise<string> {
    const db = await getClient();

    // Fetch the file as a blob so we can upload it
    const response = await fetch(localUri);
    const blob = await response.blob();

    const ext = localUri.split('.').pop()?.toLowerCase()?.replace(/\?.*$/, '') ?? 'jpg';
    // Folder = Clerk user ID so it matches auth.uid() in storage RLS policies
    const filePath = `${clerkUserId}/avatar.${ext}`;

    const { error } = await db.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data } = db.storage.from('avatars').getPublicUrl(filePath);
    // Cache-bust so the new avatar appears immediately
    return `${data.publicUrl}?t=${Date.now()}`;
  },
};

// ── Notification helpers ──────────────────────────────────────

/**
 * Insert in-app notifications for every squad member except the actor.
 * Fire-and-forget safe — call without awaiting to avoid blocking UI.
 */
export async function notifySquadMembers(
  squadId: string,
  actorId: string,
  kind: import('../types').NotificationKind,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const db = await getClient();

  // Fetch all other members of this squad
  const { data: members, error } = await db
    .from('squad_members')
    .select('user_id')
    .eq('squad_id', squadId)
    .neq('user_id', actorId);

  if (error || !members?.length) return;

  const rows = members.map((m: { user_id: string }) => ({
    user_id: m.user_id,
    kind,
    title,
    body,
    data,
    read: false,
  }));

  await db.from('notifications').insert(rows);
}

// ── Real-time subscriptions ───────────────────────────────────

/**
 * Subscribe to squad workout updates (real-time progress bar).
 * Returns an unsubscribe function to call on cleanup.
 */
export function subscribeToSquadWorkouts(
  squadId: string,
  onInsert: (workout: Workout) => void,
) {
  const channel = supabase
    .channel(`squad-workouts-${squadId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "workouts",
        filter: `squad_id=eq.${squadId}`,
      },
      (payload) => onInsert(payload.new as Workout),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to squad activity feed (new entries).
 */
export function subscribeToActivityFeed(
  squadId: string,
  onInsert: (item: ActivityItem) => void,
) {
  const channel = supabase
    .channel(`activity-feed-${squadId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "activity_feed",
        filter: `squad_id=eq.${squadId}`,
      },
      (payload) => onInsert(payload.new as ActivityItem),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
