import { useState } from 'react';
import type { AmbientRoundExportRow } from '../types/ambientRounds';

interface Props {
  onImport: (rows: AmbientRoundExportRow[]) => Promise<void>;
}

export default function AmbientRoundBulkImport({ onImport }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (): Promise<void> => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError('Invalid JSON.');
      return;
    }
    if (!Array.isArray(parsed)) {
      setError('Expected a JSON array.');
      return;
    }
    if (parsed.length === 0) {
      setError('Array is empty.');
      return;
    }
    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i] as any;
      if (!row?.type || !row?.title || !row?.settings) {
        setError(`Row ${i}: must have type, title, and settings fields.`);
        return;
      }
      if (row.type !== 'trivia' && row.type !== 'topic') {
        setError(`Row ${i}: type must be "trivia" or "topic" (got "${row.type}").`);
        return;
      }
      if (typeof row.settings.answerSeconds !== 'number') {
        setError(`Row ${i}: settings.answerSeconds must be a number.`);
        return;
      }
      if (typeof row.settings.resultsSeconds !== 'number') {
        setError(`Row ${i}: settings.resultsSeconds must be a number.`);
        return;
      }
      if (row.type === 'trivia') {
        if (typeof row.settings.revealSeconds !== 'number') {
          setError(`Row ${i} (trivia): settings.revealSeconds must be a number.`);
          return;
        }
        if (!row.settings.format) {
          setError(`Row ${i} (trivia): settings.format is required.`);
          return;
        }
        if (row.settings.format === 'multiple_choice') {
          if (!Array.isArray(row.settings.options) || row.settings.options.length < 2) {
            setError(`Row ${i} (trivia): multiple_choice requires settings.options array.`);
            return;
          }
          const correctCount = row.settings.options.filter((o: any) => o?.is_correct).length;
          if (correctCount !== 1) {
            setError(`Row ${i} (trivia): exactly one option must have is_correct: true.`);
            return;
          }
        }
        if (typeof row.settings.correctAnswer !== 'string' || row.settings.correctAnswer.length === 0) {
          setError(`Row ${i} (trivia): settings.correctAnswer must be a non-empty string.`);
          return;
        }
      } else if (row.type === 'topic') {
        if (typeof row.settings.votingSeconds !== 'number') {
          setError(`Row ${i} (topic): settings.votingSeconds must be a number.`);
          return;
        }
      }
    }
    try {
      await onImport(parsed as AmbientRoundExportRow[]);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  };

  const handleFile = async (file: File): Promise<void> => {
    setText(await file.text());
  };

  return (
    <div className="bulk-import">
      <h3>Bulk Import</h3>
      <p className="hint">
        Paste a JSON array of ambient rounds, or upload the seed file.
        <strong> This replaces all existing rounds.</strong>
      </p>
      <label className="btn btn-secondary">
        Upload JSON
        <input
          type="file"
          accept="application/json"
          hidden
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.currentTarget.value = '';
          }}
        />
      </label>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={10}
        placeholder='[{ "order_index": 0, "type": "trivia", ... }]'
        style={{ width: '100%', marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
      />
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary" onClick={() => void handleImport()} disabled={!text.trim()}>
        Import and Replace All
      </button>
    </div>
  );
}
