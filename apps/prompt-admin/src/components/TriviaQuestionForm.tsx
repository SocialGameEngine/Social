import { useState } from 'react';
import type { TriviaQuestionWithDetails } from '../types/trivia';

interface Props {
  mode: 'create' | 'edit';
  initialData?: TriviaQuestionWithDetails;
  packId: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function TriviaQuestionForm({ mode, initialData, packId, onSubmit, onCancel }: Props) {
  const [format, setFormat] = useState<'multiple_choice' | 'written_answer'>(
    initialData?.format ?? 'multiple_choice'
  );
  const [category, setCategory] = useState(initialData?.category_key ?? '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    initialData?.difficulty ?? 'medium'
  );
  const [prompt, setPrompt] = useState(initialData?.prompt ?? '');
  const [explanation, setExplanation] = useState(initialData?.explanation ?? '');
  const [hint, setHint] = useState(initialData?.hint ?? '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') ?? '');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    initialData?.status ?? 'draft'
  );
  
  // Multiple choice options
  const [options, setOptions] = useState(
    initialData?.options ?? [
      { option_id: 'a', option_text: '', is_correct: false, sort_order: 0 },
      { option_id: 'b', option_text: '', is_correct: false, sort_order: 1 },
      { option_id: 'c', option_text: '', is_correct: false, sort_order: 2 },
      { option_id: 'd', option_text: '', is_correct: false, sort_order: 3 },
    ]
  );
  
  // Written answer aliases
  const [aliases, setAliases] = useState(
    initialData?.aliases?.map(a => a.alias_text).join('\n') ?? ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'geography', 'history', 'science', 'pop_culture', 'music',
    'food_drink', 'sport', 'wordplay', 'tech', 'nature',
  ];

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    
    if (!prompt.trim()) {
      setError('Question is required.');
      return;
    }
    
    if (format === 'multiple_choice') {
      const hasCorrect = options.some(opt => opt.is_correct);
      const allFilled = options.every(opt => opt.option_text.trim());
      if (!allFilled) {
        setError('All options must be filled.');
        return;
      }
      if (!hasCorrect) {
        setError('One option must be marked as correct.');
        return;
      }
    }
    
    if (format === 'written_answer' && !aliases.trim()) {
      setError('At least one accepted answer is required for written questions.');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        pack_id: packId,
        format,
        category_key: category,
        difficulty,
        prompt: prompt.trim(),
        explanation: explanation.trim() || null,
        hint: hint.trim() || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status,
        ...(format === 'multiple_choice' && {
          options: options.map(opt => ({
            ...opt,
            option_text: opt.option_text.trim(),
          })),
        }),
        ...(format === 'written_answer' && {
          aliases: aliases.split('\n').map(a => ({
            alias_text: a.trim(),
            alias_normalized: a.trim().toLowerCase(),
            match_type: 'alias' as const,
          })),
        }),
      };

      await onSubmit(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
      setSubmitting(false);
    }
  };

  const updateOption = (index: number, field: string, value: any) => {
    const next = [...options];
    next[index] = { ...next[index], [field]: value };
    setOptions(next);
  };

  const setCorrectOption = (correctId: string) => {
    setOptions(options.map(opt => ({ ...opt, is_correct: opt.option_id === correctId })));
  };

  return (
    <div className="library-form">
      <h2>{mode === 'create' ? 'Add Trivia Question' : 'Edit Trivia Question'}</h2>

      <div className="form-group">
        <label>Format</label>
        <select value={format} onChange={e => setFormat(e.target.value as any)}>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="written_answer">Written Answer</option>
        </select>
      </div>

      <div className="form-group">
        <label>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Select category...</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Difficulty</label>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="form-group">
        <label>Question</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="Enter your trivia question..."
        />
      </div>

      <div className="form-group">
        <label>Explanation (optional)</label>
        <textarea
          value={explanation}
          onChange={e => setExplanation(e.target.value)}
          rows={2}
          placeholder="Explain the answer for educational value..."
        />
      </div>

      <div className="form-group">
        <label>Hint (optional)</label>
        <input
          type="text"
          value={hint}
          onChange={e => setHint(e.target.value)}
          placeholder="Give players a hint if needed..."
        />
      </div>

      <div className="form-group">
        <label>Tags (optional)</label>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="e.g., europe, capitals, geography"
        />
      </div>

      <div className="form-group">
        <label>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {format === 'multiple_choice' && (
        <div className="form-group">
          <label>Answer Options</label>
          {options.map((option, index) => (
            <div key={option.option_id} className="option-row">
              <label>
                <input
                  type="radio"
                  name="correct"
                  checked={option.is_correct}
                  onChange={() => setCorrectOption(option.option_id)}
                />
                {' '}Option {option.option_id.toUpperCase()}
              </label>
              <input
                type="text"
                value={option.option_text}
                onChange={e => updateOption(index, 'option_text', e.target.value)}
                placeholder={`Option ${option.option_id.toUpperCase()}`}
              />
            </div>
          ))}
          <p className="hint">Select the radio button next to the correct answer.</p>
        </div>
      )}

      {format === 'written_answer' && (
        <div className="form-group">
          <label>Accepted Answers (one per line)</label>
          <textarea
            value={aliases}
            onChange={e => setAliases(e.target.value)}
            rows={4}
            placeholder="Correct answer&#10;Alternative spelling&#10;Common abbreviation"
          />
          <p className="hint">Include the correct answer and common variations.</p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? 'Saving...' : mode === 'create' ? 'Add Question' : 'Save Changes'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
      </div>
    </div>
  );
}
