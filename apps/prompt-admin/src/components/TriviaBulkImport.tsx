import { useState } from 'react';

interface Props {
  onImport: (rows: any[]) => Promise<void>;
  existingQuestionCount?: number;
}

interface PreviewData {
  rows: any[];
  valid: number;
  invalid: number;
  warnings: string[];
}

export default function TriviaBulkImport({ onImport, existingQuestionCount = 0 }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const validateAllRows = (parsed: unknown): PreviewData => {
    if (!Array.isArray(parsed)) {
      throw new Error('Expected a JSON array.');
    }

    const rows = parsed as any[];
    const warnings: string[] = [];
    let valid = 0;
    let invalid = 0;

    rows.forEach((row, index) => {
      if (!row?.format || !row?.prompt || !row?.category_key || !row?.difficulty) {
        invalid++;
        warnings.push(`Row ${index + 1}: Missing required fields (format, prompt, category_key, difficulty)`);
        return;
      }

      if (row.format === 'multiple_choice') {
        if (!row.options || !Array.isArray(row.options) || row.options.length !== 4) {
          invalid++;
          warnings.push(`Row ${index + 1}: Multiple choice questions must have exactly 4 options`);
          return;
        }
        const correctCount = row.options.filter((opt: any) => opt.is_correct).length;
        if (correctCount !== 1) {
          invalid++;
          warnings.push(`Row ${index + 1}: Multiple choice questions must have exactly 1 correct option`);
          return;
        }
      } else if (row.format === 'written_answer') {
        if (!row.aliases || !Array.isArray(row.aliases) || row.aliases.length < 2) {
          invalid++;
          warnings.push(`Row ${index + 1}: Written answer questions must have at least 2 aliases`);
          return;
        }
      }

      valid++;
    });

    return { rows, valid, invalid, warnings };
  };

  const handlePreview = (): void => {
    setError(null);
    setPreview(null);
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError('Invalid JSON.');
      return;
    }

    try {
      const previewData = validateAllRows(parsed);
      setPreview(previewData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed.');
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!preview) return;
    
    setError(null);
    try {
      await onImport(preview.rows);
      setText('');
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  };

  const handleFile = async (file: File): Promise<void> => {
    setText(await file.text());
  };

  return (
    <div className="bulk-import">
      <h3>Bulk Import Trivia Questions</h3>
      <p className="hint">
        Paste a JSON array of trivia questions, or upload a seed file.
        <strong> This adds new questions to this library as drafts.</strong>
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
        placeholder='[{ "format": "multiple_choice", "category_key": "geography", ... }]'
        style={{ width: '100%', marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
      />
      {error && <p className="error">{error}</p>}
      
      {!preview && (
        <button className="btn btn-primary" onClick={() => void handlePreview()} disabled={!text.trim()}>
          Preview Import
        </button>
      )}

      {preview && (
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '6px', 
          padding: '16px', 
          marginTop: '16px',
          backgroundColor: '#f9fafb'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>
            Import Preview
          </h4>
          <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
            Adding <strong>{preview.valid}</strong> new questions to this library 
            ({existingQuestionCount} existing questions will remain unchanged).
            {preview.invalid > 0 && (
              <span style={{ color: '#dc2626' }}>
                {' '}<strong>{preview.invalid}</strong> questions have errors and will be skipped.
              </span>
            )}
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Format Breakdown:</strong>
            {' '}
            {preview.rows.filter(r => r.format === 'multiple_choice').length} multiple choice, {' '}
            {preview.rows.filter(r => r.format === 'written_answer').length} written answer
          </div>

          {preview.warnings.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#f59e0b' }}>Warnings:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#f59e0b' }}>
                {preview.warnings.slice(0, 10).map((warning, i) => (
                  <li key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>{warning}</li>
                ))}
                {preview.warnings.length > 10 && (
                  <li style={{ fontSize: '12px' }}>
                    ...and {preview.warnings.length - 10} more warnings
                  </li>
                )}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => void handleImport()}
              disabled={preview.valid === 0}
            >
              Add {preview.valid} Questions
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setPreview(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
