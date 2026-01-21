/**
 * Shared venue account types for consistent typing across the codebase
 * Based on the actual database schema
 */

export interface VenueAccountRow {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'bar_owner' | 'staff';
  avatar_url: string | null;
  created_at: string;
  last_active_at: string;
  is_active: boolean;
}

export interface VenueAccount {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: 'bar_owner' | 'staff';
  avatarUrl?: string | null;
  createdAt: string;
  lastActiveAt: string;
  isActive: boolean;
}

export function mapVenueAccount(row: VenueAccountRow): VenueAccount {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
    isActive: row.is_active,
  };
}

export interface VenueStaffRow {
  id: string;
  venue_account_id: string;
  venue_id: string;
  role: 'owner' | 'manager' | 'staff';
  permissions: Record<string, boolean>;
  hired_at: string;
}

export interface VenueStaff {
  id: string;
  venueAccountId: string;
  venueId: string;
  role: 'owner' | 'manager' | 'staff';
  permissions: Record<string, boolean>;
  hiredAt: string;
}

export function mapVenueStaff(row: VenueStaffRow): VenueStaff {
  return {
    id: row.id,
    venueAccountId: row.venue_account_id,
    venueId: row.venue_id,
    role: row.role,
    permissions: row.permissions,
    hiredAt: row.hired_at,
  };
}
