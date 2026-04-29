import { useState } from 'react';

/**
 * ApiTriviaSourcer - API-Powered Trivia Question Sourcer
 * 
 * PURPOSE: Fetches real trivia questions from free public APIs (Open Trivia DB
 * and The Trivia API), normalizes them into the ambient round minimal format,
 * and lets the host copy/download the JSON for bulk import.
 * 
 * KEY DIFFERENCE: Unlike the General and Bar Context tabs which produce prompts
 * for ChatGPT/Claude, this tab calls live APIs and produces finished, importable
 * JSON directly — no AI tool needed.
 * 
 * OUTPUT FORMAT: Ambient round minimal format (trivia_multiple_choice) compatible
 * with AmbientRoundBulkImport.tsx normalizeRow().
 * 
 * APIS:
 * - Open Trivia DB (opentdb.com): CC BY-SA 4.0, no key, 24 categories
 * - The Trivia API (the-trivia-api.com): CC BY-NC 4.0, no key, 10 categories
 */

type ApiSource = 'opentdb' | 'the_trivia_api';

interface ApiSourcerForm {
  source: ApiSource;
  category: string;
  difficulty: string;
  count: string;
}

interface NormalizedQuestion {
  type: 'trivia_multiple_choice';
  title: string;
  question: string;
  hint: string | null;
  explanation: string | null;
  category: string;
  options: Array<{ text: string; correct?: true }>;
}

const OPENTDB_CATEGORIES: { id: number; name: string }[] = [
  { id: 0, name: 'Any Category' },
  { id: 9, name: 'General Knowledge' },
  { id: 10, name: 'Entertainment: Books' },
  { id: 11, name: 'Entertainment: Film' },
  { id: 12, name: 'Entertainment: Music' },
  { id: 13, name: 'Entertainment: Musicals & Theatres' },
  { id: 14, name: 'Entertainment: Television' },
  { id: 15, name: 'Entertainment: Video Games' },
  { id: 16, name: 'Entertainment: Board Games' },
  { id: 17, name: 'Science & Nature' },
  { id: 18, name: 'Science: Computers' },
  { id: 19, name: 'Science: Mathematics' },
  { id: 20, name: 'Mythology' },
  { id: 21, name: 'Sports' },
  { id: 22, name: 'Geography' },
  { id: 23, name: 'History' },
  { id: 24, name: 'Politics' },
  { id: 25, name: 'Art' },
  { id: 26, name: 'Celebrities' },
  { id: 27, name: 'Animals' },
  { id: 28, name: 'Vehicles' },
  { id: 29, name: 'Entertainment: Comics' },
  { id: 30, name: 'Science: Gadgets' },
  { id: 31, name: 'Entertainment: Japanese Anime & Manga' },
  { id: 32, name: 'Entertainment: Cartoon & Animations' },
];

const TRIVIA_API_CATEGORIES: { slug: string; name: string }[] = [
  { slug: '', name: 'Any Category' },
  { slug: 'arts_and_literature', name: 'Arts & Literature' },
  { slug: 'film_and_tv', name: 'Film & TV' },
  { slug: 'food_and_drink', name: 'Food & Drink' },
  { slug: 'general_knowledge', name: 'General Knowledge' },
  { slug: 'geography', name: 'Geography' },
  { slug: 'history', name: 'History' },
  { slug: 'music', name: 'Music' },
  { slug: 'science', name: 'Science' },
  { slug: 'society_and_culture', name: 'Society & Culture' },
  { slug: 'sport_and_leisure', name: 'Sport & Leisure' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeOpenTDB(results: any[]): NormalizedQuestion[] {
  return results.map(r => {
    const correct = decodeURIComponent(r.correct_answer);
    const incorrects = r.incorrect_answers.map((a: string) => decodeURIComponent(a));
    const allOptions = [correct, ...incorrects];
    const shuffled = shuffleArray(allOptions);
    const categoryDecoded = decodeURIComponent(r.category);

    return {
      type: 'trivia_multiple_choice' as const,
      title: categoryDecoded,
      question: decodeURIComponent(r.question),
      hint: null,
      explanation: null,
      category: categoryDecoded.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      options: shuffled.map(text =>
        text === correct ? { text, correct: true as const } : { text }
      ),
    };
  });
}

function normalizeTriviaApi(results: any[]): NormalizedQuestion[] {
  return results.map(r => {
    const correct = r.correctAnswer;
    const incorrects = r.incorrectAnswers;
    const allOptions = [correct, ...incorrects];
    const shuffled = shuffleArray(allOptions);
    const catSlug = r.category || 'general_knowledge';

    return {
      type: 'trivia_multiple_choice' as const,
      title: catSlug.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      question: r.question.text,
      hint: null,
      explanation: null,
      category: catSlug,
      options: shuffled.map(text =>
        text === correct ? { text, correct: true as const } : { text }
      ),
    };
  });
}

const OPENTDB_ERRORS: Record<number, string> = {
  1: 'Not enough questions available for this category/difficulty. Try fewer questions or a different category.',
  2: 'Invalid parameters.',
  3: 'Session token error.',
  4: 'All questions exhausted for this session.',
  5: 'Rate limited. Wait 5 seconds and try again.',
};

async function fetchFromApis(form: ApiSourcerForm): Promise<NormalizedQuestion[]> {
  if (form.source === 'opentdb') {
    const params = new URLSearchParams({
      amount: form.count,
      type: 'multiple',
      encode: 'url3986',
    });
    if (form.category && form.category !== '0') params.set('category', form.category);
    if (form.difficulty !== 'any') params.set('difficulty', form.difficulty);

    const res = await fetch(`https://opentdb.com/api.php?${params}`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();

    if (data.response_code !== 0) {
      throw new Error(OPENTDB_ERRORS[data.response_code] || 'Unknown API error.');
    }

    return normalizeOpenTDB(data.results);
  } else {
    const params = new URLSearchParams({ limit: form.count });
    if (form.category) params.set('categories', form.category);
    if (form.difficulty !== 'any') params.set('difficulties', form.difficulty);

    const res = await fetch(`https://the-trivia-api.com/v2/questions?${params}`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();

    return normalizeTriviaApi(data);
  }
}

export default function ApiTriviaSourcer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<ApiSourcerForm>({
    source: 'opentdb',
    category: '0',
    difficulty: 'any',
    count: '20',
  });
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [enrichPrompt, setEnrichPrompt] = useState('');
  const [showEnrichPrompt, setShowEnrichPrompt] = useState(false);
  const [enrichCopied, setEnrichCopied] = useState(false);
  const [mergeInput, setMergeInput] = useState('');
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState(false);

  const updateField = (field: keyof ApiSourcerForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSourceChange = (source: ApiSource) => {
    setFormData(prev => ({
      ...prev,
      source,
      category: source === 'opentdb' ? '0' : '',
    }));
    setQuestions([]);
    setError(null);
  };

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const fetched = await fetchFromApis(formData);
      if (fetched.length === 0) {
        setError('No questions found for this category/difficulty.');
      } else {
        setQuestions(prev => [...prev, ...fetched]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getJsonString = () => JSON.stringify(questions, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(getJsonString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getJsonString()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trivia_${questions.length}_questions.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setQuestions([]);
    setError(null);
    setCopied(false);
    setEnrichPrompt('');
    setShowEnrichPrompt(false);
    setMergeInput('');
    setMergeError(null);
    setMergeSuccess(false);
  };

  const buildEnrichPrompt = () => {
    const questionsForPrompt = questions.map((q, i) => {
      const correctOpt = q.options.find(o => o.correct);
      return `${i}. ${q.question} → ${correctOpt?.text || 'N/A'}`;
    }).join('\n');

    const prompt = `For each trivia question below, write a hint and an explanation.

- hint: A short, playful clue (1 sentence) that points toward the answer without revealing it. Use wordplay, context clues, or indirect references — never state part of the answer directly. Pub quiz MC style.
- explanation: A brief, interesting explanation (1–2 sentences) shown after the answer is revealed. Add a fun fact or context.

Questions:
${questionsForPrompt}

Return ONLY a JSON array with one object per question, in the same order:
[{"hint":"...","explanation":"..."},...]

If your platform supports it, return this as a downloadable .json file. Otherwise, return the raw JSON array inline — no markdown, no code fences, no commentary. ${questions.length} objects total.`;

    setEnrichPrompt(prompt);
    setShowEnrichPrompt(true);
    setMergeInput('');
    setMergeError(null);
    setMergeSuccess(false);
  };

  const handleMerge = () => {
    setMergeError(null);
    setMergeSuccess(false);
    try {
      const cleaned = mergeInput.trim().replace(/^```[\s\S]*?\n/, '').replace(/\n```\s*$/, '');
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        setMergeError('Expected a JSON array.');
        return;
      }
      if (parsed.length !== questions.length) {
        setMergeError(`Expected ${questions.length} items but got ${parsed.length}. Merging what we can.`);
      }
      setQuestions(prev => prev.map((q, i) => {
        const enrichment = parsed[i];
        if (!enrichment) return q;
        return {
          ...q,
          hint: typeof enrichment.hint === 'string' ? enrichment.hint : q.hint,
          explanation: typeof enrichment.explanation === 'string' ? enrichment.explanation : q.explanation,
        };
      }));
      setMergeSuccess(true);
      setShowEnrichPrompt(false);
    } catch {
      setMergeError('Invalid JSON. Make sure you pasted the full AI response.');
    }
  };

  const handleEnrichCopy = () => {
    navigator.clipboard.writeText(enrichPrompt);
    setEnrichCopied(true);
    setTimeout(() => setEnrichCopied(false), 2000);
  };

  const bgColor = '#f0fdfa';
  const borderColor = '#14b8a6';
  const textColor = '#134e4a';

  const sourceLabel = formData.source === 'opentdb' ? 'Open Trivia DB' : 'The Trivia API';
  const attribution = formData.source === 'opentdb'
    ? 'Questions from Open Trivia Database (CC BY-SA 4.0)'
    : 'Questions from The Trivia API (CC BY-NC 4.0)';

  const categories = formData.source === 'opentdb'
    ? OPENTDB_CATEGORIES.map(c => ({ value: String(c.id), label: c.name }))
    : TRIVIA_API_CATEGORIES.map(c => ({ value: c.slug, label: c.name }));

  return (
    <div className="api-trivia-sourcer" style={{
      background: bgColor,
      border: '1px solid ' + borderColor,
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      overflow: 'hidden'
    }}>
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.05)',
          borderBottom: isExpanded ? '1px solid ' + borderColor : 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 style={{ margin: 0, color: textColor, fontSize: '14px' }}>
          API Trivia Sourcer
        </h4>
        <span style={{
          fontSize: '12px',
          color: borderColor,
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block'
        }}>
          &#9662;
        </span>
      </div>

      {isExpanded && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={e => handleSourceChange(e.target.value as ApiSource)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  <option value="opentdb">Open Trivia DB</option>
                  <option value="the_trivia_api">The Trivia API</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => updateField('category', e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={e => updateField('difficulty', e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  <option value="any">Any</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Count
                </label>
                <select
                  value={formData.count}
                  onChange={e => updateField('count', e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => void handleFetch()}
            disabled={loading}
            style={{ marginBottom: '12px', width: '100%' }}
          >
            {loading ? 'Fetching...' : questions.length > 0 ? 'Fetch More' : 'Fetch Questions'}
          </button>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 12px 0' }}>
              {error}
            </p>
          )}

          {questions.length > 0 && (
            <>
              <div style={{
                fontSize: '12px',
                color: textColor,
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                {questions.length} question{questions.length === 1 ? '' : 's'} fetched from {sourceLabel}
              </div>

              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid ' + borderColor,
                borderRadius: '4px',
                marginBottom: '12px',
                background: 'white'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.05)', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid ' + borderColor, width: '30px' }}>#</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid ' + borderColor }}>Question</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid ' + borderColor, width: '100px' }}>Category</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid ' + borderColor, width: '60px' }}>Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, i) => {
                      const correctOpt = q.options.find(o => o.correct);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <td style={{ padding: '4px 8px', color: '#999' }}>{i + 1}</td>
                          <td style={{ padding: '4px 8px' }}>
                            {q.question.length > 80 ? q.question.slice(0, 80) + '...' : q.question}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#666' }}>{q.title}</td>
                          <td style={{ padding: '4px 8px', color: '#666' }}>{correctOpt?.text || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleCopy}
                  style={{ fontSize: '12px' }}
                >
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleDownload}
                  style={{ fontSize: '12px' }}
                >
                  Download JSON
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleClear}
                  style={{ fontSize: '12px' }}
                >
                  Clear
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={buildEnrichPrompt}
                  style={{
                    fontSize: '12px',
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                  }}
                >
                  Enrich with AI
                </button>
              </div>

              {mergeSuccess && (
                <p style={{ color: '#16a34a', fontSize: '12px', margin: '0 0 12px 0', fontWeight: 'bold' }}>
                  Hints & explanations merged into {questions.length} questions. Use Copy JSON or Download JSON to export.
                </p>
              )}

              {showEnrichPrompt && enrichPrompt && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e' }}>
                      Step 1: Copy this prompt into ChatGPT / Claude
                    </span>
                    <button
                      onClick={() => setShowEnrichPrompt(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#92400e' }}
                    >
                      &#10005;
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={enrichPrompt}
                    style={{
                      width: '100%',
                      height: '120px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      padding: '8px',
                      border: '1px solid #fcd34d',
                      borderRadius: '4px',
                      resize: 'vertical',
                      background: 'white',
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleEnrichCopy}
                    style={{ marginTop: '8px', fontSize: '12px', background: '#f59e0b', border: 'none' }}
                  >
                    {enrichCopied ? 'Copied!' : 'Copy Prompt'}
                  </button>

                  <div style={{ marginTop: '16px', borderTop: '1px solid #fcd34d', paddingTop: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', display: 'block', marginBottom: '8px' }}>
                      Step 2: Paste the AI response here to merge
                    </span>
                    <textarea
                      value={mergeInput}
                      onChange={e => setMergeInput(e.target.value)}
                      placeholder='Paste the JSON array from ChatGPT/Claude here...'
                      style={{
                        width: '100%',
                        height: '120px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        padding: '8px',
                        border: '1px solid #fcd34d',
                        borderRadius: '4px',
                        resize: 'vertical',
                        background: 'white',
                      }}
                    />
                    {mergeError && (
                      <p style={{ color: '#dc2626', fontSize: '11px', margin: '4px 0 0 0' }}>{mergeError}</p>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={handleMerge}
                      disabled={!mergeInput.trim()}
                      style={{ marginTop: '8px', fontSize: '12px', background: '#16a34a', border: 'none' }}
                    >
                      Merge Hints & Explanations
                    </button>
                  </div>
                </div>
              )}

              <p style={{ margin: 0, fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
                {attribution}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
