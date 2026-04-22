import { useState } from 'react';

interface Props {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    name: string;
    description: string;
  };
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  onCancel: () => void;
}

export default function TriviaLibraryForm({ mode, initialData, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    if (!name.trim()) {
      setError('Library name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
      });
      setSubmitting(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="library-form">
      <h2>{mode === 'create' ? 'Create Trivia Library' : 'Edit Trivia Library'}</h2>

      <div className="form-group">
        <label>Library Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Geography Trivia, Science Questions"
        />
      </div>

      <div className="form-group">
        <label>Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe what kind of trivia questions this library contains..."
        />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? 'Saving...' : mode === 'create' ? 'Create Library' : 'Save Changes'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
      </div>
    </div>
  );
}
