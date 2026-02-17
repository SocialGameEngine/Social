/**
 * Spicy But True – Fibbage Edition (Single Headline Interaction)
 *
 * This is a scaffolded reference file adapted from your "Complete Interaction System".
 * It is designed for ONE headline at a time:
 *   active  -> lie submission
 *   voting  -> vote which option is real (includes real answer + lies)
 *   results -> reveal + scoring
 *
 * This does NOT need to fully work yet. It’s meant to be the file you want:
 * - Clear data shapes
 * - Clear phase mapping
 * - Clear TODOs for backend/RPC/RLS
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ========================
// TYPES
// ========================

export type InteractionType = "headline_fibbage";
export type InteractionStatus = "active" | "voting" | "results" | "closed";

export interface HeadlineFibbageSettings {
  mode: "headline_fibbage";

  // From your DB (preloaded headlines)
  headlineId: string;
  headlineBlank: string; // e.g. "Tech CEO sues former employee over leaked ____"
  sourceName: string;
  publishedAt: string; // ISO

  // Host/ops controls
  answerMaxLen?: number; // e.g. 40
  profanityFilter?: "none" | "basic";
}

export interface Interaction {
  id: string;
  roomId: string;
  createdBy: string;
  type: InteractionType;
  status: InteractionStatus;

  // For this mode, question == headlineBlank (nice for reusing UI)
  question: string;
  description?: string | null;

  settings: HeadlineFibbageSettings;

  responseCount: number;
  voteCount: number;

  answerEndsAt?: string | null;
  answerSeconds?: number;

  votingEndsAt?: string | null;
  votingSeconds?: number;

  createdAt: string;
  closedAt?: string | null;
}

export interface InteractionResponse {
  id: string;
  interactionId: string;
  membershipId: string;
  text: string;
  createdAt: string;
  playerName?: string;
  mascotId?: number;
}

export interface InteractionVote {
  id: string;
  interactionId: string;
  membershipId: string;
  // In this mode we vote for an OPTION, not necessarily a response row directly.
  // But you can keep responseId if your backend represents options as response rows.
  responseId: string;
  createdAt: string;
}

export interface RoomMembership {
  id: string;
  roomId: string;
  userId: string;
  playerName: string;
  mascotId: number;
  isHost: boolean;
  isBanned: boolean;
  joinedAt: string;
}

export interface User {
  id: string;
  email?: string;
}

// Voting options returned by backend during voting/results
export interface VotingOption {
  optionId: string; // could be responseId, or a synthetic id
  text: string;
  // Only returned in results phase (or host view)
  isReal?: boolean;
  // Optional for results display
  authorMembershipId?: string | null;
}

// Results payload (recommended as RPC output)
export interface HeadlineResults {
  realAnswer: string;
  options: Array<
    VotingOption & {
      voteCount: number;
      fooledTeams: number; // convenience, optional
    }
  >;
  // teamScoresDelta?: Record<teamId, number>
}

// ========================
// SUPABASE CLIENT
// ========================

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseClient(): SupabaseClient<any> {
  if (!supabaseClient) {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase env vars");
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// ========================
// SERVICE LAYER (SCAFFOLD)
// ========================

class HeadlineInteractionService {
  private supabase = getSupabaseClient();

  // ---- Mappers
  private mapInteraction(data: any): Interaction {
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
    };
  }

  private mapResponse(data: any): InteractionResponse {
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

  private mapVote(data: any): InteractionVote {
    return {
      id: data.id,
      interactionId: data.interaction_id,
      membershipId: data.membership_id,
      responseId: data.response_id,
      createdAt: data.created_at,
    };
  }

  // ---- Create headline interaction (host only)
  async createHeadlineInteraction(params: {
    roomId: string;
    headlineId: string;
    headlineBlank: string;
    sourceName: string;
    publishedAt: string;
    answerSeconds?: number;
    votingSeconds?: number;
  }): Promise<Interaction> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
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

    const { data, error } = await this.supabase
      .from("interactions")
      .insert({
        room_id: params.roomId,
        created_by: userData.user.id,
        type: "headline_fibbage",
        status: "active",
        question: params.headlineBlank,
        description: `${params.sourceName} • ${new Date(params.publishedAt).toLocaleDateString()}`,
        settings,
        answer_seconds: answerSeconds,
        answer_ends_at: new Date(Date.now() + answerSeconds * 1000).toISOString(),
        voting_seconds: votingSeconds, // optional to store now
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create interaction: ${error.message}`);
    return this.mapInteraction(data);
  }

  // ---- Submit lie (one per team device/membership)
  async submitLie(interactionId: string, membershipId: string, text: string): Promise<InteractionResponse> {
    const { data, error } = await this.supabase
      .from("responses")
      .upsert(
        {
          interaction_id: interactionId,
          membership_id: membershipId,
          text,
        },
        { onConflict: "interaction_id,membership_id" }
      )
      .select("*, room_memberships:membership_id(player_name, mascot_id)")
      .single();

    if (error) throw new Error(`Failed to submit lie: ${error.message}`);
    return this.mapResponse(data);
  }

  // ---- Advance to voting (host triggers)
  async advanceToVoting(interactionId: string, votingSeconds = 60): Promise<boolean> {
    // You already have an RPC in your reference for this pattern.
    // Recommended: when advancing, server should:
    // - validate status == active
    // - ensure real answer exists (from your headline DB)
    // - snapshot / lock response set for voting
    const { data, error } = await this.supabase.rpc("advance_interaction_to_voting", {
      p_interaction_id: interactionId,
      p_voting_seconds: votingSeconds,
    });
    if (error) throw new Error(`Failed to advance to voting: ${error.message}`);
    return data;
  }

  async advanceToResults(interactionId: string): Promise<boolean> {
    // MVP: direct update. Better: RPC that validates status and computes scores.
    const { error } = await this.supabase.from("interactions").update({ status: "results" }).eq("id", interactionId);
    if (error) throw new Error(`Failed to advance to results: ${error.message}`);
    return true;
  }

  // ---- Voting options (critical)
  async getVotingOptions(interactionId: string): Promise<VotingOption[]> {
    // TODO: Implement as RPC or view.
    // Must return:
    // - all lies
    // - the real answer (inserted server-side)
    // - shuffled order (or let client shuffle, but server should not leak isReal during voting)
    //
    // Suggested RPC:
    //   rpc('get_headline_voting_options', { p_interaction_id, p_membership_id })
    //
    // The RPC should also exclude the caller's own lie OR enforce on submitVote.
    throw new Error("TODO: implement getVotingOptions RPC");
  }

  // ---- Submit vote
  async submitVote(interactionId: string, membershipId: string, optionId: string): Promise<InteractionVote> {
    // If options map 1:1 to response rows, optionId == responseId.
    // Otherwise, you’ll want a separate "interaction_options" table and store option_id here.
    const { data, error } = await this.supabase
      .from("interaction_votes")
      .upsert(
        { interaction_id: interactionId, membership_id: membershipId, response_id: optionId },
        { onConflict: "interaction_id,membership_id" }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to submit vote: ${error.message}`);
    return this.mapVote(data);
  }

  // ---- Results payload (reveal + scoring)
  async getResults(interactionId: string): Promise<HeadlineResults> {
    // TODO: RPC should:
    // - return real answer
    // - return each option with vote counts
    // - (optionally) compute per-team deltas and write to scores table
    throw new Error("TODO: implement getResults RPC");
  }

  // ---- List interactions
  async getInteractions(roomId: string): Promise<Interaction[]> {
    const { data, error } = await this.supabase
      .from("interactions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch interactions: ${error.message}`);
    return (data || []).map((row: any) => this.mapInteraction(row));
  }
}

const headlineService = new HeadlineInteractionService();

// ========================
// HOOKS (ROOM + SINGLE ACTIVE INTERACTION)
// ========================

export function useHeadlineInteractions(roomId?: string) {
  const supabase = getSupabaseClient();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const all = await headlineService.getInteractions(roomId);
    setInteractions(all.filter((i) => i.status !== "closed"));
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [roomId, refresh]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`headline_interactions:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interactions", filter: `room_id=eq.${roomId}` },
        refresh
      )
      // IMPORTANT: your upsert on responses triggers UPDATE often, not INSERT.
      .on("postgres_changes", { event: "*", schema: "public", table: "responses" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "interaction_votes" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, refresh, supabase]);

  const activeHeadline = useMemo(() => interactions.find((i) => i.type === "headline_fibbage" && i.status !== "closed") ?? null, [
    interactions,
  ]);

  return { interactions, activeHeadline, isLoading, refresh };
}

// ========================
// UI COMPONENTS
// ========================

function PhaseBadge({ status }: { status: InteractionStatus }) {
  const label =
    status === "active" ? "Lie Submission" : status === "voting" ? "Voting" : status === "results" ? "Reveal" : "Closed";

  const cls =
    status === "active"
      ? "bg-blue-100 text-blue-800"
      : status === "voting"
      ? "bg-purple-100 text-purple-800"
      : status === "results"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function Countdown({ endsAt }: { endsAt?: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - now;
  const s = Math.max(0, Math.floor(ms / 1000));
  return <div className="text-xs text-gray-500">Time left: {s}s</div>;
}

function LieSubmissionPanel({
  interaction,
  membership,
}: {
  interaction: Interaction;
  membership: RoomMembership;
}) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxLen = interaction.settings.answerMaxLen ?? 40;

  const submit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await headlineService.submitLie(interaction.id, membership.id, trimmed.slice(0, maxLen));
      // keep text? Fibbage usually locks; MVP can clear
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  }, [text, interaction.id, membership.id, maxLen]);

  return (
    <div className="border-t pt-4">
      <div className="text-sm text-gray-700 mb-2">Write a believable fill for the blank.</div>
      <div className="flex gap-2">
        <input
          value={text}
          maxLength={maxLen}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your lie…"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          onClick={submit}
          disabled={!text.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Sending…" : "Submit"}
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-500">{text.length}/{maxLen}</div>
    </div>
  );
}

function VotingPanel({
  interaction,
  membership,
}: {
  interaction: Interaction;
  membership: RoomMembership;
}) {
  const [options, setOptions] = useState<VotingOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    headlineService
      .getVotingOptions(interaction.id)
      .then((opts) => alive && setOptions(opts))
      .catch((e) => {
        console.error(e);
        alive && setOptions([]);
      })
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, [interaction.id]);

  const submitVote = useCallback(async () => {
    if (!selected) return;
    await headlineService.submitVote(interaction.id, membership.id, selected);
  }, [interaction.id, membership.id, selected]);

  return (
    <div className="border-t pt-4">
      <div className="text-sm text-gray-700 mb-2">Vote for the real answer.</div>
      {isLoading ? (
        <div className="text-sm text-gray-500">Loading options…</div>
      ) : (
        <div className="space-y-2">
          {options.map((o) => (
            <label key={o.optionId} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
              <input
                type="radio"
                name={`vote-${interaction.id}`}
                value={o.optionId}
                checked={selected === o.optionId}
                onChange={() => setSelected(o.optionId)}
              />
              <span className="text-sm">{o.text}</span>
            </label>
          ))}
          <button
            onClick={submitVote}
            disabled={!selected}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Lock Vote
          </button>
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">
        TODO: enforce “can’t vote for your own lie” server-side.
      </div>
    </div>
  );
}

function ResultsPanel({ interaction }: { interaction: Interaction }) {
  const [results, setResults] = useState<HeadlineResults | null>(null);

  useEffect(() => {
    let alive = true;
    headlineService
      .getResults(interaction.id)
      .then((r) => alive && setResults(r))
      .catch((e) => {
        console.error(e);
        alive && setResults(null);
      });
    return () => {
      alive = false;
    };
  }, [interaction.id]);

  if (!results) {
    return (
      <div className="border-t pt-4 text-sm text-gray-500">
        Loading results… (TODO: implement getResults RPC)
      </div>
    );
  }

  return (
    <div className="border-t pt-4">
      <div className="text-sm text-gray-700 mb-2">
        Real answer: <span className="font-semibold">{results.realAnswer}</span>
      </div>

      <div className="space-y-2">
        {results.options.map((o) => (
          <div key={o.optionId} className="p-2 border rounded-md flex items-center justify-between">
            <div className="text-sm">
              {o.text}{" "}
              {o.isReal ? <span className="ml-2 text-xs font-semibold text-green-700">REAL</span> : null}
            </div>
            <div className="text-xs text-gray-600">
              {o.voteCount} votes
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        TODO: scoring: +2 correct vote, +1 per team fooled, +3 most-voted lie.
      </div>
    </div>
  );
}

// Single interaction card for this mode
function HeadlineInteractionCard({
  interaction,
  membership,
  onHostAdvanceToVoting,
  onHostAdvanceToResults,
  onHostClose,
}: {
  interaction: Interaction;
  membership: RoomMembership | null;
  onHostAdvanceToVoting: (interactionId: string) => Promise<void>;
  onHostAdvanceToResults: (interactionId: string) => Promise<void>;
  onHostClose: (interactionId: string) => Promise<void>;
}) {
  const isHost = membership?.isHost ?? false;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{interaction.settings.headlineBlank}</h3>
          <div className="text-xs text-gray-500 mt-1">
            {interaction.settings.sourceName} • {new Date(interaction.settings.publishedAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PhaseBadge status={interaction.status} />
          {isHost && interaction.status !== "closed" ? (
            <button
              onClick={() => onHostClose(interaction.id)}
              className="text-gray-400 hover:text-gray-600"
              title="Close"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div>
          {interaction.responseCount} lies • {interaction.voteCount} votes
        </div>
        <Countdown endsAt={interaction.status === "active" ? interaction.answerEndsAt : interaction.votingEndsAt} />
      </div>

      {/* Player/Team device panels */}
      {interaction.status === "active" && membership ? (
        <LieSubmissionPanel interaction={interaction} membership={membership} />
      ) : null}

      {interaction.status === "voting" && membership ? (
        <VotingPanel interaction={interaction} membership={membership} />
      ) : null}

      {interaction.status === "results" ? <ResultsPanel interaction={interaction} /> : null}

      {/* Host controls */}
      {isHost ? (
        <div className="mt-4 flex gap-2">
          {interaction.status === "active" ? (
            <button
              onClick={() => onHostAdvanceToVoting(interaction.id)}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Start Voting
            </button>
          ) : null}
          {interaction.status === "voting" ? (
            <button
              onClick={() => onHostAdvanceToResults(interaction.id)}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Reveal Results
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ========================
// MAIN COMPONENT
// ========================

export function HeadlineFibbageOneAtATime({
  roomId,
  user,
  memberships,
}: {
  roomId: string;
  user: User;
  memberships: RoomMembership[];
}) {
  const { activeHeadline } = useHeadlineInteractions(roomId);

  const myMembership = useMemo(() => memberships.find((m) => m.userId === user.id) ?? null, [memberships, user.id]);

  const isHost = myMembership?.isHost ?? false;

  // Host: choose headline from DB (not implemented here)
  const startFromDb = useCallback(async () => {
    if (!isHost) return;

    // TODO: You’ll fetch a headline row from your "headlines" table:
    // const headline = await db.getNextHeadline(roomId)
    // For now, placeholder:
    const headline = {
      id: "headline_123",
      blank: "Tech CEO sues former employee over leaked ____",
      source: "Business Insider",
      publishedAt: new Date().toISOString(),
    };

    await headlineService.createHeadlineInteraction({
      roomId,
      headlineId: headline.id,
      headlineBlank: headline.blank,
      sourceName: headline.source,
      publishedAt: headline.publishedAt,
      answerSeconds: 90,
      votingSeconds: 60,
    });
  }, [isHost, roomId]);

  const hostAdvanceToVoting = useCallback(async (interactionId: string) => {
    await headlineService.advanceToVoting(interactionId, 60);
  }, []);

  const hostAdvanceToResults = useCallback(async (interactionId: string) => {
    await headlineService.advanceToResults(interactionId);
  }, []);

  const hostClose = useCallback(async (interactionId: string) => {
    const supabase = getSupabaseClient();
    await supabase.from("interactions").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", interactionId);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">Spicy But True</h1>
        {isHost ? (
          <button onClick={startFromDb} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Start Next Headline
          </button>
        ) : null}
      </div>

      {!activeHeadline ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
          {isHost ? "No active headline. Start the next one." : "Waiting for the host to start the next headline…"}
        </div>
      ) : (
        <HeadlineInteractionCard
          interaction={activeHeadline}
          membership={myMembership}
          onHostAdvanceToVoting={hostAdvanceToVoting}
          onHostAdvanceToResults={hostAdvanceToResults}
          onHostClose={hostClose}
        />
      )}

      <div className="mt-6 text-xs text-gray-500">
        MVP notes:
        <ul className="list-disc ml-5 mt-1">
          <li>Assumes one device per team (membership == team device).</li>
          <li>Needs RPC: get_headline_voting_options (inject truth server-side).</li>
          <li>Needs RPC: get_headline_results (reveal + vote counts + scoring).</li>
          <li>Enforce “can’t vote for your own lie” on the server.</li>
        </ul>
      </div>
    </div>
  );
}

export default HeadlineFibbageOneAtATime;
