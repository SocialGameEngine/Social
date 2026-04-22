import { useState } from 'react';
import type { AmbientRound, AmbientRoundType, TriviaFormat } from '../types/ambientRounds';

interface Props {
  mode: 'create' | 'edit';
  initialData?: Partial<AmbientRound>;
  nextOrderIndex: number; // passed from parent for new rounds
  onSubmit: (data: Omit<AmbientRound, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export default function AmbientRoundForm({ mode, initialData, nextOrderIndex, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<AmbientRoundType>(initialData?.type ?? 'trivia');
  const [format, setFormat] = useState<TriviaFormat>(() => {
    const s = initialData?.settings as any;
    return s?.format ?? 'multiple_choice';
  });
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [prompt, setPrompt] = useState(() => {
    const s = initialData?.settings as any;
    return s?.snapshot?.prompt ?? s?.topic ?? '';
  });
  const [explanation, setExplanation] = useState(() => {
    const s = initialData?.settings as any;
    return s?.snapshot?.explanation ?? '';
  });
  const [correctAnswer, setCorrectAnswer] = useState(() => {
    const s = initialData?.settings as any;
    return s?.snapshot?.writtenAnswer?.correctAnswer ?? '';
  });
  const [acceptedAnswers, setAcceptedAnswers] = useState(() => {
    const s = initialData?.settings as any;
    return (s?.snapshot?.writtenAnswer?.acceptedAnswers ?? []).join('\n');
  });
  // Multiple choice options
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>(() => {
    const s = initialData?.settings as any;
    return s?.snapshot?.multipleChoice?.options ?? [
      { id: 'a', text: '' }, { id: 'b', text: '' },
      { id: 'c', text: '' }, { id: 'd', text: '' },
    ];
  });
  const [correctOptionId, setCorrectOptionId] = useState(() => {
    const s = initialData?.settings as any;
    return s?.snapshot?.multipleChoice?.correctOptionId ?? 'a';
  });
  const [categoryKey, setCategoryKey] = useState(() => {
    const s = initialData?.settings as any;
    return s?.categoryKey ?? '';
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES = [
    'geography', 'history', 'science', 'pop_culture', 'music',
    'food_drink', 'sport', 'wordplay', 'tech', 'nature',
  ];

  const buildSettings = () => {
    if (type === 'topic') {
      return {
        topic: prompt,
        sortBy: 'upvotes' as const,
        allowUpvotes: true,
        answerSeconds: 60,
        votingSeconds: 30,
        resultsSeconds: 15,
      };
    }
    const base = {
      format,
      categoryKey: categoryKey || undefined,
      answerSeconds: format === 'multiple_choice' ? 30 : 45,
      revealSeconds: 8,
      resultsSeconds: 10,
      pointsCorrect: 100,
      speedBonusEnabled: format === 'multiple_choice',
    };
    if (format === 'multiple_choice') {
      return {
        ...base,
        snapshot: {
          prompt,
          explanation: explanation || null,
          multipleChoice: { options, correctOptionId },
        },
      };
    }
    return {
      ...base,
      snapshot: {
        prompt,
        explanation: explanation || null,
        writtenAnswer: {
          correctAnswer,
          acceptedAnswers: acceptedAnswers.split('\n').map((s: string) => s.trim()).filter(Boolean),
        },
      },
    };
  };

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!prompt.trim()) { setError('Prompt/topic is required.'); return; }
    if (type === 'trivia' && format === 'multiple_choice') {
      if (options.some(o => !o.text.trim())) { setError('All 4 options are required.'); return; }
    }
    if (type === 'trivia' && format === 'written_answer') {
      if (!correctAnswer.trim()) { setError('Correct answer is required.'); return; }
    }
    setSubmitting(true);
    try {
      await onSubmit({
        order_index: initialData?.order_index ?? nextOrderIndex,
        type,
        title: title.trim(),
        content: prompt.trim() || null,
        settings: buildSettings() as any,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="library-form">
      <h2>{mode === 'create' ? 'Add Ambient Round' : 'Edit Ambient Round'}</h2>

      {/* Type selector */}
      <div className="form-group">
        <label>Type</label>
        <select value={type} onChange={e => setType(e.target.value as AmbientRoundType)}>
          <option value="trivia">Trivia</option>
          <option value="topic">Topic (open-ended)</option>
        </select>
      </div>

      {type === 'trivia' && (
        <div className="form-group">
          <label>Format</label>
          <select value={format} onChange={e => setFormat(e.target.value as TriviaFormat)}>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="written_answer">Written Answer</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Title (short display label)</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. World Capitals" />
      </div>

      <div className="form-group">
        <label>{type === 'topic' ? 'Topic / Prompt' : 'Question'}</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} />
      </div>

      {type === 'trivia' && (
        <div className="form-group">
          <label>Category</label>
          <select value={categoryKey} onChange={e => setCategoryKey(e.target.value)}>
            <option value="">-- None --</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {type === 'trivia' && format === 'multiple_choice' && (
        <>
          {options.map((opt, i) => (
            <div key={opt.id} className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ minWidth: 60 }}>
                <input
                  type="radio"
                  name="correct"
                  checked={correctOptionId === opt.id}
                  onChange={() => setCorrectOptionId(opt.id)}
                />
                {' '}Option {opt.id.toUpperCase()}
              </label>
              <input
                value={opt.text}
                onChange={e => {
                  const next = [...options];
                  next[i] = { ...opt, text: e.target.value };
                  setOptions(next);
                }}
                placeholder={`Option ${opt.id.toUpperCase()}`}
                style={{ flex: 1 }}
              />
            </div>
          ))}
          <p className="hint">Select the radio button next to the correct option.</p>
        </>
      )}

      {type === 'trivia' && format === 'written_answer' && (
        <>
          <div className="form-group">
            <label>Correct Answer (canonical)</label>
            <input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Accepted Answers (one per line -- include abbreviations and common spellings)</label>
            <textarea value={acceptedAnswers} onChange={e => setAcceptedAnswers(e.target.value)} rows={3} />
          </div>
        </>
      )}

      {type === 'trivia' && (
        <div className="form-group">
          <label>Explanation (shown after reveal, optional)</label>
          <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? 'Saving...' : mode === 'create' ? 'Add Round' : 'Save Changes'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
      </div>
    </div>
  );
}
