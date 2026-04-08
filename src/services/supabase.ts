// ─────────────────────────────────────────────────────────────
// Supabase client — singleton instance
// Uses expo-secure-store for secure token storage on device
// ─────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

// Fallback config for development — mirrors app.json but committed as config.json
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appConfig = require("../../config.json");

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

// ── Notification helpers ──────────────────────────────────────

// Small helper to convert base64 strings to ArrayBuffer for React Native uploads
const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const len = clean.length;
  if (!len) return new ArrayBuffer(0);

  let padding = 0;
  if (clean.endsWith("==")) padding = 2;
  else if (clean.endsWith("=")) padding = 1;

  const bytesLength = (len * 3) / 4 - padding;
  const buffer = new ArrayBuffer(bytesLength);
  const bytes = new Uint8Array(buffer);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = BASE64_CHARS.indexOf(clean[i]);
    const enc2 = BASE64_CHARS.indexOf(clean[i + 1]);
    const enc3 = BASE64_CHARS.indexOf(clean[i + 2]);
    const enc4 = BASE64_CHARS.indexOf(clean[i + 3]);

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes[p++] = chr1;
    if (clean[i + 2] !== "=" && enc3 !== 64) {
      bytes[p++] = chr2;
    }
    if (clean[i + 3] !== "=" && enc4 !== 64) {
      bytes[p++] = chr3;
    }
  }

  return buffer;
}

function getImageContentType(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === "jpg" || lower === "jpeg") return "image/jpeg";
  if (lower === "png") return "image/png";
  if (lower === "webp") return "image/webp";
  if (lower === "heic" || lower === "heif") return "image/heic";
  return "application/octet-stream";
}

// ─── Supabase singleton + Clerk bridge ──────────────────────

type TokenProvider = (() => Promise<string | null>) | null;

let tokenProvider: TokenProvider = null;

export function setTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

const expoExtra: any =
  // Newer Expo Runtime (EAS, dev client)
  (Constants as any).expoConfig?.extra ??
  // Classic manifest (Expo Go)
  (Constants as any).manifest?.extra ??
  // Local config.json fallback
  (appConfig as any)?.expo?.extra ??
  {};

const supabaseUrl: string | undefined =
  expoExtra.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined =
  expoExtra.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this non-fatal so the app can still render error boundaries
  console.warn(
    "[supabase] Missing supabaseUrl/supabaseAnonKey in Expo config extra — Supabase calls will fail until configured.",
  );
}

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Clerk is the source of truth for auth; we just forward its JWT.
          persistSession: false,
        },
        global: {
          fetch: async (input, init) => {
            const headers = new Headers(init?.headers ?? {});

            if (tokenProvider) {
              try {
                const token = await tokenProvider();
                if (token) {
                  headers.set("Authorization", `Bearer ${token}`);
                }
              } catch {
                // Ignore token retrieval errors — request will just be unauthenticated.
              }
            }

            return fetch(input as any, { ...(init ?? {}), headers });
          },
        },
      })
    : (null as any);

async function getClient() {
  if (!supabase) {
    throw new Error(
      "Supabase client is not configured. Check supabaseUrl/supabaseAnonKey in config.json.",
    );
  }
  return supabase;
}

// ─── Typed query helpers ─────────────────────────────────────

import type {
  User,
  Squad,
  SquadMember,
  Goal,
  Workout,
  ActivityItem,
  AppNotification,
  WorkoutComment,
  WorkoutLike,
  LiveLocation,
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

  async getById(workoutId: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("workouts")
      .select("*, user:users(*)")
      .eq("id", workoutId)
      .single();
    if (error) throw error;
    return data as Workout;
  },

  async saveSegments(
    workoutId: string,
    userId: string,
    segments: Array<{
      distanceKm: number;
      startLat: number;
      startLon: number;
      endLat: number;
      endLon: number;
      durationSeconds: number;
      paceMinPerKm: number;
    }>,
  ) {
    const db = await getClient();
    const rows = segments.map((seg) => ({
      workout_id: workoutId,
      user_id: userId,
      distance_km: seg.distanceKm,
      start_lat: seg.startLat,
      start_lon: seg.startLon,
      end_lat: seg.endLat,
      end_lon: seg.endLon,
      duration_seconds: seg.durationSeconds,
      pace_min_per_km: seg.paceMinPerKm,
    }));

    const { error } = await db.from("workout_segments").insert(rows);
    if (error) throw error;
  },

  async getSegmentPR(
    userId: string,
    distanceKm: number,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
  ) {
    const db = await getClient();
    // Fetch all segments of this distance for this user within geographic bounds
    const latThreshold = 0.01; // ~1 km in latitude
    const lonThreshold = 0.01; // ~1 km in longitude

    const { data, error } = await db
      .from("workout_segments")
      .select("*")
      .eq("user_id", userId)
      .eq("distance_km", distanceKm)
      .gte("start_lat", startLat - latThreshold)
      .lte("start_lat", startLat + latThreshold)
      .gte("start_lon", startLon - lonThreshold)
      .lte("start_lon", startLon + lonThreshold)
      .gte("end_lat", endLat - latThreshold)
      .lte("end_lat", endLat + latThreshold)
      .gte("end_lon", endLon - lonThreshold)
      .lte("end_lon", endLon + lonThreshold)
      .order("pace_min_per_km", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data; // Returns the best (fastest) segment, or null if none exists
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

  async getUserStats(userId: string, startDate?: string, endDate?: string) {
    const db = await getClient();
    let query = db
      .from("workouts")
      .select("*, user:users(*)")
      .eq("user_id", userId);

    if (startDate) {
      query = query.gte("logged_at", startDate);
    }
    if (endDate) {
      query = query.lte("logged_at", endDate);
    }

    const { data, error } = await query.order("logged_at", {
      ascending: false,
    });
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

    const ext =
      localUri.split(".").pop()?.toLowerCase()?.replace(/\?.*$/, "") ?? "jpg";
    const contentType = getImageContentType(ext);
    // Folder = Clerk user ID so it matches auth.uid() in storage RLS policies
    const filePath = `${clerkUserId}/avatar.${ext}`;

    let error;
    if (localUri.startsWith("file:") && Platform.OS !== "web") {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: "base64" as any,
      });
      const arrayBuffer = base64ToArrayBuffer(base64);
      ({ error } = await db.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        }));
    } else {
      const response = await fetch(localUri);
      const blob = await response.blob();
      ({ error } = await db.storage.from("avatars").upload(filePath, blob, {
        contentType: (blob as any).type || contentType,
        upsert: true,
      }));
    }

    if (error) throw error;

    const { data } = db.storage.from("avatars").getPublicUrl(filePath);
    // Cache-bust so the new avatar appears immediately
    return `${data.publicUrl}?t=${Date.now()}`;
  },

  /**
   * Upload a workout photo to the `workout-photos` bucket.
   * Path is namespaced by Clerk user ID so storage RLS can match auth.uid().
   */
  async uploadWorkoutPhoto(
    clerkUserId: string,
    localUri: string,
  ): Promise<string> {
    const db = await getClient();
    const ext =
      localUri.split(".").pop()?.toLowerCase()?.replace(/\?.*$/, "") ?? "jpg";
    const contentType = getImageContentType(ext);
    const filename = `${Date.now()}.${ext}`;
    const filePath = `${clerkUserId}/${filename}`;

    let error;
    if (localUri.startsWith("file:") && Platform.OS !== "web") {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: "base64" as any,
      });
      const arrayBuffer = base64ToArrayBuffer(base64);
      ({ error } = await db.storage
        .from("workout-photos")
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        }));
    } else {
      const response = await fetch(localUri);
      const blob = await response.blob();
      ({ error } = await db.storage
        .from("workout-photos")
        .upload(filePath, blob, {
          contentType: (blob as any).type || contentType,
          upsert: true,
        }));
    }

    if (error) throw error;

    const { data } = db.storage.from("workout-photos").getPublicUrl(filePath);
    return `${data.publicUrl}?t=${Date.now()}`;
  },
};

// ── Workout Social (comments, likes) ────────────────────────

export const workoutSocialApi = {
  async getSummary(workoutId: string, userId?: string) {
    const db = await getClient();

    const [{ count: likesCount }, { count: commentsCount }] = await Promise.all(
      [
        db
          .from("workout_likes")
          .select("*", { count: "exact", head: true })
          .eq("workout_id", workoutId),
        db
          .from("workout_comments")
          .select("*", { count: "exact", head: true })
          .eq("workout_id", workoutId),
      ],
    );

    let isLikedByMe = false;
    if (userId) {
      const { data: like } = await db
        .from("workout_likes")
        .select("id")
        .eq("workout_id", workoutId)
        .eq("user_id", userId)
        .maybeSingle();
      isLikedByMe = !!like;
    }

    return {
      likesCount: likesCount ?? 0,
      commentsCount: commentsCount ?? 0,
      isLikedByMe,
    };
  },

  async getComments(workoutId: string): Promise<WorkoutComment[]> {
    const db = await getClient();
    const { data, error } = await db
      .from("workout_comments")
      .select("*, user:users(*)")
      .eq("workout_id", workoutId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as any as WorkoutComment[];
  },

  async addComment(
    workoutId: string,
    userId: string,
    body: string,
  ): Promise<WorkoutComment> {
    const db = await getClient();
    const { data, error } = await db
      .from("workout_comments")
      .insert({ workout_id: workoutId, user_id: userId, body })
      .select("*, user:users(*)")
      .single();
    if (error) throw error;
    return data as any as WorkoutComment;
  },

  async deleteComment(commentId: string) {
    const db = await getClient();
    const { error } = await db
      .from("workout_comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
  },

  async like(workoutId: string, userId: string): Promise<WorkoutLike> {
    const db = await getClient();
    const { data, error } = await db
      .from("workout_likes")
      .upsert(
        { workout_id: workoutId, user_id: userId },
        {
          onConflict: "workout_id,user_id",
        },
      )
      .select()
      .single();
    if (error) throw error;
    return data as WorkoutLike;
  },

  async unlike(workoutId: string, userId: string) {
    const db = await getClient();
    const { error } = await db
      .from("workout_likes")
      .delete()
      .eq("workout_id", workoutId)
      .eq("user_id", userId);
    if (error) throw error;
  },
};

// ── Live squad locations (GPS sync) ─────────────────────────

export const liveLocationApi = {
  async upsertLocation(params: {
    userId: string;
    squadId: string;
    workoutId?: string | null;
    lat: number;
    lon: number;
    heading?: number | null;
    speedMps?: number | null;
  }): Promise<LiveLocation> {
    const db = await getClient();
    const { data, error } = await db
      .from("live_locations")
      .upsert(
        {
          user_id: params.userId,
          squad_id: params.squadId,
          workout_id: params.workoutId ?? null,
          lat: params.lat,
          lon: params.lon,
          heading: params.heading ?? null,
          speed_mps: params.speedMps ?? null,
        },
        { onConflict: "user_id,squad_id" },
      )
      .select("*, user:users(*)")
      .single();

    if (error) throw error;
    return data as any as LiveLocation;
  },

  async clearForUser(userId: string, squadId?: string) {
    const db = await getClient();
    let query = db.from("live_locations").delete().eq("user_id", userId);
    if (squadId) query = query.eq("squad_id", squadId);
    const { error } = await query;
    if (error) throw error;
  },

  async getBySquad(squadId: string): Promise<LiveLocation[]> {
    const db = await getClient();
    const { data, error } = await db
      .from("live_locations")
      .select("*, user:users(*)")
      .eq("squad_id", squadId);
    if (error) throw error;
    return data as any as LiveLocation[];
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
  kind: import("../types").NotificationKind,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const db = await getClient();

  // Fetch all other members of this squad
  const { data: members, error } = await db
    .from("squad_members")
    .select("user_id")
    .eq("squad_id", squadId)
    .neq("user_id", actorId);

  if (error || !members?.length) return;

  const rows = members.map((m: { user_id: string }) => ({
    user_id: m.user_id,
    kind,
    title,
    body,
    data,
    read: false,
  }));

  await db.from("notifications").insert(rows);
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
      (payload: any) => onInsert(payload.new as Workout),
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
      (payload: any) => onInsert(payload.new as ActivityItem),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to live squad GPS locations for a squad.
 * Emits on both INSERT and UPDATE; optionally on DELETE.
 */
export function subscribeToLiveLocations(
  squadId: string,
  onUpsert: (loc: LiveLocation) => void,
  onDelete?: (id: string) => void,
) {
  const channel = supabase
    .channel(`live-locations-${squadId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "live_locations",
        filter: `squad_id=eq.${squadId}`,
      },
      (payload: any) => onUpsert(payload.new as LiveLocation),
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "live_locations",
        filter: `squad_id=eq.${squadId}`,
      },
      (payload: any) => onUpsert(payload.new as LiveLocation),
    );

  if (onDelete) {
    channel.on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "live_locations",
        filter: `squad_id=eq.${squadId}`,
      },
      (payload: any) => onDelete((payload.old as any).id as string),
    );
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
