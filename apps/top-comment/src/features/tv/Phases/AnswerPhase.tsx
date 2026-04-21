import type { SocialeRound, SocialeResponse, Socialite } from '../../../domain/types/sociale.types';
import type { TriviaSnapshotMultipleChoice, TriviaSnapshotWrittenAnswer } from '../../../domain/types/sociale.types';
import { Card } from '@social/ui';
import { useTheme } from '../../../shared/providers/ThemeProvider';

interface AnswerPhaseProps {
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  socialites: Socialite[];
  isDark?: boolean;
}

export function AnswerPhase({ currentRound, responses, socialites, isDark = false }: AnswerPhaseProps) {
  const { isDark: themeDark } = useTheme();
  const dark = isDark ?? themeDark;
  const answeredCount = new Set(responses.map(r => r.socialiteId)).size;

  if (!currentRound) return null;

  // For trivia rounds: show the question
  if (currentRound.type === 'trivia') {
    const settings = currentRound.settings as any;
    const snapshot = settings?.snapshot as TriviaSnapshotMultipleChoice | TriviaSnapshotWrittenAnswer | undefined;
    return (
      <div className="flex flex-col gap-6">
        <Card isDark={dark} className="text-center">
          <p className={`text-3xl font-bold ${!dark ? 'text-slate-900' : 'text-white'}`}>
            {snapshot?.prompt ?? currentRound.content ?? currentRound.title}
          </p>
        </Card>
        {/* Multiple choice options */}
        {'multipleChoice' in (snapshot ?? {}) && (
          <div className="grid grid-cols-2 gap-4">
            {(snapshot as TriviaSnapshotMultipleChoice).multipleChoice.options.map(opt => (
              <Card key={opt.id} isDark={dark} className="text-center text-lg font-semibold">
                {opt.text}
              </Card>
            ))}
          </div>
        )}
        <p className={`text-center text-sm ${!dark ? 'text-slate-500' : 'text-cyan-400'}`}>
          {answeredCount} / {socialites.length} answered
        </p>
      </div>
    );
  }

  // For topic rounds: show the topic prompt + live responses
  if (currentRound.type === 'topic') {
    return (
      <div className="flex flex-col gap-6">
        <Card isDark={dark} className="text-center">
          <p className={`text-3xl font-bold ${!dark ? 'text-slate-900' : 'text-white'}`}>
            {currentRound.content ?? currentRound.title}
          </p>
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {responses.map(r => {
            const author = socialites.find(s => s.id === r.socialiteId)?.displayName ?? 'Unknown';
            return (
              <Card key={r.id} isDark={dark} className="text-sm">
                <p>{typeof r.value === 'string' ? r.value : JSON.stringify(r.value)}</p>
                <p className={`mt-1 text-xs ${!dark ? 'text-slate-500' : 'text-cyan-400'}`}>{author}</p>
              </Card>
            );
          })}
        </div>
        <p className={`text-center text-sm ${!dark ? 'text-slate-500' : 'text-cyan-400'}`}>
          {answeredCount} / {socialites.length} responded
        </p>
      </div>
    );
  }

  return null;
}
