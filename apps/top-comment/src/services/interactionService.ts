import { supabase } from "../supabase/client";
import { censorText } from "../shared/utils/profanityFilter";
import { createRateLimiter } from "../shared/utils/rateLimiter";
import { RATE_LIMITS } from "../shared/constants/rateLimits";
import type { Interaction, InteractionResponse, InteractionVote, HeadlineFibbageSettings, VotingOption, HeadlineResults, TopicResponseWithUpvotes, PollVote, PollResults, TopicSortBy, TriviaInteractionSettings, TriviaSubmission, TriviaReveal } from "../domain/types/interaction.types";
import type { TriviaSubmissionRow, TriviaEvaluationRow } from "../domain/types/database.types";

const responseLimiter = createRateLimiter(RATE_LIMITS.response.maxActions, RATE_LIMITS.response.windowMs);
const voteLimiter = createRateLimiter(RATE_LIMITS.vote.maxActions, RATE_LIMITS.vote.windowMs);

// --- Mappers ---

function mapInteraction(data: any): Interaction {
  return {
    id: data.id,
    roomId: data.room_id,
    createdBy: data.created_by,
    type: data.type,
    status: data.status,
    question: data.question,
    description: data.description,
    settings: data.settings,
    responseCount: data.response_count || 0,
    voteCount: data.vote_count || 0,
    answerEndsAt: data.answer_ends_at,
    answerSeconds: data.answer_seconds,
    votingEndsAt: data.voting_ends_at,
    votingSeconds: data.voting_seconds,
    createdAt: data.created_at,
    closedAt: data.closed_at,
    targetType: data.target_type ?? 'broadcast',
    targetMembershipId: data.target_membership_id ?? null,
    sourceMembershipId: data.source_membership_id ?? null,
    challengeStatus: data.challenge_status ?? null,
    challengeExpiresAt: data.challenge_expires_at ?? null,
    pointsWager: data.points_wager ?? 0,
    pollOptions: data.poll_options || [],
    sortBy: data.sort_by || 'newest',
  };
}

function mapResponse(data: any): InteractionResponse {
  const membership = data.room_memberships;
  return {
    id: data.id,
    interactionId: data.interaction_id,
    membershipId: data.membership_id,
    text: data.text,
    createdAt: data.created_at,
    playerName: membership?.player_name,
    mascotId: membership?.mascot_id,
  };
}

function mapVote(data: any): InteractionVote {
  return {
    id: data.id,
    interactionId: data.interaction_id,
    membershipId: data.membership_id,
    responseId: data.response_id,
    createdAt: data.created_at,
  };
}

// --- Interaction CRUD ---

async function createInteraction(
  roomId: string,
  question: string,
  description?: string
): Promise<Interaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const filteredQuestion = censorText(question);
  const filteredDescription = description ? censorText(description) : null;

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      room_id: roomId,
      question: filteredQuestion,
      description: filteredDescription,
      created_by: userData.user.id,
      answer_ends_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
      answer_seconds: 300,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create interaction: ${error.message}`);
  return mapInteraction(data);
}

async function closeInteraction(interactionId: string): Promise<void> {
  const { error } = await supabase
    .from("interactions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", interactionId);

  if (error) throw new Error(`Failed to close interaction: ${error.message}`);
}

async function getActiveInteractions(roomId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("room_id", roomId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch interactions: ${error.message}`);
  return (data || []).map(mapInteraction);
}

async function getAllInteractions(roomId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch interactions: ${error.message}`);
  return (data || []).map(mapInteraction);
}

// --- Response CRUD ---

async function submitResponse(
  interactionId: string,
  membershipId: string,
  text: string
): Promise<InteractionResponse> {
  if (!responseLimiter.canAct()) {
    throw new Error('Slow down! You are submitting responses too fast.');
  }

  const filteredText = censorText(text);

  const { data, error } = await supabase
    .from("responses")
    .upsert(
      {
        interaction_id: interactionId,
        membership_id: membershipId,
        text: filteredText,
      },
      { onConflict: "interaction_id,membership_id" }
    )
    .select("*, room_memberships:membership_id(player_name, mascot_id)")
    .single();

  if (error) throw new Error(`Failed to submit response: ${error.message}`);
  return mapResponse(data);
}

async function getResponses(interactionId: string): Promise<InteractionResponse[]> {
  const { data, error } = await supabase
    .from("responses")
    .select("*, room_memberships:membership_id(player_name, mascot_id)")
    .eq("interaction_id", interactionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get responses: ${error.message}`);
  return (data || []).map(mapResponse);
}

async function getMyResponse(
  interactionId: string,
  membershipId: string
): Promise<InteractionResponse | null> {
  const { data, error } = await supabase
    .from("responses")
    .select("*, room_memberships:membership_id(player_name, mascot_id)")
    .eq("interaction_id", interactionId)
    .eq("membership_id", membershipId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch response: ${error.message}`);
  return data ? mapResponse(data) : null;
}

// --- Vote CRUD ---

async function advanceToVoting(interactionId: string, votingSeconds = 300): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('advance_interaction_to_voting', {
      p_interaction_id: interactionId,
      p_voting_seconds: votingSeconds
    });

  if (error) throw new Error(`Failed to advance to voting: ${error.message}`);
  return data;
}

async function advanceToResults(interactionId: string): Promise<boolean> {
  // First check current status to ensure we can advance to results
  const { data: interaction, error: fetchError } = await supabase
    .from("interactions")
    .select("status")
    .eq("id", interactionId)
    .single();
  
  if (fetchError) throw new Error(`Failed to check interaction status: ${fetchError.message}`);
  
  // Can only advance from 'voting' to 'results'
  if (interaction.status !== 'voting') {
    throw new Error(`Cannot advance to results: interaction is in '${interaction.status}' phase, must be 'voting'`);
  }

  // Update to results phase
  const { error: updateError } = await supabase
    .from("interactions")
    .update({ status: "results" })
    .eq("id", interactionId);

  if (updateError) throw new Error(`Failed to advance to results: ${updateError.message}`);
  return true;
}

async function submitVote(interactionId: string, membershipId: string, responseId: string): Promise<InteractionVote> {
  if (!voteLimiter.canAct()) {
    throw new Error('Slow down! You are voting too fast.');
  }

  const { data, error } = await supabase
    .from("interaction_votes")
    .upsert(
      {
        interaction_id: interactionId,
        membership_id: membershipId,
        response_id: responseId,
      },
      { onConflict: "interaction_id,membership_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to submit vote: ${error.message}`);
  return mapVote(data);
}

async function getVotes(interactionId: string): Promise<InteractionVote[]> {
  const { data, error } = await supabase
    .from("interaction_votes")
    .select("*")
    .eq("interaction_id", interactionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get votes: ${error.message}`);
  return (data || []).map(mapVote);
}

// --- Headline Fibbage Methods ---

async function createHeadlineInteraction(params: {
  roomId: string;
  headlineId: string;
  headlineBlank: string;
  sourceName: string;
  publishedAt: string;
  answerSeconds?: number;
  votingSeconds?: number;
}): Promise<Interaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const answerSeconds = params.answerSeconds ?? 90;
  const votingSeconds = params.votingSeconds ?? 60;

  const settings: HeadlineFibbageSettings = {
    mode: "headline_fibbage",
    headlineId: params.headlineId,
    headlineBlank: params.headlineBlank,
    sourceName: params.sourceName,
    publishedAt: params.publishedAt,
    answerMaxLen: 40,
    profanityFilter: "basic",
  };

  const filteredHeadline = censorText(params.headlineBlank);

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      room_id: params.roomId,
      created_by: userData.user.id,
      type: "headline_fibbage",
      status: "active",
      question: filteredHeadline,
      description: `${params.sourceName} • ${new Date(params.publishedAt).toLocaleDateString()}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: JSON.parse(JSON.stringify(settings)),
      answer_seconds: answerSeconds,
      answer_ends_at: new Date(Date.now() + answerSeconds * 1000).toISOString(),
      voting_seconds: votingSeconds,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create headline interaction: ${error.message}`);
  return mapInteraction(data);
}

async function getVotingOptions(interactionId: string, membershipId: string): Promise<VotingOption[]> {
  // Fetch all responses for this interaction
  const responses = await getResponses(interactionId);

  // Get the interaction to find the real answer from settings
  const { data: interactionData, error: intError } = await supabase
    .from('interactions')
    .select('settings')
    .eq('id', interactionId)
    .single();

  if (intError) throw new Error(`Failed to fetch interaction: ${intError.message}`);

  const settings = interactionData.settings as any;
  const realAnswer = settings?.headlineBlank ? settings.headlineBlank.replace(/____/g, settings.realAnswer || 'the real answer') : 'Real answer';

  // Build options: player responses + real answer
  const options: VotingOption[] = responses
    .filter(r => r.membershipId !== membershipId) // Exclude own response
    .map(r => ({
      optionId: r.id,
      text: r.text,
      authorMembershipId: r.membershipId,
    }));

  // Add the real answer
  options.push({
    optionId: 'real_answer',
    text: realAnswer,
    isReal: true,
    authorMembershipId: null,
  });

  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

async function getHeadlineResults(interactionId: string, _membershipId: string): Promise<HeadlineResults> {
  // Fetch responses and votes
  const responses = await getResponses(interactionId);
  const votes = await getVotes(interactionId);

  // Get the interaction settings for the real answer
  const { data: interactionData, error: intError } = await supabase
    .from('interactions')
    .select('settings')
    .eq('id', interactionId)
    .single();

  if (intError) throw new Error(`Failed to fetch interaction: ${intError.message}`);

  const settings = interactionData.settings as any;
  const realAnswer = settings?.headlineBlank ? settings.headlineBlank.replace(/____/g, settings.realAnswer || 'the real answer') : 'Real answer';

  // Build vote counts per option
  const voteCounts = new Map<string, number>();
  for (const v of votes) {
    voteCounts.set(v.responseId, (voteCounts.get(v.responseId) || 0) + 1);
  }

  // Build options from responses
  const options = responses.map(r => ({
    optionId: r.id,
    text: r.text,
    isReal: false,
    authorMembershipId: r.membershipId,
    voteCount: voteCounts.get(r.id) || 0,
    fooledCount: voteCounts.get(r.id) || 0,
  }));

  // Add real answer option
  options.push({
    optionId: 'real_answer',
    text: realAnswer,
    isReal: true,
    authorMembershipId: null as any,
    voteCount: voteCounts.get('real_answer') || 0,
    fooledCount: 0,
  });

  return { realAnswer, options };
}

async function submitHeadlineVote(interactionId: string, membershipId: string, responseId: string): Promise<void> {
  await submitVote(interactionId, membershipId, responseId);
}

// --- Topic Methods ---

async function createTopic(
  roomId: string,
  question: string,
  description?: string,
  sortBy: TopicSortBy = 'newest'
): Promise<Interaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const filteredQuestion = censorText(question);
  const filteredDescription = description ? censorText(description) : null;

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      room_id: roomId,
      question: filteredQuestion,
      description: filteredDescription,
      created_by: userData.user.id,
      type: 'topic',
      status: 'active',
      sort_by: sortBy,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create topic: ${error.message}`);
  return mapInteraction(data);
}

async function toggleUpvote(
  responseId: string,
  membershipId: string
): Promise<{ added: boolean }> {
  // Check if upvote exists
  const { data: existing, error: checkError } = await supabase
    .from('topic_upvotes' as any)
    .select('id')
    .eq('response_id', responseId)
    .eq('membership_id', membershipId)
    .maybeSingle();

  if (checkError) throw new Error(`Failed to check upvote: ${checkError.message}`);

  if (existing) {
    // Remove upvote
    const { error: deleteError } = await supabase
      .from('topic_upvotes' as any)
      .delete()
      .eq('id', (existing as any).id);

    if (deleteError) throw new Error(`Failed to remove upvote: ${deleteError.message}`);
    return { added: false };
  } else {
    // Add upvote
    const { error: insertError } = await supabase
      .from('topic_upvotes' as any)
      .insert({
        response_id: responseId,
        membership_id: membershipId,
      });

    if (insertError) throw new Error(`Failed to add upvote: ${insertError.message}`);
    return { added: true };
  }
}

async function getTopicResponses(
  interactionId: string,
  membershipId: string,
  sortBy: TopicSortBy = 'newest'
): Promise<TopicResponseWithUpvotes[]> {
  // Get all responses
  const responses = await getResponses(interactionId);

  // Get all upvotes for these responses
  const responseIds = responses.map(r => r.id);
  const { data: upvotes, error: upvoteError } = await supabase
    .from('topic_upvotes' as any)
    .select('*')
    .in('response_id', responseIds);

  if (upvoteError) throw new Error(`Failed to get upvotes: ${upvoteError.message}`);

  // Count upvotes per response
  const upvoteCounts = new Map<string, number>();
  const userUpvotes = new Set<string>();

  (upvotes || []).forEach((upvote: any) => {
    upvoteCounts.set(upvote.response_id, (upvoteCounts.get(upvote.response_id) || 0) + 1);
    if (upvote.membership_id === membershipId) {
      userUpvotes.add(upvote.response_id);
    }
  });

  // Map responses with upvote data
  const responsesWithUpvotes: TopicResponseWithUpvotes[] = responses.map(r => ({
    ...r,
    upvoteCount: upvoteCounts.get(r.id) || 0,
    hasUpvoted: userUpvotes.has(r.id),
  }));

  // Sort based on sortBy parameter
  if (sortBy === 'upvotes') {
    responsesWithUpvotes.sort((a, b) => b.upvoteCount - a.upvoteCount);
  } else {
    responsesWithUpvotes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return responsesWithUpvotes;
}

async function deleteResponse(responseId: string): Promise<void> {
  const { error } = await supabase
    .from('responses')
    .delete()
    .eq('id', responseId);

  if (error) throw new Error(`Failed to delete response: ${error.message}`);
}

// --- Poll Methods ---

async function createPoll(
  roomId: string,
  question: string,
  options: string[],
  description?: string
): Promise<Interaction> {
  if (options.length < 2 || options.length > 5) {
    throw new Error('Poll must have between 2 and 5 options');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const filteredQuestion = censorText(question);
  const filteredDescription = description ? censorText(description) : null;
  const filteredOptions = options.map(opt => censorText(opt));

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      room_id: roomId,
      question: filteredQuestion,
      description: filteredDescription,
      created_by: userData.user.id,
      type: 'poll',
      status: 'active',
      poll_options: filteredOptions,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create poll: ${error.message}`);
  return mapInteraction(data);
}

async function submitPollVote(
  interactionId: string,
  membershipId: string,
  selectedOption: number
): Promise<PollVote> {
  if (!voteLimiter.canAct()) {
    throw new Error('Slow down! You are voting too fast.');
  }

  const { data, error } = await supabase
    .from('poll_votes' as any)
    .upsert(
      {
        interaction_id: interactionId,
        membership_id: membershipId,
        selected_option: selectedOption,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'interaction_id,membership_id' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to submit poll vote: ${error.message}`);
  return {
    id: (data as any).id,
    interactionId: (data as any).interaction_id,
    membershipId: (data as any).membership_id,
    selectedOption: (data as any).selected_option,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
  };
}

async function getPollResults(
  interactionId: string,
  membershipId: string
): Promise<PollResults> {
  // Get the interaction to get poll options
  const { data: interactionData, error: intError } = await supabase
    .from('interactions')
    .select('poll_options')
    .eq('id', interactionId)
    .single();

  if (intError) throw new Error(`Failed to fetch poll: ${intError.message}`);

  const pollOptions = ((interactionData as any).poll_options || []) as string[];

  // Get all votes for this poll
  const { data: votes, error: voteError } = await supabase
    .from('poll_votes' as any)
    .select('*')
    .eq('interaction_id', interactionId);

  if (voteError) throw new Error(`Failed to get poll votes: ${voteError.message}`);

  const totalVotes = votes?.length || 0;
  const voteCounts = new Map<number, number>();
  let userVote: number | undefined;

  (votes || []).forEach((vote: any) => {
    voteCounts.set(vote.selected_option, (voteCounts.get(vote.selected_option) || 0) + 1);
    if (vote.membership_id === membershipId) {
      userVote = vote.selected_option;
    }
  });

  const options = pollOptions.map((text, index) => ({
    text,
    voteCount: voteCounts.get(index) || 0,
    percentage: totalVotes > 0 ? ((voteCounts.get(index) || 0) / totalVotes) * 100 : 0,
    isSelected: userVote === index,
  }));

  return { options, totalVotes, userVote };
}

// --- Trivia Methods ---

async function createTriviaInteraction(params: {
  roomId: string;
  questionId: string;
  answerSeconds?: number;
  scoring?: {
    pointsCorrect?: number;
    pointsPartial?: number;
    speedBonusEnabled?: boolean;
    maxSpeedBonus?: number;
  };
  policy?: {
    allowAnswerChangeUntilClose?: boolean;
    lateSubmissions?: 'reject' | 'mark_late';
    showCorrectAnswerAtReveal?: boolean;
    showExplanationAtReveal?: boolean;
  };
}): Promise<Interaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const answerSeconds = params.answerSeconds ?? 60;
  const closesAt = new Date(Date.now() + answerSeconds * 1000).toISOString();
  const revealsAt = new Date(Date.now() + (answerSeconds + 10) * 1000).toISOString(); // 10s after close

  const timing = {
    opensAt: new Date().toISOString(),
    closesAt,
    revealsAt,
  };

  const scoring = {
    pointsCorrect: params.scoring?.pointsCorrect ?? 100,
    pointsPartial: params.scoring?.pointsPartial ?? 50,
    speedBonusEnabled: params.scoring?.speedBonusEnabled ?? false,
    maxSpeedBonus: params.scoring?.maxSpeedBonus ?? 0,
  };

  const policy = {
    allowAnswerChangeUntilClose: params.policy?.allowAnswerChangeUntilClose ?? false,
    lateSubmissions: params.policy?.lateSubmissions ?? 'reject',
    showCorrectAnswerAtReveal: params.policy?.showCorrectAnswerAtReveal ?? true,
    showExplanationAtReveal: params.policy?.showExplanationAtReveal ?? true,
  };

  // Use the database function to create interaction with snapshot
  const { data, error } = await supabase
    .rpc('create_trivia_interaction', {
      p_room_id: params.roomId,
      p_created_by: userData.user.id,
      p_question_id: params.questionId,
      p_timing: timing,
      p_scoring: scoring,
      p_policy: policy,
    });

  if (error) throw new Error(`Failed to create trivia interaction: ${error.message}`);
  if (!data) throw new Error('Failed to create trivia interaction: No data returned');

  // Fetch the created interaction with all fields
  const { data: interaction, error: fetchError } = await supabase
    .from('interactions')
    .select('*')
    .eq('id', data as unknown as string)
    .single();

  if (fetchError) throw new Error(`Failed to fetch created interaction: ${fetchError.message}`);
  return mapInteraction(interaction);
}

async function submitTriviaAnswer(
  interactionId: string,
  membershipId: string,
  payload: { format: 'multiple_choice'; selectedOptionId: string } | { format: 'written_answer'; rawText: string }
): Promise<any> {
  // Use the database function to submit answer and get immediate grading result
  const { data, error } = await supabase
    .rpc('submit_trivia_answer', {
      p_interaction_id: interactionId,
      p_member_id: membershipId,
      p_payload: payload,
    });

  if (error) throw new Error(`Failed to submit trivia answer: ${error.message}`);
  if (!data) throw new Error('Failed to submit trivia answer: No data returned');
  // Return the immediate grading result
  return data;
}


async function getTriviaSubmission(
  interactionId: string,
  membershipId: string
): Promise<TriviaSubmission | null> {
  // Use raw SQL query with proper typing
  const { data, error } = await supabase
    .from('trivia_submissions')
    .select('id, interaction_id, room_id, member_id, submitted_at, latency_ms, payload, status')
    .eq('interaction_id', interactionId)
    .eq('member_id', membershipId)
    .maybeSingle() as any; // Temporary until types are generated

  if (error) throw new Error(`Failed to fetch trivia submission: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    interactionId: data.interaction_id,
    roomId: data.room_id,
    memberId: data.member_id,
    submittedAt: data.submitted_at,
    latencyMs: data.latency_ms,
    payload: data.payload,
    status: data.status,
  };
}

async function getTriviaReveal(interactionId: string, _membershipId: string): Promise<TriviaReveal> {
  // Get the interaction to extract snapshot data
  const { data: interaction, error: intError } = await supabase
    .from('interactions')
    .select('settings')
    .eq('id', interactionId)
    .single();

  if (intError) throw new Error(`Failed to fetch interaction: ${intError.message}`);

  const settings = interaction.settings as unknown as TriviaInteractionSettings;
  const snapshot = settings.snapshot;

  // Get all submissions for this interaction
  const { data: submissions, error: subError } = await supabase
    .from('trivia_submissions')
    .select('id, interaction_id, room_id, member_id, submitted_at, latency_ms, payload, status')
    .eq('interaction_id', interactionId) as any;

  if (subError) throw new Error(`Failed to fetch submissions: ${subError.message}`);

  // Get all evaluations for this interaction
  const { data: evaluations, error: evalError } = await supabase
    .from('trivia_evaluations')
    .select('*')
    .eq('interaction_id', interactionId) as any;

  if (evalError) throw new Error(`Failed to fetch evaluations: ${evalError.message}`);

  // Calculate statistics
  const totalResponses = submissions?.length || 0;
  const correctResponses = evaluations?.filter((e: TriviaEvaluationRow) => e.result === 'correct').length || 0;
  const averageResponseTime = submissions?.reduce((acc: number, s: TriviaSubmissionRow) => acc + (s.latency_ms || 0), 0) / Math.max(totalResponses, 1) || 0;

  // Build answer distribution
  const distribution: Record<string, number> = {};
  submissions?.forEach((s: TriviaSubmissionRow) => {
    const payload = s.payload as { format: string; selectedOptionId?: string; rawText?: string };
    const key = payload.format === 'multiple_choice' 
      ? payload.selectedOptionId 
      : payload.rawText;
    if (key) distribution[key] = (distribution[key] || 0) + 1;
  });

  // Get correct answer
  let correctAnswer = '';
  if (snapshot.multipleChoice) {
    correctAnswer = snapshot.multipleChoice.correctOptionId;
  } else if (snapshot.writtenAnswer) {
    correctAnswer = snapshot.writtenAnswer.acceptedAliases[0] || '';
  }

  // TODO: Implement leaderboard delta calculation
  const leaderboardDelta = {
    topPlayers: [],
    personalDelta: undefined,
  };

  return {
    interactionId,
    correctAnswer,
    explanation: snapshot.explanation || '',
    statistics: {
      totalResponses,
      correctResponses,
      averageResponseTime,
      distribution,
    },
    leaderboardDelta,
  };
}

export const interactionService = {
  createInteraction,
  closeInteraction,
  getActiveInteractions,
  getAllInteractions,
  submitResponse,
  getResponses,
  getMyResponse,
  advanceToVoting,
  advanceToResults,
  submitVote,
  getVotes,
  createHeadlineInteraction,
  getVotingOptions,
  getHeadlineResults,
  submitHeadlineVote,
  // Topic methods
  createTopic,
  toggleUpvote,
  getTopicResponses,
  deleteResponse,
  // Poll methods
  createPoll,
  submitPollVote,
  getPollResults,
  // Trivia methods
  createTriviaInteraction,
  submitTriviaAnswer,
  getTriviaSubmission,
  getTriviaReveal,
};
