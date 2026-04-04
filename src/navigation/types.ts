// ─────────────────────────────────────────────────────────────
// Navigation param-list types
// ─────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Squads: undefined;
  Log: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type SquadStackParamList = {
  SquadList: undefined;
  SquadDetail: { squadId: string };
  CreateSquad: undefined;
  JoinSquad: undefined;
  GoalDetail: { goalId: string; squadId: string };
  CreateGoal: { squadId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Badges: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  LogWorkout: {
    squadId?: string;
    goalId?: string;
    prefill?: {
      type?: string;
      distance_km?: number;
      duration_minutes?: number;
      steps?: number;
      route_coords?: { latitude: number; longitude: number; timestamp?: number }[];
    };
  };
  ActiveWorkout: { type?: string; squadId?: string; goalId?: string };
  SquadDetail: { squadId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};
