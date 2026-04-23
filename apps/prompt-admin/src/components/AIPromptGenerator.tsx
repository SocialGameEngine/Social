import { useState } from 'react';

interface Props {
  type: 'prompts' | 'ambient' | 'trivia';
}

export default function AIPromptGenerator({ type }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);
  const [formData, setFormData] = useState({
    count: '20',
    tags: [] as string[],
    strictCategories: true,
    roundSpread: '50_trivia_50_topic',
    promptType: 'open_ended',
    triviaFormatRatio: '80_mc_20_written',
    difficultyDist: 'pyramid',
  });
  const [tagInput, setTagInput] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const generatePrompt = () => {
    if (type === 'prompts') {
      const promptTypeLabels = {
        open_ended: 'open-ended personal sharing prompts',
        would_you_rather: '"Would You Rather" prompts',
        this_or_that: '"This or That" prompts',
      };
      
      const prompt = `Generate ${formData.count} ${promptTypeLabels[formData.promptType as keyof typeof promptTypeLabels]} for a social party game played by groups of 5-20 people.

GAME CONTEXT: Players see a prompt on screen and submit their most creative or honest answer. The room votes on their favorite. Prompts that generate wildly different answers between players are the most fun.

EXAMPLES OF GOOD VS BAD:
Good: "What's the most ridiculous thing you've ever done to impress someone?"
Bad: "What did you do last weekend?"

Good: "Would you rather have fingers for toes or toes for fingers?"
Bad: "Would you rather be rich or famous?"

REQUIREMENTS:
- Every prompt must be distinct -- no two should share the same theme, subject, or sentence structure
- Vary the emotional register: mix funny, nostalgic, thought-provoking, and playful
- Each prompt must be completable in under 60 seconds of thought
- Avoid prompts that have an obvious "right answer" -- the best prompts have no correct response
- Keep all prompts family-friendly and inclusive across ages 16-70
- Write conversationally, as if spoken aloud in a group setting
- Length: 1-2 sentences maximum per prompt

${formData.tags.length > 0 ? (formData.strictCategories
  ? `REQUIRED TOPICS (STRICT): ${formData.tags.join(', ')}. Every single prompt MUST be about one of these topics only. Do not include prompts outside these topics.`
  : `PREFERRED TOPICS: ${formData.tags.join(', ')}`) : ''}

OUTPUT: Return the response as a downloadable .json file named "prompts_${formData.count}.json". The file should contain a JSON array only. No markdown, no commentary, no code fences.
[
  {"text": "prompt text here"},
  {"text": "prompt text here"}
]`;

      setGeneratedPrompt(prompt);
      setShowGenerated(true);
    } else if (type === 'trivia') {
      const totalCount = parseInt(formData.count);
      const formatRatio = formData.triviaFormatRatio;
      const difficultyDist = formData.difficultyDist;
      
      let mcCount = 0;
      let writtenCount = 0;
      
      if (formatRatio === 'all_mc') {
        mcCount = totalCount;
      } else if (formatRatio === '80_mc_20_written') {
        mcCount = Math.floor(totalCount * 0.8);
        writtenCount = totalCount - mcCount;
      } else if (formatRatio === '60_mc_40_written') {
        mcCount = Math.floor(totalCount * 0.6);
        writtenCount = totalCount - mcCount;
      } else if (formatRatio === '50_50') {
        mcCount = Math.floor(totalCount * 0.5);
        writtenCount = totalCount - mcCount;
      }
      
      let easyCount = 0, mediumCount = 0, hardCount = 0;
      if (difficultyDist === 'pyramid') {
        easyCount = Math.floor(totalCount * 0.2);
        mediumCount = Math.floor(totalCount * 0.6);
        hardCount = totalCount - easyCount - mediumCount;
      } else if (difficultyDist === 'even') {
        easyCount = Math.floor(totalCount * 0.33);
        mediumCount = Math.floor(totalCount * 0.33);
        hardCount = totalCount - easyCount - mediumCount;
      } else if (difficultyDist === 'easy_heavy') {
        easyCount = Math.floor(totalCount * 0.5);
        mediumCount = Math.floor(totalCount * 0.35);
        hardCount = totalCount - easyCount - mediumCount;
      } else if (difficultyDist === 'hard_heavy') {
        hardCount = Math.floor(totalCount * 0.5);
        mediumCount = Math.floor(totalCount * 0.35);
        easyCount = totalCount - hardCount - mediumCount;
      }
      
      const triviaExample = `{
  "format": "multiple_choice",
  "category_key": "science",
  "difficulty": "medium",
  "prompt": "What is the chemical symbol for gold?",
  "explanation": "Gold's chemical symbol comes from its Latin name 'aurum'.",
  "hint": "Think about the Latin name for gold",
  "options": [
    {"option_id": "a", "option_text": "Go", "is_correct": false},
    {"option_id": "b", "option_text": "Gd", "is_correct": false},
    {"option_id": "c", "option_text": "Au", "is_correct": true},
    {"option_id": "d", "option_text": "Ag", "is_correct": false}
  ],
  "tags": ["science", "chemistry", "elements"]
}`;
      
      const topicExample = `{
  "format": "written_answer",
  "category_key": "pop_culture",
  "difficulty": "easy",
  "prompt": "Name a movie that won Best Picture at the Oscars",
  "explanation": "Any Best Picture winner is correct - this tests general movie knowledge.",
  "hint": "Think about recent Oscar winners or classics",
  "aliases": ["The Godfather", "Parasite", "Nomadland", "CODA"],
  "tags": ["movies", "awards", "pop_culture"]
}`;

      const prompt = `Generate exactly ${totalCount} trivia questions for a social party game with ${mcCount} multiple choice and ${writtenCount} written answer questions.

DIFFICULTY DISTRIBUTION: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard

FORMAT REQUIREMENTS:
- Multiple choice: 4 options (A, B, C, D), exactly 1 correct
- Written answer: provide 3-5 alternative acceptable answers in "aliases" array
- Questions must be answerable in under 30 seconds
- Mix of topics: general knowledge, pop culture, science, history, geography
- Keep content family-friendly and internationally accessible

${formData.tags.length > 0 ? (formData.strictCategories
  ? `REQUIRED CATEGORIES (STRICT): ${formData.tags.join(', ')}. ALL questions MUST be from these categories only. Do not generate questions outside these categories. The categoryKey field must reflect one of these topics.`
  : `PREFERRED CATEGORIES: ${formData.tags.join(', ')}`) : ''}

TRIVIA ROUND SCHEMA (use exactly -- all fields required):
${triviaExample}

TOPIC ROUND SCHEMA (use exactly -- all fields required):
${topicExample}

OUTPUT: Return the response as a downloadable .json file named "ambient_rounds_${totalCount}.json". The file should contain a single JSON array of ${totalCount} objects only. No markdown, no code fences, no commentary. The array must contain exactly ${totalCount} items with order_index values 0 through ${totalCount - 1}.`;

      setGeneratedPrompt(prompt);
      setShowGenerated(true);
    } else {
      const totalRounds = parseInt(formData.count);
      const spread = formData.roundSpread;
      
      let triviaCount = 0, topicCount = 0;
      if (spread === '100_trivia') {
        triviaCount = totalRounds;
      } else if (spread === '75_trivia_25_topic') {
        triviaCount = Math.floor(totalRounds * 0.75);
        topicCount = totalRounds - triviaCount;
      } else if (spread === '50_trivia_50_topic') {
        triviaCount = Math.floor(totalRounds * 0.5);
        topicCount = totalRounds - triviaCount;
      } else if (spread === '25_trivia_75_topic') {
        triviaCount = Math.floor(totalRounds * 0.25);
        topicCount = totalRounds - triviaCount;
      } else if (spread === '100_topic') {
        topicCount = totalRounds;
      }
      
      const triviaExample = `{
  "type": "trivia_multiple_choice",
  "title": "Science Quickfire",
  "question": "What is the chemical symbol for gold?",
  "hint": "Think about the Latin name for gold",
  "explanation": "Gold's chemical symbol comes from its Latin name 'aurum'.",
  "category": "science",
  "options": [
    { "text": "Go" },
    { "text": "Gd" },
    { "text": "Au", "correct": true },
    { "text": "Ag" }
  ]
}`;

      const topicExample = `{
  "type": "topic",
  "title": "Hot Take of the Night",
  "prompt": "Share your most unpopular opinion about food. The room votes on the spiciest take."
}`;

      const prompt = `Generate ${totalRounds} ambient rounds for a social party game with ${triviaCount} trivia rounds and ${topicCount} topic/discussion rounds.

ROUND REQUIREMENTS:
- Trivia rounds: A single question with 4 multiple-choice options. Use varied categories (science, history, geography, pop culture, sport, food & drink, music, film/TV, general knowledge).
- Topic rounds: Short conversation prompts / hot takes / social observation games that the room answers and votes on.
- Content must be family-friendly and inclusive across ages 16-70.
- Avoid back-to-back same category -- interleave by mixing categories.

${formData.tags.length > 0 ? (formData.strictCategories
  ? `REQUIRED THEMES / CATEGORIES (STRICT): ${formData.tags.join(', ')}. ALL trivia rounds MUST use only these categories. Do not use any other categories. The categoryKey field must reflect one of these topics exactly.`
  : `PREFERRED THEMES / CATEGORIES: ${formData.tags.join(', ')}`) : ''}

SCHEMA RULES (STRICT):
- Use ONLY the minimal schema shown below. Do not add extra fields.
- type must be one of: "trivia_multiple_choice", "trivia_written", or "topic"
- Trivia rounds: Must have "question", "hint", "explanation", "category", and "options" array with exactly 4 items
- Each option has "text" field. Exactly ONE option must have "correct": true
- Topic rounds: Only need "title" and "prompt" fields
- Do NOT include: order_index, settings, snapshot, answerSeconds, or any timing fields (these are auto-generated)

TRIVIA ROUND SCHEMA (use exactly -- all fields required):
${triviaExample}

TOPIC ROUND SCHEMA (use exactly -- all fields required):
${topicExample}

OUTPUT: Return the response as a downloadable .json file named "ambient_rounds_${totalRounds}.json". The file should contain a single JSON array of ${totalRounds} objects only. No markdown, no code fences, no commentary. The array must contain exactly ${totalRounds} items in the order they should appear in the game.`;

      setGeneratedPrompt(prompt);
      setShowGenerated(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  const bgColor = type === 'prompts' ? '#f0f9ff' : type === 'trivia' ? '#f0fdf4' : '#fef3c7';
  const borderColor = type === 'prompts' ? '#0ea5e9' : type === 'trivia' ? '#16a34a' : '#f59e0b';
  const textColor = type === 'prompts' ? '#0369a1' : type === 'trivia' ? '#166534' : '#92400e';

  return (
    <div className="ai-prompt-generator" style={{ 
      background: bgColor, 
      border: '1px solid ' + borderColor, 
      borderRadius: '8px', 
      marginBottom: '16px',
      fontSize: '14px',
      overflow: 'hidden'
    }}>
      {/* Header with chevron */}
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
          AI Prompt Generator
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

      {/* Collapsible content */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                Number of prompts
              </label>
              <select 
                value={formData.count} 
                onChange={e => updateField('count', e.target.value)}
                style={{ width: '100%', padding: '6px', fontSize: '12px' }}
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>

            {(type === 'prompts' || type === 'trivia') && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  {type === 'trivia' ? 'Question Format' : 'Prompt Type'}
                </label>
                <select 
                  value={type === 'trivia' ? 'trivia' : formData.promptType} 
                  onChange={e => updateField('promptType', e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  {type === 'trivia' ? (
                    <option value="trivia">Trivia Questions</option>
                  ) : (
                    <>
                      <option value="open_ended">Open-ended Questions</option>
                      <option value="would_you_rather">Would You Rather</option>
                      <option value="this_or_that">This or That</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {type === 'trivia' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                    Format Ratio
                  </label>
                  <select 
                    value={formData.triviaFormatRatio} 
                    onChange={e => updateField('triviaFormatRatio', e.target.value)}
                    style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                  >
                    <option value="all_mc">All Multiple Choice</option>
                    <option value="80_mc_20_written">80% Multiple Choice, 20% Written</option>
                    <option value="60_mc_40_written">60% Multiple Choice, 40% Written</option>
                    <option value="50_50">50% Multiple Choice, 50% Written</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                    Difficulty Distribution
                  </label>
                  <select 
                    value={formData.difficultyDist} 
                    onChange={e => updateField('difficultyDist', e.target.value)}
                    style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                  >
                    <option value="pyramid">20% Easy, 60% Medium, 20% Hard</option>
                    <option value="even">33% Easy, 33% Medium, 33% Hard</option>
                    <option value="easy_heavy">50% Easy, 35% Medium, 15% Hard</option>
                    <option value="hard_heavy">15% Easy, 35% Medium, 50% Hard</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                Tags (optional)
              </label>
              <div style={{ 
                border: '1px solid ' + borderColor, 
                borderRadius: '4px', 
                padding: '4px 8px', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '4px',
                alignItems: 'center',
                minHeight: '32px'
              }}>
                {formData.tags.map(tag => (
                  <span 
                    key={tag}
                    style={{
                      background: 'rgba(0,0,0,0.1)',
                      color: textColor,
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '14px',
                        lineHeight: '1'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags, use commas..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    flex: 1,
                    minWidth: '120px',
                    padding: '2px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                userSelect: 'none'
              }}>
                <div
                  onClick={() => updateField('strictCategories', !formData.strictCategories)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    background: formData.strictCategories ? borderColor : '#ccc',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: formData.strictCategories ? '18px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
                <span style={{ color: textColor }}>
                  Strict categories {formData.strictCategories ? '(on)' : '(off)'}
                </span>
              </label>
              <span style={{ fontSize: '11px', color: '#666' }}>
                {formData.strictCategories
                  ? 'AI must only use the tags above as categories'
                  : 'Tags are suggestions — AI may use other categories'}
              </span>
            </div>

            {type === 'ambient' && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Round Type Spread
                </label>
                <select 
                  value={formData.roundSpread} 
                  onChange={e => updateField('roundSpread', e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  <option value="100_trivia">100% Trivia</option>
                  <option value="75_trivia_25_topic">75% Trivia / 25% Topics</option>
                  <option value="50_trivia_50_topic">50% Trivia / 50% Topics</option>
                  <option value="25_trivia_75_topic">25% Trivia / 75% Topics</option>
                  <option value="100_topic">100% Topics</option>
                </select>
              </div>
            )}
          </div>

          <button 
            className="btn btn-primary" 
            onClick={generatePrompt}
            style={{ marginBottom: '16px', width: '100%' }}
          >
            Generate AI Prompt
          </button>

          {generatedPrompt && (
            <div>
              <div 
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  border: '1px solid ' + borderColor
                }}
                onClick={() => setShowGenerated(!showGenerated)}
              >
                <strong style={{ color: textColor, fontSize: '12px' }}>
                  Generated Prompt ({generatedPrompt.length} chars)
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard();
                    }}
                    style={{ fontSize: '11px', padding: '2px 6px' }}
                  >
                    Copy
                  </button>
                  <span style={{ 
                    fontSize: '10px', 
                    color: borderColor,
                    transition: 'transform 0.2s',
                    transform: showGenerated ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'inline-block'
                  }}>
                    &#9662;
                  </span>
                </div>
              </div>
              
              {showGenerated && (
                <>
                  <textarea
                    value={generatedPrompt}
                    readOnly
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      fontFamily: 'monospace', 
                      fontSize: '11px',
                      padding: '8px',
                      border: '1px solid ' + borderColor,
                      borderRadius: '4px',
                      background: 'white',
                      marginBottom: '8px',
                      resize: 'vertical'
                    }}
                  />
                  <p style={{ 
                    margin: '0', 
                    fontSize: '11px', 
                    color: textColor 
                  }}>
                    Copy this prompt and paste it into ChatGPT, Claude, or your preferred AI tool.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
