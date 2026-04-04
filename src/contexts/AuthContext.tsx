// ─────────────────────────────────────────────────────────────
// AuthContext — bridges Clerk authentication with Supabase.
// After Clerk sign-in we upsert the user profile in Supabase
// so the rest of the app can use the Supabase user record.
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { usersApi, setTokenProvider } from "../services/supabase";
import type { User } from "../types";

interface AuthContextValue {
  clerkUser: ReturnType<typeof useUser>["user"];
  dbUser: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  refreshUser: () => Promise<void>;
  onboardingComplete: boolean;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSignedIn, getToken } = useClerkAuth();

  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const obKey = (id: string) => `sq_ob_${id}`;

  // After Clerk loads and user is signed in, upsert into Supabase
  useEffect(() => {
    if (!clerkLoaded) return;

    if (isSignedIn && clerkUser) {
      setTokenProvider(() => getToken({ template: "supabase" }));
      syncUser();
    } else {
      setTokenProvider(null);
      setDbUser(null);
      setIsLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkLoaded, isSignedIn, clerkUser?.id]);

  async function syncUser() {
    if (!clerkUser) return;
    try {
      // If a Supabase user already exists for this Clerk user, keep
      // their profile fields (display name, avatar, bio, etc.) as the
      // source of truth instead of overwriting from Clerk on every sync.
      // Only create the row from Clerk data if it doesn't exist yet.
      let data: User;
      try {
        data = await usersApi.getByClerkId(clerkUser.id);
      } catch (err) {
        data = await usersApi.upsert({
          clerk_id: clerkUser.id,
          display_name:
            clerkUser.fullName ??
            clerkUser.username ??
            clerkUser.emailAddresses[0]?.emailAddress ??
            "Squad Member",
          username:
            clerkUser.username ??
            clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ??
            clerkUser.id.slice(0, 8),
          avatar_url: clerkUser.imageUrl ?? null,
        });
      }
      setDbUser(data);
      const stored = await SecureStore.getItemAsync(obKey(clerkUser.id));
      setOnboardingComplete(stored === "true");
    } catch (err) {
      console.error("[AuthContext] Failed to sync user:", err);
    } finally {
      setIsLoaded(true);
    }
  }

  const completeOnboarding = async () => {
    if (clerkUser) {
      await SecureStore.setItemAsync(obKey(clerkUser.id), "true");
    }
    setOnboardingComplete(true);
  };

  const refreshUser = async () => {
    if (!clerkUser) return;
    try {
      const data = await usersApi.getByClerkId(clerkUser.id);
      setDbUser(data);
      const stored = await SecureStore.getItemAsync(obKey(clerkUser.id));
      setOnboardingComplete(stored === "true");
    } catch (err) {
      console.error("[AuthContext] Failed to refresh user:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        clerkUser,
        dbUser,
        isLoaded,
        isSignedIn: !!isSignedIn,
        refreshUser,
        onboardingComplete,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
