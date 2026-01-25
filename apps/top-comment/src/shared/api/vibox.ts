/**
 * VIBox API - Edge Function Wrappers
 * Provides type-safe methods to interact with VIBox edge functions
 */

import { supabase } from '../../supabase/client';
import type { ViboxQueueItem, ViboxQueueInsert } from '../types/vibox';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, any>
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      console.error(`Error invoking ${functionName}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }

    return {
      success: true,
      data: data as T,
      message: data?.message,
    };
  } catch (error) {
    console.error(`Exception invoking ${functionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const viboxApi = {
  /**
   * Get the current queue of unplayed tracks
   */
  async getQueue(): Promise<ApiResponse<{ queue: ViboxQueueItem[]; count: number }>> {
    return invokeFunction('vibox-get-queue');
  },

  /**
   * Add a track to the queue
   */
  async addToQueue(track: ViboxQueueInsert): Promise<ApiResponse<{ queueItem: ViboxQueueItem }>> {
    return invokeFunction('vibox-add-to-queue', track);
  },

  /**
   * Remove a track from the queue
   */
  async removeFromQueue(queueItemId: string): Promise<ApiResponse<void>> {
    return invokeFunction('vibox-remove-from-queue', {
      queue_item_id: queueItemId,
    });
  },

  /**
   * Clear all unplayed tracks from the queue
   */
  async clearQueue(): Promise<ApiResponse<{ clearedCount: number }>> {
    return invokeFunction('vibox-clear-queue');
  },

  /**
   * Mark a track as played
   */
  async markPlayed(
    queueItemId: string,
    options?: {
      play_duration?: number;
      completion_percentage?: number;
      was_skipped?: boolean;
    }
  ): Promise<ApiResponse<{ queueItem: ViboxQueueItem }>> {
    return invokeFunction('vibox-mark-played', {
      queue_item_id: queueItemId,
      ...options,
    });
  },
};
