// Advance session to next phase
import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';
import { getTopCommentSession, getActiveTopCommentPlayers } from '../_shared/top-comment-utils.ts';
import { createTeamGroups } from '../_shared/grouping.ts';
import { getNextMashupIndex, requireValidMashupLibraries } from '../_shared/mashup.ts';
import type { Session } from '../_shared/types.ts';

async function handleAdvanceSession(req: Request, uid: string, supabase: any): Promise<Response> {
  const { sessionId } = await req.json();

  requireString(sessionId, 'sessionId');

  // Get session
  const session = await getTopCommentSession(supabase, sessionId);
    
    // Verify host
    if (session.host_uid !== uid) {
      throw new AppError(403, 'Only the host can advance the game', 'permission-denied');
    }

    // Check if session is paused
    if (session.paused) {
      throw new AppError(400, 'Cannot advance while session is paused', 'failed-precondition');
    }
    
    const currentStatus = session.status;
    const roundIndex = session.round_index || 0;
    let rounds = session.rounds || [];
    const currentRound = rounds[roundIndex];
    const settings = session.settings || {};
    const isMashupMode = settings.gameMode === 'mashup';
    const selectedLibraries = isMashupMode
      ? requireValidMashupLibraries(session.selected_libraries)
      : [];
    const currentLibraryIndex = typeof session.current_library_index === 'number' ? session.current_library_index : 0;
    
    let nextStatus = currentStatus;
    let nextRoundIndex = roundIndex;
    let voteGroupIndex = session.vote_group_index;
    let endsAt: string | null = null;
    
    console.log('Advance session called:', { sessionId, currentStatus, roundIndex });
    
    // State machine for phase transitions
    switch (currentStatus) {
      case 'answer':
        // Move to vote phase
        nextStatus = 'vote';
        voteGroupIndex = 0;
        endsAt = new Date(Date.now() + (settings.voteSecs || 30) * 1000).toISOString();
        break;
        
      case 'vote': {
        // Check if there are more groups to vote on
        const groups = currentRound?.groups || [];
        const nextGroupIndex = (voteGroupIndex || 0) + 1;
        
        if (nextGroupIndex < groups.length) {
          // Vote on next group
          voteGroupIndex = nextGroupIndex;
          endsAt = new Date(Date.now() + (settings.voteSecs || 30) * 1000).toISOString();
        } else {
          // Move to results
          nextStatus = 'results';
          voteGroupIndex = null;
          endsAt = new Date(Date.now() + (settings.resultsSecs || 12) * 1000).toISOString();
          
          // Calculate scores for this round
          await calculateRoundScores(supabase, sessionId, roundIndex);
        }
        break;
      }
        
      case 'results': {
        // Check if there are more rounds
        if (roundIndex + 1 < rounds.length) {
          // Next round - regenerate groups with shuffled teams
          nextRoundIndex = roundIndex + 1;
          
          // Only regroup active (joined) players to avoid including inactive players
          const activeTeamIds = await getActiveTopCommentPlayers(supabase, sessionId);
            
          let finalRounds = rounds; // Will hold the final rounds state

          if (activeTeamIds.length > 0) {
            // Create new groups with shuffled teams
            const newTeamGroups = createTeamGroups(activeTeamIds);

            // Update next round with new groups while preserving prompts
            const nextRound = rounds[nextRoundIndex];
            const updatedGroups = newTeamGroups.map((groupTeamIds, index) => {
              const existingGroup = nextRound.groups[index];
              return {
                id: `g${index}`,
                prompt: existingGroup?.prompt || "What's your hot take?",
                promptLibraryId: existingGroup?.promptLibraryId,
                teamIds: groupTeamIds,
              };
            });

            // Update rounds array
            finalRounds = [...rounds];
            finalRounds[nextRoundIndex] = {
              ...nextRound,
              groups: updatedGroups,
            };
          }

          // Next round always goes straight to answer
          nextStatus = 'answer';
          nextRoundIndex = roundIndex + 1;
          voteGroupIndex = null;
          endsAt = new Date(Date.now() + (settings.answerSecs || 90) * 1000).toISOString();

          // Store final rounds for atomic update
          rounds = finalRounds;
        } else {
          // Game over
          nextStatus = 'ended';
          voteGroupIndex = null;
          endsAt = null;
        }
        break;
      }
        
      default:
        throw new AppError(400, 'Cannot advance from current phase', 'failed-precondition');
    }
    
    // Update session atomically with all changes
    const shouldAdvanceRotation = currentStatus === 'results' && nextStatus === 'answer';
    const nextLibraryIndex = isMashupMode
      ? getNextMashupIndex(selectedLibraries, currentLibraryIndex, shouldAdvanceRotation)
      : currentLibraryIndex;

    const nextPromptLibraryId = isMashupMode
      ? selectedLibraries[nextLibraryIndex]
      : session.prompt_library_id;

    const { data: updatedSession, error: updateError } = await supabase
      .from('top_comment_sessions')
      .update({
        rounds: rounds, // Include any rounds changes
        status: nextStatus,
        round_index: nextRoundIndex,
        vote_group_index: voteGroupIndex,
        ends_at: endsAt,
        prompt_library_id: nextPromptLibraryId,
        current_library_index: nextLibraryIndex,
        ended_at: nextStatus === 'ended' ? new Date().toISOString() : null,
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
  return corsResponse({ session: updatedSession as Session });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleAdvanceSession));

async function calculateRoundScores(supabase: any, sessionId: string, roundIndex: number) {
  const ANSWER_VALUE = 50;
  const ALIGNMENT_VALUE = 10;
  const SCORE_MULTIPLIER = 100;

  // Get all votes for this round (plus answer authors)
  const { data: votes } = await supabase
    .from('top_comment_votes')
    .select('voter_id, answer_id, top_comment_answers!inner(player_id)')
    .eq('session_id', sessionId)
    .eq('round_index', roundIndex);

  if (!votes || votes.length === 0) return;

  const voteCounts = new Map<string, number>();
  const answerAuthors = new Map<string, string>();

  for (const vote of votes) {
    const answerId = vote.answer_id;
    const answerAuthorId = vote.top_comment_answers?.player_id;

    if (answerId) {
      voteCounts.set(answerId, (voteCounts.get(answerId) ?? 0) + 1);
    }
    if (answerId && answerAuthorId) {
      answerAuthors.set(answerId, answerAuthorId);
    }
  }

  const scoreDeltas = new Map<string, number>();

  // Award answer points to authors
  for (const [answerId, votesForAnswer] of voteCounts.entries()) {
    const authorId = answerAuthors.get(answerId);
    if (!authorId) continue;

    const answerPoints = votesForAnswer * ANSWER_VALUE;
    if (answerPoints <= 0) continue;

    scoreDeltas.set(authorId, (scoreDeltas.get(authorId) ?? 0) + answerPoints);
  }

  // Award alignment points to voters (skip self-votes)
  for (const vote of votes) {
    const voterId = vote.voter_id;
    const answerId = vote.answer_id;
    const answerAuthorId = vote.top_comment_answers?.player_id;

    if (!voterId || !answerId) continue;
    if (answerAuthorId && voterId === answerAuthorId) {
      continue;
    }

    const alignment = voteCounts.get(answerId) ?? 0;
    const votePoints = alignment * ALIGNMENT_VALUE;

    if (votePoints > 0) {
      scoreDeltas.set(voterId, (scoreDeltas.get(voterId) ?? 0) + votePoints);
    }
  }

  // Apply score deltas
  for (const [teamId, totalPoints] of scoreDeltas.entries()) {
    const displayScore = totalPoints * SCORE_MULTIPLIER;
    await supabase.rpc('increment_top_comment_player_score', {
      player_id: teamId,
      score_delta: displayScore,
    });
  }
}


