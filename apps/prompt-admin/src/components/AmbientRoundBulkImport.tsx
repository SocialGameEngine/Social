import { useState } from 'react';
import type { AmbientRoundExportRow } from '../types/ambientRounds';

// Normalize all formats to full database schema
function normalizeRow(row: any, index: number): any {
  const type = row.type;

  // NEW MINIMAL FORMAT: trivia_multiple_choice
  if (type === 'trivia_multiple_choice') {
    const correctIndex = (row.options || []).findIndex((opt: any) => opt.correct);
    const options = (row.options || []).map((opt: any, i: number) => ({
      id: String.fromCharCode(97 + i), // a, b, c, d
      text: opt.text,
    }));
    const correctOptionId = correctIndex >= 0 ? String.fromCharCode(97 + correctIndex) : 'a';

    return {
      order_index: index,
      type: 'trivia',
      title: row.title,
      content: row.question || null,
      explanation: row.explanation || null,
      hint: row.hint || null,
      settings: {
        format: 'multiple_choice',
        categoryKey: row.category || 'general',
        answerSeconds: 30,
        revealSeconds: 15,
        resultsSeconds: 15,
        pointsCorrect: 100,
        speedBonusEnabled: true,
        snapshot: {
          prompt: row.question || '',
          explanation: row.explanation || null,
          multipleChoice: { options, correctOptionId },
        },
      },
    };
  }

  // NEW MINIMAL FORMAT: trivia_written
  if (type === 'trivia_written') {
    return {
      order_index: index,
      type: 'trivia',
      title: row.title,
      content: row.question || null,
      explanation: row.explanation || null,
      hint: row.hint || null,
      settings: {
        format: 'written_answer',
        categoryKey: row.category || 'general',
        answerSeconds: 45,
        revealSeconds: 15,
        resultsSeconds: 15,
        pointsCorrect: 100,
        speedBonusEnabled: true,
        snapshot: {
          prompt: row.question || '',
          explanation: row.explanation || null,
          writtenAnswer: {
            correctAnswer: row.answer || '',
            acceptedAnswers: row.acceptedAnswers || [],
          },
        },
      },
    };
  }

  // NEW MINIMAL FORMAT: topic
  if (type === 'topic') {
    return {
      order_index: index,
      type: 'topic',
      title: row.title,
      content: row.prompt || null,
      explanation: null,
      hint: null,
      settings: {
        topic: row.prompt || row.title,
        sortBy: 'upvotes',
        allowUpvotes: true,
        answerSeconds: 60,
        votingSeconds: 30,
        resultsSeconds: 15,
      },
    };
  }

  // LEGACY FORMAT: Already has full settings.snapshot structure
  const s = row.settings || {};
  if (s.snapshot?.multipleChoice?.options && s.snapshot?.multipleChoice?.correctOptionId) {
    return {
      ...row,
      order_index: row.order_index ?? index,
      explanation: s.snapshot.explanation ?? row.explanation ?? null,
      hint: row.hint ?? null,
    };
  }

  // LEGACY FORMAT: Old flat options array with is_correct flags
  if (row.type === 'trivia' && s.format === 'multiple_choice' && Array.isArray(s.options)) {
    const options = s.options.map((opt: any) => ({ id: opt.option_id, text: opt.option_text }));
    const correctOpt = s.options.find((opt: any) => opt.is_correct);
    return {
      ...row,
      order_index: row.order_index ?? index,
      explanation: s.explanation ?? row.explanation ?? null,
      hint: s.hint ?? row.hint ?? null,
      settings: {
        format: 'multiple_choice',
        categoryKey: s.categoryKey || 'general',
        answerSeconds: s.answerSeconds ?? 30,
        revealSeconds: s.revealSeconds ?? 15,
        resultsSeconds: s.resultsSeconds ?? 15,
        pointsCorrect: s.pointsCorrect ?? 100,
        speedBonusEnabled: s.speedBonusEnabled ?? true,
        snapshot: {
          prompt: row.content || '',
          explanation: s.explanation ?? row.explanation ?? null,
          multipleChoice: { options, correctOptionId: correctOpt?.option_id ?? '' },
        },
      },
    };
  }

  // Fallback: pass through with order_index
  return { ...row, order_index: row.order_index ?? index };
}

interface Props {
  onImport: (rows: AmbientRoundExportRow[]) => Promise<void>;
  importMode: 'replace' | 'append';
  onImportModeChange: (mode: 'replace' | 'append') => void;
}

export default function AmbientRoundBulkImport({ onImport, importMode, onImportModeChange }: Props) {
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
      if (!row?.type || !row?.title) {
        setError(`Row ${i}: must have type and title fields.`);
        return;
      }

      const validTypes = ['trivia_multiple_choice', 'trivia_written', 'topic', 'trivia'];
      if (!validTypes.includes(row.type)) {
        setError(`Row ${i}: type must be one of: ${validTypes.join(', ')} (got "${row.type}").`);
        return;
      }

      // NEW MINIMAL FORMAT: trivia_multiple_choice
      if (row.type === 'trivia_multiple_choice') {
        if (!row.question) {
          setError(`Row ${i}: trivia_multiple_choice requires "question" field.`);
          return;
        }
        if (!Array.isArray(row.options) || row.options.length !== 4) {
          setError(`Row ${i}: trivia_multiple_choice requires "options" array with exactly 4 items.`);
          return;
        }
        const correctCount = row.options.filter((o: any) => o?.correct).length;
        if (correctCount !== 1) {
          setError(`Row ${i}: exactly one option must have "correct": true.`);
          return;
        }
        continue;
      }

      // NEW MINIMAL FORMAT: trivia_written
      if (row.type === 'trivia_written') {
        if (!row.question) {
          setError(`Row ${i}: trivia_written requires "question" field.`);
          return;
        }
        if (!row.answer) {
          setError(`Row ${i}: trivia_written requires "answer" field.`);
          return;
        }
        continue;
      }

      // NEW MINIMAL FORMAT: topic
      if (row.type === 'topic') {
        if (!row.prompt) {
          setError(`Row ${i}: topic requires "prompt" field.`);
          return;
        }
        continue;
      }

      // LEGACY FORMATS: Validate old schema with settings object
      if (!row.settings) {
        setError(`Row ${i}: legacy format requires "settings" field.`);
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
          const hasLegacyFormat = Array.isArray(row.settings.options) && row.settings.options.length >= 2;
          const hasModernFormat = row.settings.snapshot?.multipleChoice?.options && row.settings.snapshot?.multipleChoice?.correctOptionId;
          
          if (!hasLegacyFormat && !hasModernFormat) {
            setError(`Row ${i} (trivia): multiple_choice requires either settings.options array OR settings.snapshot.multipleChoice.`);
            return;
          }
          
          if (hasLegacyFormat) {
            const correctCount = row.settings.options.filter((o: any) => o?.is_correct).length;
            if (correctCount !== 1) {
              setError(`Row ${i} (trivia): exactly one option must have is_correct: true.`);
              return;
            }
          }
        }
      }
    }
    try {
      // Normalize all rows to full database schema
      const normalized = (parsed as any[]).map((row, index) => normalizeRow(row, index));
      await onImport(normalized as AmbientRoundExportRow[]);
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          className={`btn ${importMode === 'append' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onImportModeChange('append')}
        >
          ➕ Append
        </button>
        <button
          className={`btn ${importMode === 'replace' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onImportModeChange('replace')}
        >
          🔄 Replace All
        </button>
      </div>
      <p className="hint">
        {importMode === 'append'
          ? 'Paste a JSON array of rounds to add after the existing ones.'
          : <>Paste a JSON array of ambient rounds, or upload the seed file. <strong>This replaces all existing rounds.</strong></>
        }
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
        {importMode === 'append' ? 'Import and Append' : 'Import and Replace All'}
      </button>
    </div>
  );
}
