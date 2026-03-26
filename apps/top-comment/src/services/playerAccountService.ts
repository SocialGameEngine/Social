import { supabase } from '../supabase/client';

export interface PlayerAccount {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  player_level: number;
  total_games_played: number;
  total_wins: number;
  total_points: number;
  favorite_genres?: string[];
  preferred_difficulty: 'easy' | 'medium' | 'hard';
  notifications_enabled: boolean;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface PlayerAccountResponse {
  success: boolean;
  data?: PlayerAccount;
  error?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user_id?: string;
  message: string;
  account_type?: 'player' | 'venue' | 'user';
}

export class PlayerAccountService {
  // Get or create player account for a user
  static async getOrCreatePlayerAccount(
    userId: string,
    displayName?: string,
    avatarUrl?: string
  ): Promise<PlayerAccountResponse> {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_player_account', {
          p_user_id: userId,
          p_display_name: displayName,
          p_avatar_url: avatarUrl
        });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Failed to create player account' };
      }

      // Map database columns to PlayerAccount type
      const account: PlayerAccount = {
        id: data[0].account_id,
        user_id: data[0].account_user_id,
        display_name: data[0].account_display_name,
        player_level: data[0].account_player_level || 1,
        total_points: data[0].account_total_points || 0,
        total_games_played: data[0].account_total_games_played || 0,
        total_wins: data[0].account_total_wins || 0,
        avatar_url: data[0].account_avatar_url,
        favorite_genres: data[0].account_favorite_genres || [],
        preferred_difficulty: (data[0].account_preferred_difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        notifications_enabled: data[0].account_notifications_enabled ?? true,
        status: (data[0].account_status as 'active' | 'inactive' | 'suspended') || 'active',
        created_at: data[0].account_created_at,
        updated_at: data[0].account_updated_at,
        last_login_at: data[0].account_last_login_at,
      };
      return { success: true, data: account };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get player account info
  static async getPlayerAccountInfo(userId: string): Promise<PlayerAccountResponse> {
    try {
      const { data, error } = await supabase
        .rpc('get_player_account_info', {
          p_user_id: userId
        });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Player account not found' };
      }

      return { success: true, data: data[0] as PlayerAccount };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update player stats after a game
  static async updatePlayerStats(
    userId: string,
    gamesPlayed: number = 0,
    wins: number = 0,
    points: number = 0
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .rpc('update_player_stats', {
          p_user_id: userId,
          p_games_played: gamesPlayed,
          p_wins: wins,
          p_points: points
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if user is a player account
  static async isPlayerAccount(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_player_account', {
          p_user_id: userId
        });

      if (error) {
        console.error('Error checking player account:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking player account:', error);
      return false;
    }
  }

  // Check if user is a venue account
  static async isVenueAccount(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_venue_account', {
          p_user_id: userId
        });

      if (error) {
        console.error('Error checking venue account:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking venue account:', error);
      return false;
    }
  }

  // Get account type for a user
  static async getAccountType(userId: string): Promise<'player' | 'venue' | 'user'> {
    try {
      const { data, error } = await supabase
        .rpc('get_account_type', {
          p_user_id: userId
        });

      if (error) {
        console.error('Error getting account type:', error);
        return 'user';
      }

      return data as 'player' | 'venue' | 'user';
    } catch (error) {
      console.error('Error getting account type:', error);
      return 'user';
    }
  }

  // Authenticate player with account creation
  static async authenticatePlayer(
    email: string,
    password: string,
    displayName?: string,
    avatarUrl?: string
  ): Promise<AuthenticationResult> {
    try {
      // First authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        return { 
          success: false, 
          message: authError?.message || 'Authentication failed' 
        };
      }

      // Then check/create player account
      const accountResult = await this.getOrCreatePlayerAccount(
        authData.user.id,
        displayName || authData.user.email?.split('@')[0],
        avatarUrl
      );

      if (!accountResult.success) {
        return { 
          success: false, 
          message: accountResult.error || 'Failed to create player account' 
        };
      }

      return { 
        success: true, 
        user_id: authData.user.id, 
        message: 'Authentication successful',
        account_type: 'player'
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update player profile
  static async updatePlayerProfile(
    userId: string,
    updates: Partial<Omit<PlayerAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<PlayerAccountResponse> {
    try {
      const { data, error } = await supabase
        .from('player_accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as PlayerAccount };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get player leaderboard
  static async getPlayerLeaderboard(
    sortBy: 'total_wins' | 'total_points' = 'total_wins',
    limit: number = 10
  ): Promise<PlayerAccountResponse> {
    try {
      const { data, error } = await supabase
        .from('player_accounts')
        .select('*')
        .eq('status', 'active')
        .order(sortBy, { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as any };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Search for players by display name
  static async searchPlayers(
    query: string,
    limit: number = 20
  ): Promise<PlayerAccountResponse> {
    try {
      const { data, error } = await supabase
        .from('player_accounts')
        .select('*')
        .eq('status', 'active')
        .ilike('display_name', `%${query}%`)
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as any };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
