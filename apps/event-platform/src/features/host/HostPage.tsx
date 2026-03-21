import { useCallback, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, QRCodeBlock, Card, Modal, useToast } from "@social/ui";
import { VIBoxButton } from "../../shared/components/vibox/VIBoxButton";
import { useAuth } from "../../shared/providers/AuthContext";
import { useCurrentPhase } from "../../shared/providers/CurrentPhaseContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { useHostSession } from "./useHostSession";
import { useGameState, useSessionOrchestrator, transformRoundSummariesForUI } from "../../application";
import { useInviteLink, useTeamLookup, useActiveGroupAnswers, usePromptLibraries } from "../../shared/hooks";
import { useHostState, useHostComputations, useHostEffects } from "./hooks";
import {
  setPromptLibrary,
  pauseSession,
} from "../session/sessionService";
import { getErrorMessage } from "../../shared/utils/errors";
import { supabase } from "../../supabase/client";
import {
  phaseCopy,
  actionLabel,
  getDefaultPromptLibraryId,
} from "../../shared/constants";
import { generateCategoryBonuses } from "../../shared/utils/categoryGrid";
import {
  LobbyPhase,
  CategorySelectPhase,
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
  CreateSessionModal,
  JoinSessionModal,
} from "./Phases";
import {
  handleCopyLink,
  handleCreateSession,
  handleUpdateSession,
  handleEndSession,
  handleHostVote,
  handleKickTeam,
  handlePrimaryAction,
} from "./Handlers";
import { PromptLibrarySelector } from "./components/PromptLibrarySelector";
import { BannedTeamsManager } from "./components/BannedTeamsManager";
import { TeamsManager } from "./components/TeamsManager";
import { VIBoxJukebox } from "../../shared/components/vibox/VIBoxJukebox";
import type {
  PromptLibraryId,
} from "../../shared/promptLibraries";

export function HostPage() {
  const { user, loading: authLoading, isVenueAccount, venueAccountLoading, refreshVenueAccount } = useAuth();
  const { addToast } = useToast();
  const { isDark } = useTheme(); 
  const navigate = useNavigate();

  // PROTECTION: Only Venue Accounts can access /host
  useEffect(() => {
    if (!authLoading && !venueAccountLoading) {
      if (!user) {
        navigate("/venue-auth");
        return;
      }
      
      if (user.is_anonymous) {
        addToast({ 
          title: "Venue Account Required", 
          description: "Please sign in with your venue credentials to access the host panel",
          variant: "error" 
        });
        navigate("/venue-auth");
        return;
      }
      
      if (!isVenueAccount) {
        addToast({ 
          title: "Access Denied", 
          description: "This area is reserved for Venue Accounts only",
          variant: "error" 
        });
        navigate("/venue-auth");
        return;
      }
    }
  }, [user, authLoading, venueAccountLoading, isVenueAccount, navigate, addToast]);

  const {
    sessionId: storedSessionId,
    code: storedCode,
    setHostSession,
    clearHostSession,
  } = useHostSession();
  const { setCurrentPhase } = useCurrentPhase();

  const { data: libraries } = usePromptLibraries();
  const [selectedCategoryIndices, setSelectedCategoryIndices] = useState<number[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategories, setNewCategories] = useState<PromptLibraryId[]>([]);
  const [isUpdatingCategories, setIsUpdatingCategories] = useState(false);
  const [showBannedTeamsModal, setShowBannedTeamsModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showVIBoxModal, setShowVIBoxModal] = useState(false);
  const [showVenueAuthPrompt, setShowVenueAuthPrompt] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  
  const hostState = useHostState(storedSessionId);
  const {
    sessionId,
    setSessionId,
    showCreateModal,
    setShowCreateModal,
    isCreating,
    setIsCreating,
    showEditModal,
    setShowEditModal,
    isUpdatingSession,
    setIsUpdatingSession,
    createErrors,
    setCreateErrors,
    createForm,
    setCreateForm,
    showPromptLibraryModal,
    setShowPromptLibraryModal,
    isUpdatingPromptLibrary,
    setIsUpdatingPromptLibrary,
    hostGroupVotes,
    setHostGroupVotes,
    isSubmittingVote,
    setIsSubmittingVote,
    analytics,
    setAnalytics,
    isPerformingAction,
    setIsPerformingAction,
    isEndingSession,
    setIsEndingSession,
    isPausingSession,
    setIsPausingSession,
    showEndSessionModal,
    setShowEndSessionModal,
    kickingTeamId,
    setKickingTeamId,
    sessionRef,
    isPerformingActionRef,
  } = hostState;

  const canCreateSession = !authLoading && !venueAccountLoading && isVenueAccount;

  // Use the new application hooks - this replaces 4 separate hooks and multiple useMemo calls!
  const gameState = useGameState({ 
    sessionId: sessionId ?? undefined, 
    userId: user?.id 
  });

  // Add session orchestrator for automatic phase advancement
  const orchestrator = useSessionOrchestrator({
    sessionId: sessionId || '',
    autoAdvance: true,
    enablePauseResume: true
  });

  // Extract data from gameState for compatibility with existing code
  const session = gameState.session;
  // Filter out teams with no members - ensure empty teams don't show in host panel
  // This is a safety filter in case any empty teams slip through the subscription filter
  const teams = useMemo(() => {
    return gameState.teams.filter(team => {
      const members = team.team_members;
      // Only include teams with at least one member
      return members && Array.isArray(members) && members.length > 0;
    });
  }, [gameState.teams]);
  const answers = gameState.answers;
  const sessionSnapshotReady = !gameState.isLoading;

  // Automatically load venue account when HostPage mounts
  useEffect(() => {
    if (user && !user.is_anonymous && !venueAccountLoading && !isVenueAccount) {
      refreshVenueAccount().catch((error) => {
        console.error("Failed to load venue account on HostPage mount:", error);
      });
    }
  }, [user, venueAccountLoading, isVenueAccount, refreshVenueAccount]);

  // Set sessionRef.current to latest session for auto advance actions.
  useEffect(() => {
    sessionRef.current = session ?? null;
    // Update orchestrator with current session
    if (session && 'updateSession' in orchestrator) {
      (orchestrator as any).updateSession(session);
    }
  }, [session, orchestrator]);

  // Helper to keep isPerformingAction state and ref synchronized
  const triggerPerformingAction = (value: boolean) => {
    isPerformingActionRef.current = value;
    setIsPerformingAction(value);
  };

  // Use gameState values instead of calculations
  const roundGroups = gameState.currentGroups;
  const totalGroups = roundGroups.length;

  // Vote Phase group info - use gameState values
  const activeGroup = gameState.activeVoteGroup;
  const activeGroupIndex = session?.voteGroupIndex ?? 0;

  // Use gameState voteCounts instead of calculation
  const voteCounts = gameState.voteCounts;

  // Answers for active voting group or all answers if not voting
  const activeGroupAnswers = useActiveGroupAnswers(answers, session, activeGroup);

  // Extract computations into custom hook
  const {
    leaderboard,
    selectedPromptLibraryId,
    currentPromptLibrary,
    activeGroupVote,
  } = useHostComputations({
    gameState,
    session,
    hostGroupVotes,
    activeGroup,
  });

// Extract effects into custom hook
  useHostEffects({
    session,
    sessionId,
    sessionSnapshotReady,
    sessionRef,
    setSessionId,
    setHostSession,
    clearHostSession,
    setShowCreateModal,
    setCurrentPhase,
    setAnalytics,
    setShowPromptLibraryModal,
    setHostGroupVotes,
    toast: addToast,
  });

  const inviteLink = useInviteLink(session);

  // Map team IDs to team names for lookup
  const teamLookup = useTeamLookup(teams);

  // Use gameState roundSummaries with shared transformation
  const roundSummaries = transformRoundSummariesForUI(
    gameState.roundSummaries,
    roundGroups,
    teams
  );

  // Instantiate handlers with current dependencies
  const createSessionHandler = handleCreateSession({
    user,
    authLoading,
    isVenueAccount,
    toast: addToast,
    setCreateErrors,
    isCreating, // Added this prop
    setIsCreating,
    setSessionId,
    setHostSession,
    setShowCreateModal,
    onSessionCreated: () => {
      // Only show prompt library modal for Classic mode
      if (createForm.gameMode === "classic") {
        setShowPromptLibraryModal(true);
      }
    },
    gameMode: createForm.gameMode,
    selectedCategories: createForm.selectedCategories,
    totalRounds: createForm.totalRounds,
  });

  const updateSessionHandler = handleUpdateSession({
    user,
    authLoading,
    isVenueAccount,
    toast: addToast,
    setCreateErrors,
    isUpdating: isUpdatingSession,
    setIsUpdating: setIsUpdatingSession,
    sessionId: session?.id ?? "",
    onUpdated: ({ sessionId, code }) => {
      setSessionId(sessionId);
      setHostSession({ sessionId, code });
    },
    setShowEditModal,
    gameMode: createForm.gameMode,
    selectedCategories: createForm.selectedCategories,
    totalRounds: createForm.totalRounds,
  });

  const primaryActionHandler = handlePrimaryAction({
    session,
    teams,
    isPerformingAction,
    triggerPerformingAction,
    toast: addToast,
    setShowCreateModal,
  });

  const confirmEndSessionHandler = handleEndSession({
    session,
    isEndingSession,
    setIsEndingSession,
    toast: addToast,
    setAnalytics,
    setHostGroupVotes,
  });

  const showEndSessionModalHandler = () => {
    setShowEndSessionModal(true);
  };

  const kickTeamHandler = handleKickTeam({
    session,
    toast: addToast,
    setKickingTeamId,
    refresh: gameState.refresh,
  });

  
  const copyLinkHandler = handleCopyLink({ toast: addToast });

  const handlePauseToggle = useCallback(async () => {
    if (!session || isPausingSession) return;

    setIsPausingSession(true);
    try {
      await pauseSession({
        sessionId: session.id,
        pause: !session.paused
      });
      addToast({
        title: session.paused ? "Session resumed" : "Session paused",
        variant: "success"
      });
    } catch (error: unknown) {
      addToast({
        title: getErrorMessage(error, "Failed to pause/resume session"),
        variant: "error"
      });
    } finally {
      setIsPausingSession(false);
    }
  }, [session, isPausingSession, addToast]);

  const handleReturnHome = useCallback(() => {
    clearHostSession();
    setSessionId(null);
    setAnalytics(null);
    setHostGroupVotes({});
    setShowCreateModal(false);
    setShowPromptLibraryModal(false);
    setShowEndSessionModal(false);
    navigate("/");
  }, [
    clearHostSession,
    navigate,
    setAnalytics,
    setHostGroupVotes,
    setSessionId,
  ]);

  const handlePromptLibrarySelect = useCallback(
    async (libraryId: PromptLibraryId) => {
      if (!session || session.status !== "lobby") return;
      if (isUpdatingPromptLibrary) return;
      const defaultId = await getDefaultPromptLibraryId();
      if (libraryId === (session.promptLibraryId ?? defaultId)) {
        return;
      }
      setIsUpdatingPromptLibrary(true);
      setPromptLibrary({ sessionId: session.id, promptLibraryId: libraryId })
        .then(() => {
          addToast({
            title: "Prompt library updated! New prompts will be used next round.",
            variant: "success"
          });
        })
        .catch((error: unknown) => {
          addToast({
            title: getErrorMessage(error, "Could not update prompts. Please try again."),
            variant: "error"
          });
        })
        .finally(() => {
          setIsUpdatingPromptLibrary(false);
        });
    },
    [session, isUpdatingPromptLibrary, addToast],
  );

  const hostVoteHandler = handleHostVote({
    session,
    activeGroup,
    activeGroupVote,
    toast: addToast,
    setIsSubmittingVote,
    setHostGroupVotes,
    isSubmittingVote,
  });

  const requireVenueAccount = useCallback(() => {
    if (canCreateSession) {
      return true;
    }

    if (authLoading || venueAccountLoading) {
      addToast({ title: "Checking your venue access...", variant: "info" });
    } else {
      setShowVenueAuthPrompt(true);
    }
    return false;
  }, [addToast, authLoading, venueAccountLoading, canCreateSession]);

  const handleOpenCreateModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    setShowCreateModal(true);
  }, [requireVenueAccount, setShowCreateModal]);

  const handleOpenEditModal = useCallback(() => {
    if (!requireVenueAccount()) {
      return;
    }
    if (!session) {
      return;
    }

    // Prefill the create form from the current session so hosts can "upsert" settings.
    const sessionSettings = (session.settings ?? {}) as any;
    setCreateForm({
      venueName: session.venueName ?? "",
      gameMode: sessionSettings.gameMode === "jeopardy" ? "jeopardy" : "classic",
      selectedCategories: Array.isArray(sessionSettings.selectedCategories) ? sessionSettings.selectedCategories : [],
      totalRounds: typeof sessionSettings.totalRounds === "number" ? sessionSettings.totalRounds : (sessionSettings.gameMode === "jeopardy" ? 1 : 5),
    });
    setCreateErrors({});
    setShowEditModal(true);
  }, [requireVenueAccount, session, setCreateErrors, setCreateForm, setShowEditModal]);

  const handleCreateModalClose = useCallback(() => {
    setShowCreateModal(false);
    if (!session) {
      navigate("/");
    }
  }, [setShowCreateModal, session, navigate]);

  const handleJoinSession = useCallback(async (joinSessionId: string) => {
    setIsJoiningSession(true);
    try {
      // Verify the session exists
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('id, code')
        .eq('id', joinSessionId)
        .single();

      if (error || !sessionData) {
        addToast({ title: 'Session not found', description: 'Please check the session ID and try again', variant: 'error' });
        setIsJoiningSession(false);
        return;
      }

      // Set the session in local storage
      setSessionId(joinSessionId);
      setHostSession({ sessionId: joinSessionId, code: sessionData.code });
      setShowJoinModal(false);
      addToast({ title: 'Joined session successfully', variant: 'success' });
    } catch (error) {
      addToast({ title: getErrorMessage(error, 'Failed to join session'), variant: 'error' });
    } finally {
      setIsJoiningSession(false);
    }
  }, [addToast, setSessionId, setHostSession]);

  // Handler for selecting/swapping categories
  const handleCategoryClick = useCallback(async (index: number) => {
    if (!session?.settings?.selectedCategories) return;
    
    // If this is the first selection, just mark it
    if (selectedCategoryIndices.length === 0) {
      setSelectedCategoryIndices([index]);
      return;
    }
    
    // If clicking the same category, deselect it
    if (selectedCategoryIndices[0] === index) {
      setSelectedCategoryIndices([]);
      return;
    }
    
    // If this is the second selection, swap them
    const index1 = selectedCategoryIndices[0];
    const index2 = index;
    
    const newCategories = [...session.settings.selectedCategories];
    [newCategories[index1], newCategories[index2]] = [newCategories[index2], newCategories[index1]];
    
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          settings: {
            ...session.settings,
            selectedCategories: newCategories,
          },
          category_grid: {
            ...session.categoryGrid,
            categories: newCategories.map((id: string) => {
              const existing = session.categoryGrid?.categories.find((c: any) => c.id === id);
              return existing || { id, usedPrompts: [], promptBonuses: generateCategoryBonuses() };
            }),
          },
        })
        .eq('id', session.id);
      
      if (error) throw error;
      addToast({ title: 'Categories swapped', variant: 'success' });
      setSelectedCategoryIndices([]); // Clear selection after swap
    } catch (error) {
      addToast({ title: getErrorMessage(error, 'Failed to swap categories'), variant: 'error' });
      setSelectedCategoryIndices([]); // Clear selection on error
    }
  }, [session, addToast, selectedCategoryIndices]);

  // Handler for updating categories
  const handleUpdateCategories = useCallback(async () => {
    if (!session || newCategories.length !== 6) return;
    
    setIsUpdatingCategories(true);
    try {
      // Generate new bonuses for each category
      const generateCategoryBonuses = () => {
        const pointValues = [100, 200, 300, 400, 500, 600, 700];
        const bonuses = [];
        
        for (let i = 0; i < 6; i++) {
          bonuses.push({
            promptIndex: i,
            bonusType: 'points',
            bonusValue: pointValues[i],
            revealed: false
          });
        }
        
        bonuses.push({
          promptIndex: 6,
          bonusType: 'multiplier',
          bonusValue: 2,
          revealed: false
        });
        
        // Shuffle
        for (let i = bonuses.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bonuses[i], bonuses[j]] = [bonuses[j], bonuses[i]];
        }
        
        return bonuses.map((bonus, index) => ({ ...bonus, promptIndex: index }));
      };
      
      const newCategoryGrid = {
        categories: newCategories.map((id) => ({
          id,
          usedPrompts: [],
          promptBonuses: generateCategoryBonuses(),
        })),
        totalSlots: 42,
        categoriesPerCard: 3,
        promptsPerCategory: session.categoryGrid?.promptsPerCategory || 3,
        lockedTiles: session.categoryGrid?.lockedTiles || [],
      };
      
      const { error } = await supabase
        .from('sessions')
        .update({
          settings: {
            ...session.settings,
            selectedCategories: newCategories,
          },
          category_grid: newCategoryGrid,
        })
        .eq('id', session.id);
      
      if (error) throw error;
      addToast({ title: 'Categories updated', variant: 'success' });
      setShowCategoryModal(false);
      setSelectedCategoryIndices([]); // Clear any swap selections
    } catch (error) {
      addToast({ title: getErrorMessage(error, 'Failed to update categories'), variant: 'error' });
    } finally {
      setIsUpdatingCategories(false);
    }
  }, [session, newCategories, addToast]);

  // Handler for changing game mode
  const handleChangeGameMode = useCallback(async (newMode: "classic" | "jeopardy") => {
    if (!session) return;
    
    try {
      const updates: any = {
        settings: {
          ...session.settings,
          gameMode: newMode,
        },
      };
      
      // Clear category grid when switching to classic
      if (newMode === "classic") {
        updates.category_grid = null;
      }
      
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', session.id);
      
      if (error) throw error;
      addToast({ title: `Switched to ${newMode === "classic" ? "Classic" : "Jeopardy"} mode`, variant: 'success' });
    } catch (error) {
      addToast({ title: getErrorMessage(error, 'Failed to change game mode'), variant: 'error' });
    }
  }, [session, addToast]);

  const promptLibraryCard =
    session && session.status === "lobby" ? (
      <Card className="flex flex-col gap-4" isDark={isDark}>
        {session.settings?.gameMode === "jeopardy" ? (
          // Jeopardy Mode: Show selected categories with reordering
          <>
            <div className="flex items-start justify-between gap-2">
              <div className={`flex flex-col gap-1 ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                  Jeopardy Categories
                </span>
                <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                  6 Categories Selected
                </p>
                <p className="text-sm text-cyan-300">
                  Teams will select from these categories during the game
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleChangeGameMode("classic")}
              >
                Switch to Classic
              </Button>
            </div>
            {session.settings?.selectedCategories && libraries && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                  {selectedCategoryIndices.length === 0 
                    ? 'Tap any category to select, then tap another to swap'
                    : 'Tap another category to swap positions'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {session.settings.selectedCategories.map((catId: PromptLibraryId, index: number) => {
                    const lib = libraries?.find(l => l.id === catId);
                    const isCard1 = index < 3;
                    const isSelected = selectedCategoryIndices.includes(index);
                    return lib ? (
                      <button
                        key={`${catId}-${index}`}
                        onClick={() => handleCategoryClick(index)}
                        className={`relative rounded-lg border px-3 py-3 text-center transition-all touch-manipulation active:scale-95 ${
                          isSelected ? 'border-brand-primary bg-brand-light ring-2 ring-brand-primary scale-95' : 'border-slate-600 bg-slate-700'
                        }`}
                      >
                        <div className="text-2xl mb-1">{lib.emoji}</div>
                        <div 
                          className={`text-xs font-semibold ${isSelected ? 'text-brand-primary' : 'text-cyan-100'}`}
                        >
                          {lib.name}
                        </div>
                        <div 
                          className="absolute top-1 right-1 text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: isCard1 ? '#dbeafe' : '#e9d5ff',
                            color: isCard1 ? '#1e40af' : '#6b21a8'
                          }}
                        >
                          {isCard1 ? 'Card 1' : 'Card 2'}
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-brand-primary/10 rounded-lg pointer-events-none">
                            <span className="text-2xl">✓</span>
                          </div>
                        )}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                Grid size will be calculated based on team count when you start.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNewCategories(session.settings?.selectedCategories || []);
                  setShowCategoryModal(true);
                }}
              >
                Change Categories
              </Button>
            </div>
          </>
        ) : (
          // Classic Mode: Show prompt library
          <>
            <div className="flex items-start justify-between gap-2">
              <div className={`flex flex-col gap-1 ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                  Prompt library
                </span>
                {currentPromptLibrary ? (
                  <>
                    <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                      {currentPromptLibrary.emoji} {currentPromptLibrary.name}
                    </p>
                    <p className={`text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                      {currentPromptLibrary.description}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
                    <p className={`ml-2 text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                      Loading...
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleChangeGameMode("jeopardy")}
              >
                Switch to Jeopardy
              </Button>
            </div>
            {currentPromptLibrary && currentPromptLibrary.prompts.length > 0 && (
              <div className="space-y-2">
                <p className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                  Sample prompts
                </p>
                <div className="space-y-2">
                  {currentPromptLibrary.prompts.slice(0, 3).map((prompt, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border px-3 py-2 text-sm ${!isDark ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-600 bg-slate-700 text-cyan-100'}`}
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                Pick a deck for tonight before you start the first round.
              </p>
              <Button
                variant="secondary"
                onClick={() => setShowPromptLibraryModal(true)}
                disabled={isUpdatingPromptLibrary}
              >
                {session.promptLibraryId ? "Change" : "Choose"} prompts
              </Button>
            </div>
          </>
        )}
      </Card>
    ) : null;

  // Render phase-specific content
  const renderPhaseContent = () => {
    if (!session) {
      return (
        <Card className="min-h-[360px]" isDark={isDark}>
          <p className="text-lg text-cyan-300">
            Create a session to unlock the host controls.
          </p>
        </Card>
      );
    }

    switch (session.status) {
      case "lobby":
        return (
          <LobbyPhase
            inviteLink={inviteLink}
            storedCode={storedCode}
            sessionId={sessionId}
            handleCopyLink={copyLinkHandler}
            sessionCode={session.code}
            teams={teams}
          />
        );

      case "category-select":
        return (
          <CategorySelectPhase
            session={session}
            roundGroups={roundGroups}
            teams={teams}
            sessionEndsAt={session.endsAt}
            categorySelectSecs={session.settings.categorySelectSecs ?? 15}
            sessionPaused={session.paused}
          />
        );

      case "answer":
        return (
          <AnswerPhase
            sessionRoundIndex={session.roundIndex}
            totalGroups={totalGroups}
            roundGroups={roundGroups}
            teamLookup={teamLookup}
            sessionEndsAt={session.endsAt}
            answerSecs={session.settings.answerSecs ?? 90}
            sessionPaused={session.paused}
            promptLibraryId={session.promptLibraryId}
          />
        );

      case "vote":
        return (
          <VotePhase
            totalGroups={totalGroups}
            activeGroupIndex={activeGroupIndex}
            activeGroup={activeGroup}
            roundGroups={roundGroups}
            activeGroupAnswers={activeGroupAnswers}
            voteCounts={voteCounts}
            activeGroupVote={activeGroupVote}
            handleHostVote={hostVoteHandler}
            isSubmittingVote={isSubmittingVote}
            roundSummaries={roundSummaries}
            sessionEndsAt={session.endsAt}
            voteSecs={session.settings.voteSecs ?? 90}
            sessionPaused={session.paused}
            votes={gameState.votes}
            teams={gameState.teams}
            currentRoundIndex={session.roundIndex}
          />
        );

      case "results":
        return (
          <ResultsPhase
            sessionRoundIndex={session.roundIndex}
            roundSummaries={roundSummaries}
            voteCounts={voteCounts}
            sessionEndsAt={session.endsAt}
            resultsSecs={session.settings.resultsSecs ?? 12}
            sessionPaused={session.paused}
          />
        );

      case "ended":
        return <EndedPhase leaderboard={leaderboard} analytics={analytics} />;

      default:
        return null;
    }
  };

  // Presenter view button if session exists
  const presenterButton = session ? (
    <Button
      variant="ghost"
      onClick={() =>
        window.open(`/presenter/${session.id}`, "_blank", "noopener")
      }
    >
      Presenter View
    </Button>
  ) : null;

  return (
    <main className="min-h-screen px-4 py-8 bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" isDark={isDark}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                ← Back
              </Link>
              {presenterButton}
              {session && (
                <Button
                  variant="ghost"
                  onClick={() => setShowTeamsModal(true)}
                >
                  Teams
                </Button>
              )}
              <VIBoxButton 
                onClick={() => setShowVIBoxModal(true)}
                variant="host"
                size="lg"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black text-pink-400">
                Host Console
              </h1>
              {session ? (
                <p className="text-sm text-cyan-300">
                  {phaseCopy[session.status]}
                </p>
              ) : (
                <p className="text-sm text-cyan-300">
                  Create a game room when you're ready to host.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl px-6 py-4 border bg-cyan-900/30 border-cyan-400/50">
            <span className="text-xs uppercase tracking-wider text-cyan-300">
              Room code
            </span>
            <span className="text-3xl font-black tracking-widest text-pink-400">
              {session?.code ?? storedCode ?? "---"}
            </span>
            {session ? (
              <>
                <span className="text-xs text-cyan-400">
                  {teams.length} team{teams.length === 1 ? "" : "s"} online
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ID: {session.id.slice(0, 8)}...
                </span>
              </>
            ) : null}
          </div>
        </Card>

        {!session && !venueAccountLoading && !canCreateSession && (
          <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" isDark={isDark}>
            <div>
              <p className={`text-sm font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                Venue login required
              </p>
              <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                Sign in with your venue credentials before creating a new game.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowVenueAuthPrompt(true)}
            >
              Open venue login
            </Button>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
          <div className="flex flex-col gap-6">
            {promptLibraryCard}
            {renderPhaseContent()}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  if (!session && !requireVenueAccount()) {
                    return;
                  }
                  primaryActionHandler();
                }}
                disabled={
                  session
                    ? isPerformingAction ||
                      isUpdatingPromptLibrary ||
                      session.status === "ended" ||
                      (session.status === "lobby" && teams.length === 0)
                    : false
                }
                isLoading={session ? isPerformingAction : false}
              >
                {session ? actionLabel[session.status] : "Create game"}
              </Button>
              {session && session.status !== "lobby" && session.status !== "ended" && (
                <Button
                  variant="secondary"
                  onClick={handlePauseToggle}
                  disabled={isPausingSession}
                  isLoading={isPausingSession}
                >
                  {isPausingSession ? (
                    // Loading spinner
                    <svg
                      className="animate-spin w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : session.paused ? (
                    // Play icon for resume
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                      />
                    </svg>
                  ) : (
                    // Pause icon for pause
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                      />
                    </svg>
                  )}
                  <span className="ml-2">
                    {isPausingSession ? "Loading..." : session.paused ? "Resume" : "Pause"}
                  </span>
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleOpenCreateModal}
                >
                  New session
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleOpenEditModal}
                  disabled={!session || session.status !== "lobby" || isUpdatingSession}
                  title={
                    !session
                      ? "Create or join a session first"
                      : session.status !== "lobby"
                        ? "Room settings can only be changed before the session starts."
                        : undefined
                  }
                >
                  Room settings
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowJoinModal(true)}
                >
                  Join session
                </Button>
                {session ? (
                  session.status === "ended" ? (
                    <Button variant="ghost" onClick={handleReturnHome}>
                      Return home
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={showEndSessionModalHandler}
                      disabled={isEndingSession}
                    >
                      End session
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            {session ? (
              <QRCodeBlock value={inviteLink || ""} caption="Scan to join!" isDark={isDark} />
            ) : (
              <div className="rounded-3xl p-6 text-center text-sm shadow-lg bg-slate-800 text-cyan-300 shadow-fuchsia-500/20">
                Start a session to generate a QR code for your guests.
              </div>
            )}
            {session ? (
              <div className={`space-y-4 rounded-3xl p-5 shadow-lg border-[3px] ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-pink-400">
                    Lobby ({teams.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowBannedTeamsModal(true)}
                      className="text-xs text-purple-600"
                    >
                      View Banned
                    </Button>
                    <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                      Max {session.settings.maxTeams}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {teams.map((team) => (
                    <li
                      key={team.id}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 bg-slate-700"
                    >
                      <span className="font-medium text-cyan-100">
                        {team.teamName}
                        {team.isHost ? " (Host)" : ""}
                      </span>
                      {!team.isHost ? (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => kickTeamHandler(team.id)}
                            className="text-sm text-orange-600"
                            disabled={kickingTeamId !== null}
                            isLoading={kickingTeamId === team.id}
                          >
                            {kickingTeamId === team.id ? "Kicking..." : "Kick"}
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                  {!teams.length ? (
                    <li className="rounded-2xl px-4 py-3 text-sm bg-slate-700 text-cyan-300">
                      Teams will appear here as they join.
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </aside>
        </section>
      </div>

      <CreateSessionModal
        open={showCreateModal}
        onClose={handleCreateModalClose}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createErrors={createErrors}
        isCreating={isCreating}
        canCreateSession={canCreateSession}
        onSubmit={createSessionHandler}
      />
      <CreateSessionModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Room settings"
        submitLabel={isUpdatingSession ? "Saving..." : "Save settings"}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createErrors={createErrors}
        isCreating={isUpdatingSession}
        canCreateSession={canCreateSession}
        onSubmit={updateSessionHandler}
      />
      <JoinSessionModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinSession}
        isJoining={isJoiningSession}
      />
      <Modal
        open={showPromptLibraryModal && Boolean(session)}
        onClose={() => setShowPromptLibraryModal(false)}
        title="Choose a prompt library"
        isDark={isDark}
        footer={
          <Button variant="ghost" onClick={() => setShowPromptLibraryModal(false)}>
            Done
          </Button>
        }
      >
        {session ? (
          <div className="space-y-3">
            <PromptLibrarySelector
              selectedId={selectedPromptLibraryId}
              onSelect={handlePromptLibrarySelect}
              disabled={isUpdatingPromptLibrary || session.status !== "lobby"}
            />
            <p className="text-xs text-slate-400">
              You can switch decks any time before the first round begins.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-300">
            Start a session to choose your prompt library.
          </p>
        )}
      </Modal>
      <Modal
        open={showEndSessionModal}
        onClose={() => setShowEndSessionModal(false)}
        title="End Session"
        isDark={isDark}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={() => setShowEndSessionModal(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowEndSessionModal(false);
                confirmEndSessionHandler();
              }}
              disabled={isEndingSession}
              isLoading={isEndingSession}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to end this session? This action cannot be undone
          and all teams will be disconnected.
        </p>
      </Modal>
      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Change Categories"
        isDark={isDark}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategories}
              disabled={newCategories.length !== 6 || isUpdatingCategories}
              isLoading={isUpdatingCategories}
            >
              Update Categories
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            Select 6 categories for your Jeopardy game. This will reset all progress and generate new bonuses.
          </p>
          <p className={`text-xs font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
            {newCategories.length}/6 categories selected
          </p>
          {libraries && (
            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {libraries.map((library) => {
                const isSelected = newCategories.includes(library.id);
                const canSelect = isSelected || newCategories.length < 6;
                
                return (
                  <button
                    key={library.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setNewCategories(newCategories.filter(id => id !== library.id));
                      } else if (canSelect) {
                        setNewCategories([...newCategories, library.id]);
                      }
                    }}
                    disabled={!canSelect}
                    className={`
                      p-3 rounded-lg border-2 text-center transition-all touch-manipulation
                      ${isSelected
                        ? "border-brand-primary bg-brand-light scale-95"
                        : canSelect
                          ? (!isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500")
                          : "opacity-30 cursor-not-allowed border-slate-200 bg-slate-50"
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{library.emoji}</div>
                    <div className={`text-xs font-semibold ${
                      isSelected ? 'text-brand-primary' : !isDark ? 'text-slate-700' : 'text-cyan-100'
                    }`}>
                      {library.name}
                    </div>
                    {isSelected && (
                      <div className="text-brand-primary text-sm mt-1">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
      
      <BannedTeamsManager
        sessionId={sessionId}
        isOpen={showBannedTeamsModal}
        onClose={() => setShowBannedTeamsModal(false)}
        toast={addToast}
      />
      
      {sessionId && (
        <TeamsManager
          sessionId={sessionId}
          isOpen={showTeamsModal}
          onClose={() => setShowTeamsModal(false)}
          toast={addToast}
        />
      )}
      
      <VIBoxJukebox
        isOpen={showVIBoxModal}
        onClose={() => setShowVIBoxModal(false)}
        toast={addToast}
        mode="host"
        allowUploads={true}
      />

      <Modal
        open={showVenueAuthPrompt}
        onClose={() => setShowVenueAuthPrompt(false)}
        title="Venue account required"
        isDark={isDark}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={() => setShowVenueAuthPrompt(false)}>
              Maybe later
            </Button>
            <Button
              onClick={() => {
                setShowVenueAuthPrompt(false);
                navigate("/venue-auth");
              }}
            >
              Go to venue login
            </Button>
          </div>
        }
      >
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          Only approved venue accounts can start Söcial sessions. Use your venue
          credentials to sign in before creating a game.
        </p>
      </Modal>
    </main>
  );
}

export default HostPage;
