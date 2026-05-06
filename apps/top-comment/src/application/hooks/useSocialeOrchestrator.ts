// =============================================================================
// SOCIALE ORCHESTRATOR HOOK
// =============================================================================
// Hook for managing Sociale lifecycle and auto-advance.
// Based on useSessionOrchestrator.ts but round-type-aware.

import { useEffect, useRef, useState, useCallback } from 'react';
import { SocialeStateMachine } from '../../domain/services/SocialeStateMachine';
import {
  advanceSocialePhase,
  pauseSociale as pauseSocialeService,
  startSociale as startSocialeService,
  skipSocialeRound,
  skipSocialePhase
} from '../../features/sociale/socialeService';
import {
  detectTieBreak,
  createTieBreakState,
  DEFAULT_TIE_BREAK_CONFIG,
} from '../../domain/sociale/tieBreak';
import { supabase } from '../../supabase/client';
import { 
  getNextPhase,
  getPhaseDuration 
} from '../../domain/sociale/roundRegistry';
import type { 
  Sociale, 
  SocialeStateMachineContext,
  SocialeRoundType,
} from '../../domain/types/sociale.types';
import type { 
  UseSocialeOrchestratorReturn, 
  SocialeOrchestratorConfig
} from '../types/application.types';

/**
 * Hook for managing Sociale lifecycle and auto-advance
 * Handles state machine validation, auto-advance timer, pause/resume
 */
export function useSocialeOrchestrator(config: SocialeOrchestratorConfig): UseSocialeOrchestratorReturn {
  const { 
    socialeId, 
    autoAdvance: initialAutoAdvance = false, 
    enablePauseResume = true 
  } = config;

  // State
  const [isAutoAdvanceEnabled, setIsAutoAdvanceEnabled] = useState(initialAutoAdvance);
  const [nextPhase, setNextPhase] = useState<string | null>(null);
  const [autoAdvanceIn, setAutoAdvanceIn] = useState<number | null>(null);
  const [lastTransitionAt, setLastTransitionAt] = useState<string | null>(null);
  const [currentSociale, setCurrentSociale] = useState<Sociale | null>(null);

  // Refs for timer management
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const autoAdvanceRetryRef = useRef<number | null>(null);
  const socialeRef = useRef<Sociale | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    if (autoAdvanceRetryRef.current) {
      clearTimeout(autoAdvanceRetryRef.current);
      autoAdvanceRetryRef.current = null;
    }
  }, []);

  // Auto-advance function
  const performAutoAdvance = useCallback(async (): Promise<boolean> => {
    if (!socialeId) return false;

    // Get current sociale from ref to avoid circular dependency
    const currentSocialeRef = socialeRef.current;
    if (!currentSocialeRef) return false;

    // Don't auto-advance if Sociale is paused
    if (currentSocialeRef.status === 'paused') {
      return false;
    }

    // Ambient mode: TVPage owns the advance loop (TV must be on anyway).
    // The host panel must not compete with it.
    if (currentSocialeRef.mode === 'ambient') {
      return false;
    }

    try {
      const result = await advanceSocialePhase({ 
        socialeId, 
        targetPhase: 'next' 
      });
      
      if (result) {
        setLastTransitionAt(new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [socialeId]);

  // Setup auto-advance timer
  useEffect(() => {
    if (!currentSociale) {
      return;
    }

    // Clear existing timers
    clearTimers();

    // Don't set up auto-advance if:
    // - Auto-advance is disabled
    // - Sociale is paused
    // - No phase end time
    // - Not in active status
    if (!isAutoAdvanceEnabled || 
        currentSociale.status === 'paused' || 
        !currentSociale.phaseEndsAt ||
        currentSociale.status !== 'active') {
      setAutoAdvanceIn(null);
      return;
    }

    const now = Date.now();
    const endTime = new Date(currentSociale.phaseEndsAt).getTime();
    const remainingMs = endTime - now;
    
    // If phase already ended, try to advance immediately
    if (remainingMs <= 0) {
      const retryDelay = 1000; // Retry after 1 second
      
      autoAdvanceRetryRef.current = window.setTimeout(() => {
        performAutoAdvance();
      }, retryDelay);
      
      setAutoAdvanceIn(retryDelay);
      return;
    }

    // Set up timer for auto-advance
    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      performAutoAdvance();
    }, remainingMs);

    setAutoAdvanceIn(remainingMs);

    // Cleanup on unmount
    return clearTimers;
  }, [
    isAutoAdvanceEnabled, 
    currentSociale?.status, 
    currentSociale?.phaseEndsAt, 
    clearTimers,
    performAutoAdvance
  ]);

  // Method to update the current Sociale (called by parent)
  const updateSociale = useCallback((sociale: Sociale) => {
    socialeRef.current = sociale;
    setCurrentSociale(sociale);
    
    if (sociale) {
      // Build context from Sociale and current round state
      // In a full implementation, this would use current round data
      const context: SocialeStateMachineContext = {
        socialeId: sociale.id,
        currentRoundType: 'prompt', // Would come from current round
        currentPhase: sociale.currentPhase ?? 'draft',
        socialiteCount: 0, // Would come from socialites
        hasResponses: false,
        hasVotes: false,
        currentRoundComplete: false,
        allRoundsComplete: false,
        isPaused: sociale.status === 'paused',
        currentRoundIndex: sociale.currentRoundIndex ?? null,
      };
      
      // Calculate next phase using round registry
      const next = getNextPhase(
        context.currentRoundType, 
        context.currentPhase
      );
      setNextPhase(next);
    } else {
      setNextPhase(null);
      setAutoAdvanceIn(null);
    }
  }, []);

  // Action methods
  const advancePhase = useCallback(async (): Promise<boolean> => {
    if (!socialeId) return false;

    try {
      clearTimers(); // Clear any pending auto-advance
      const result = await advanceSocialePhase({ 
        socialeId, 
        targetPhase: 'next' 
      });
      
      if (result) {
        setLastTransitionAt(new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [socialeId, clearTimers]);

  const pauseSociale = useCallback(async (): Promise<boolean> => {
    if (!socialeId || !enablePauseResume) return false;

    try {
      clearTimers(); // Clear any pending auto-advance
      const result = await pauseSocialeService(socialeId, true);
      
      if (result) {
        setLastTransitionAt(new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [socialeId, enablePauseResume, clearTimers]);

  const resumeSociale = useCallback(async (): Promise<boolean> => {
    if (!socialeId || !enablePauseResume) return false;

    try {
      const result = await pauseSocialeService(socialeId, false);
      
      if (result) {
        setLastTransitionAt(new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [socialeId, enablePauseResume]);

  const startSociale = useCallback(async (): Promise<boolean> => {
    if (!socialeId) return false;

    try {
      clearTimers(); // Clear any pending auto-advance
      const result = await startSocialeService({ socialeId });
      
      if (result) {
        setLastTransitionAt(new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [socialeId, clearTimers]);

  // Method to get phase duration from round registry
  const getPhaseDurationFromRegistry = useCallback((
    roundType: SocialeRoundType, 
    phase: string, 
    settings?: any
  ): number => {
    // Use registry to get phase duration
    return getPhaseDuration(roundType, phase, settings || {});
  }, []);

  const toggleAutoAdvance = useCallback(() => {
    setIsAutoAdvanceEnabled((prev: boolean) => !prev);
  }, []);

  const setAutoAdvanceEnabled = useCallback((enabled: boolean) => {
    setIsAutoAdvanceEnabled(enabled);
  }, []);

  // Skip current round
  const handleSkipRound = useCallback(async (): Promise<boolean> => {
    if (!socialeId) return false;
    
    try {
      // Clear any existing timers
      clearTimers();
      
      // Call skip round service
      const updatedSociale = await skipSocialeRound(socialeId);
      
      // Update local state
      setCurrentSociale(updatedSociale);
      socialeRef.current = updatedSociale;
      
      return true;
    } catch (error) {
      return false;
    }
  }, [socialeId, clearTimers]);

  // Detect and activate tie-break based on current scoreboard
  const handleTieBreak = useCallback(async (
    scoreboard: Record<string, number>
  ): Promise<boolean> => {
    if (!socialeId) return false;

    const { needed, participants } = detectTieBreak(scoreboard, DEFAULT_TIE_BREAK_CONFIG);
    if (!needed) return false;

    const state = createTieBreakState(participants, scoreboard);

    try {
      const { error } = await supabase
        .from('sociales')
        .update({
          is_tie_break: true,
          tie_break_round_number: state.roundNumber,
          tie_break_participants: state.participants,
        })
        .eq('id', socialeId);

      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  }, [socialeId]);

  // Skip current phase
  const handleSkipPhase = useCallback(async (): Promise<boolean> => {
    if (!socialeId) return false;
    
    try {
      // Clear any existing timers
      clearTimers();
      
      // Call skip phase service
      const updatedSociale = await skipSocialePhase(socialeId);
      
      // Update local state
      setCurrentSociale(updatedSociale);
      socialeRef.current = updatedSociale;
      
      return true;
    } catch (error) {
      return false;
    }
  }, [socialeId, clearTimers]);

  // Computed state
  const isPaused = currentSociale?.status === 'paused';
  const canAutoAdvance = currentSociale ? 
    SocialeStateMachine.canAutoAdvance(currentSociale, {
      socialeId: currentSociale.id,
      currentRoundType: 'prompt', // Would come from current round
      currentPhase: currentSociale.currentPhase ?? 'draft',
      socialiteCount: 0, // Would come from socialites
      hasResponses: false,
      hasVotes: false,
      currentRoundComplete: false,
      allRoundsComplete: false,
      isPaused: currentSociale.status === 'paused',
      currentRoundIndex: currentSociale.currentRoundIndex ?? null,
    }) : false;

  // Cleanup on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return {
    // State
    isAutoAdvanceEnabled,
    isPaused,
    nextPhase,
    canAutoAdvance,
    autoAdvanceIn,
    lastTransitionAt,
    
    // Actions
    advancePhase,
    pauseSociale,
    resumeSociale,
    startSociale,
    skipRound: handleSkipRound,
    skipPhase: handleSkipPhase,
    handleTieBreak,
    toggleAutoAdvance,
    setAutoAdvanceEnabled,
    
    // Registry integration methods
    getPhaseDuration: getPhaseDurationFromRegistry,
    
    // Internal method for Sociale updates
    updateSociale
  };
}
