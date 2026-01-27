import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface VenueAccount {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: "bar_owner" | "staff";
  avatarUrl?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
  isActive: boolean;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  venueAccount: VenueAccount | null;
  venueAccountLoading: boolean;
  refreshVenueAccount: () => Promise<VenueAccount | null>;
  isVenueAccount: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  isGuest: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
