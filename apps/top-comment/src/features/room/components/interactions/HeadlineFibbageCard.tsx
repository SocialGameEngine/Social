import { useState, useCallback, useEffect } from 'react';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction, RoomMembership } from '../../../../shared/types';
import type { VotingOption, HeadlineResults } from '../../../../domain/types/interaction.types';

function PhaseChip({ status }: { status: string }) {
  const label =
    status === 'active' ? 'LIE' :
    status === 'voting' ? 'VOTE' :
    status === 'results' ? 'REVEAL' : 'CLOSED';

  const cls =
    status === 'active'
      ? 'chaos-chip chaos-chip--active'
      : status === 'voting'
      ? 'chaos-chip chaos-chip--voting'
      : status === 'results'
      ? 'chaos-chip chaos-chip--results'
      : 'chaos-chip chaos-chip--closed';

  return <span className={cls}>{label}</span>;
}

function CountdownChip({ endsAt }: { endsAt?: string | null }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (!endsAt) return null;

  const ms = new Date(endsAt).getTime() - now;
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, '0');

  return <span className="chaos-chip chaos-chip--timer">{m}:{ss}</span>;
}

interface HeadlineFibbageCardProps {
  interaction: Interaction;
  membership: RoomMembership | null;
  onClose: (interactionId: string) => void;
  onAdvanceToVoting: (interactionId: string) => void;
  onAdvanceToResults: (interactionId: string) => void;
}


function LieSubmissionPanel({
  interaction,
  onSubmit,
}: {
  interaction: Interaction;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settings = interaction.settings as any;
  const maxLen = settings?.answerMaxLen ?? 40;

  const submit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed.slice(0, maxLen));
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  }, [text, maxLen, onSubmit]);

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
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button
          onClick={submit}
          disabled={!text.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending…' : 'Submit'}
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-500">{text.length}/{maxLen}</div>
    </div>
  );
}

function VotingPanel({
  interaction,
  membership,
  onVote,
}: {
  interaction: Interaction;
  membership: RoomMembership | null;
  onVote: (optionId: string) => void;
}) {
  const [options, setOptions] = useState<VotingOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    interactionService.getVotingOptions(interaction.id, membership?.id || '')
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
    await onVote(selected);
  }, [selected, onVote]);

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
        Note: You can't vote for your own lie.
      </div>
    </div>
  );
}

function ResultsPanel({ 
  interaction, 
  membership 
}: { 
  interaction: Interaction; 
  membership: RoomMembership | null;
}) {
  const [results, setResults] = useState<HeadlineResults | null>(null);

  useEffect(() => {
    let alive = true;
    interactionService.getHeadlineResults(interaction.id, membership?.id || '')
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
        Loading results… (Backend RPC needed)
      </div>
    );
  }

  return (
    <div className="border-t pt-4">
      <div className="text-sm text-gray-700 mb-2">
        Real answer: <span className="font-semibold">{results.realAnswer}</span>
      </div>

      <div className="space-y-2">
        {results.options.map((o: VotingOption & { voteCount: number; fooledCount: number }) => (
          <div key={o.optionId} className="p-2 border rounded-md flex items-center justify-between">
            <div className="text-sm">
              {o.text}{' '}
              {o.isReal ? <span className="ml-2 text-xs font-semibold text-green-700">REAL</span> : null}
            </div>
            <div className="text-xs text-gray-600">
              {o.voteCount} votes
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Scoring: +2 for correct vote, +1 per team fooled, +3 for most-voted lie.
      </div>
    </div>
  );
}

export function HeadlineFibbageCard({
  interaction,
  membership,
  onClose,
  onAdvanceToVoting,
  onAdvanceToResults,
}: HeadlineFibbageCardProps) {
  const isHost = membership?.isHost ?? false;
  const settings = interaction.settings as any;

  const handleLieSubmit = useCallback(async (text: string) => {
    if (!membership) return;
    await interactionService.submitResponse(interaction.id, membership.id, text);
  }, [interaction.id, membership]);

  const handleVoteSubmit = useCallback(async (optionId: string) => {
    if (!membership) return;
    await interactionService.submitVote(interaction.id, membership.id, optionId);
  }, [interaction.id, membership]);

  return (
    <div className="headline-card relative overflow-visible bg-white rounded-lg shadow-md p-6 pt-10 mb-4">
      <div className="chaos-chip-rail">
        <div className="chaos-chip-stack-left">
          <span className="chaos-chip chaos-chip--type">HEADLINE</span>
          <PhaseChip status={interaction.status} />
        </div>
        <div className="chaos-chip-right">
          <CountdownChip endsAt={interaction.status === 'active' ? interaction.answerEndsAt : interaction.votingEndsAt} />
        </div>
      </div>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{settings?.headlineBlank || interaction.question}</h3>
          <div className="text-xs text-gray-500 mt-1">
            {settings?.sourceName} • {settings?.publishedAt ? new Date(settings.publishedAt).toLocaleDateString() : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHost && interaction.status !== 'closed' ? (
            <button
              onClick={() => onClose(interaction.id)}
              className="text-gray-400 hover:text-gray-600"
              title="Close"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Player panels */}
      {interaction.status === 'active' && membership ? (
        <LieSubmissionPanel 
          interaction={interaction} 
          onSubmit={handleLieSubmit}
        />
      ) : null}

      {interaction.status === 'voting' && membership ? (
        <VotingPanel 
          interaction={interaction} 
          membership={membership}
          onVote={handleVoteSubmit}
        />
      ) : null}

      {interaction.status === 'results' ? <ResultsPanel interaction={interaction} membership={membership} /> : null}

      {/* Host controls */}
      {isHost ? (
        <div className="mt-4 flex gap-2">
          {interaction.status === 'active' ? (
            <button
              onClick={() => onAdvanceToVoting(interaction.id)}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Start Voting
            </button>
          ) : null}
          {interaction.status === 'voting' ? (
            <button
              onClick={() => onAdvanceToResults(interaction.id)}
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
