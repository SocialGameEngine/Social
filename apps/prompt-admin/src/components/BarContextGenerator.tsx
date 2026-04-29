import { useState } from 'react';

/**
 * BarContextGenerator - Bar Context AI Prompt Generator Component
 * 
 * PURPOSE: Generates AI prompts for venue-specific trivia and banter content.
 * Unlike the General generator (which researches facts), this generator takes
 * host-supplied venue details ("nuggets") and instructs the AI to format them
 * into questions. The AI is a copywriter, not a researcher.
 * 
 * USAGE: Embedded in AIPromptGeneratorTabs as the "Bar Context" tab. Host fills
 * in venue details + nuggets, clicks "Generate", copies prompt to ChatGPT/Claude,
 * gets JSON back, then bulk-imports via Ambient Rounds import.
 * 
 * OUTPUT FORMAT: Ambient round minimal format (trivia_multiple_choice / topic)
 * which AmbientRoundBulkImport.tsx already normalizes.
 */

interface Nugget {
  id: string;
  category: NuggetCategory;
  text: string;
}

type NuggetCategory = 'people' | 'the_place' | 'local' | 'sports' | 'moments';

interface BarContextForm {
  venueName: string;
  neighbourhood: string;
  localTeams: string;
  contentType: 'trivia' | 'banter' | 'both';
  count: string;
}

const CATEGORIES: { value: NuggetCategory; label: string; description: string }[] = [
  { value: 'people', label: 'People', description: 'Regulars, staff, characters' },
  { value: 'the_place', label: 'The Place', description: 'Physical quirks, house rules, running jokes' },
  { value: 'local', label: 'Local', description: 'Neighbourhood landmarks, rival bars, local slang' },
  { value: 'sports', label: 'Sports', description: 'Team allegiances, match moments, fan behaviour' },
  { value: 'moments', label: 'Moments', description: 'Recent incidents, legendary nights' },
];

const GHOST_EXAMPLES: Record<NuggetCategory, string> = {
  people: 'Terry — has ordered the same pint for 15 years and gets personally offended if we run out',
  the_place: 'The corner booth has been "reserved for a private event" since 2019. There is no private event.',
  local: 'Everyone walks past the kebab shop on the way home. The owner knows our regulars by name.',
  sports: 'We lost the fantasy league final on a tiebreaker. Dave has not recovered.',
  moments: 'Someone once got a question wrong so badly the whole bar went silent for three seconds.',
};

export default function BarContextGenerator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);
  
  const [formData, setFormData] = useState<BarContextForm>({
    venueName: '',
    neighbourhood: '',
    localTeams: '',
    contentType: 'both',
    count: '20',
  });
  
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [currentCategory, setCurrentCategory] = useState<NuggetCategory>('people');
  const [currentNuggetText, setCurrentNuggetText] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const updateField = (field: keyof BarContextForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addNugget = () => {
    const trimmed = currentNuggetText.trim();
    if (!trimmed) return;
    
    const newNugget: Nugget = {
      id: crypto.randomUUID(),
      category: currentCategory,
      text: trimmed,
    };
    
    setNuggets(prev => [...prev, newNugget]);
    setCurrentNuggetText('');
  };

  const removeNugget = (id: string) => {
    setNuggets(prev => prev.filter(n => n.id !== id));
  };

  const handleNuggetInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNugget();
    }
  };

  const getNudgeMessage = () => {
    const count = nuggets.length;
    if (count <= 3) {
      return `You've got ${count} nugget${count === 1 ? '' : 's'} — that's a start, but questions may feel a bit generic. The more specific the better.`;
    } else if (count <= 7) {
      return "Looking good. A few more nuggets and you'll get really local output.";
    } else {
      return 'Great material — you should get some properly venue-flavoured questions.';
    }
  };

  const generatePrompt = () => {
    const contentTypeLabels = {
      trivia: 'trivia questions',
      banter: 'banter/topic prompts',
      both: 'trivia questions and banter/topic prompts',
    };
    
    const contentTypeLabel = contentTypeLabels[formData.contentType];
    const neighbourhoodClause = formData.neighbourhood.trim() 
      ? ` in ${formData.neighbourhood.trim()}` 
      : '';
    const localTeamsClause = formData.localTeams.trim()
      ? `The local team(s) are: ${formData.localTeams.trim()}.\n\n`
      : '';
    
    const venueDetailsLines = nuggets.map(n => {
      const categoryLabel = CATEGORIES.find(c => c.value === n.category)?.label || n.category;
      return `- [${categoryLabel}]: ${n.text}`;
    }).join('\n');
    
    const venueDetailsSection = nuggets.length > 0
      ? `Venue details:\n${venueDetailsLines}\n\n`
      : '';
    
    let outputInstructions = '';
    
    if (formData.contentType === 'trivia' || formData.contentType === 'both') {
      outputInstructions += `For trivia questions, output JSON objects matching this schema:
{
  "type": "trivia_multiple_choice",
  "title": "short round title",
  "question": "the question text",
  "hint": "optional hint",
  "explanation": "why this answer is correct",
  "category": "bar_context",
  "options": [
    { "text": "Option A" },
    { "text": "Option B" },
    { "text": "Option C", "correct": true },
    { "text": "Option D" }
  ]
}

`;
    }
    
    if (formData.contentType === 'banter' || formData.contentType === 'both') {
      outputInstructions += `For banter/topic prompts, output JSON objects matching this schema:
{
  "type": "topic",
  "title": "short round title",
  "prompt": "The discussion prompt or hot take question for the crowd"
}

`;
    }
    
    let splitInstruction = '';
    if (formData.contentType === 'trivia') {
      splitInstruction = `All ${formData.count} items should be trivia_multiple_choice.`;
    } else if (formData.contentType === 'banter') {
      splitInstruction = `All ${formData.count} items should be topic.`;
    } else {
      splitInstruction = `Aim for roughly 60% trivia_multiple_choice and 40% topic. Interleave them.`;
    }
    
    const prompt = `You are writing ${contentTypeLabel} for a pub called ${formData.venueName || '[venue name]'}${neighbourhoodClause}.
${localTeamsClause}Use the following venue details as your ONLY source material.
Craft questions that reference these details so the crowd recognises them.
Do NOT invent any additional local facts beyond what is provided below.

${venueDetailsSection}${outputInstructions}OUTPUT: Return the response as a single JSON array of ${formData.count} objects. No markdown, no code fences, no commentary.
${splitInstruction}`;

    setGeneratedPrompt(prompt);
    setShowGenerated(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  const bgColor = '#fdf2f8';
  const borderColor = '#ec4899';
  const textColor = '#9d174d';

  const nuggetsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    nuggets: nuggets.filter(n => n.category === cat.value),
  }));

  return (
    <div className="bar-context-generator" style={{ 
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
          Bar Context AI Prompt Generator
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
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={e => updateField('venueName', e.target.value)}
                  placeholder="The Crown & Anchor"
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Neighbourhood / Area
                </label>
                <input
                  type="text"
                  value={formData.neighbourhood}
                  onChange={e => updateField('neighbourhood', e.target.value)}
                  placeholder="Shoreditch"
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                Local Team(s)
              </label>
              <input
                type="text"
                value={formData.localTeams}
                onChange={e => updateField('localTeams', e.target.value)}
                placeholder="comma-separated if multiple"
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Content Type
                </label>
                <select 
                  value={formData.contentType} 
                  onChange={e => updateField('contentType', e.target.value as any)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  <option value="trivia">Trivia</option>
                  <option value="banter">Banter</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                  Number to generate
                </label>
                <select 
                  value={formData.count} 
                  onChange={e => updateField('count', e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            background: 'rgba(0,0,0,0.03)', 
            borderRadius: '6px',
            border: '1px solid ' + borderColor
          }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: textColor }}>
              Add Nuggets
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '8px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  Category
                </label>
                <select 
                  value={currentCategory} 
                  onChange={e => setCurrentCategory(e.target.value as NuggetCategory)}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  Nugget
                </label>
                <input
                  type="text"
                  value={currentNuggetText}
                  onChange={e => setCurrentNuggetText(e.target.value)}
                  onKeyDown={handleNuggetInputKeyDown}
                  placeholder="Describe a venue detail..."
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>

              <button 
                onClick={addNugget}
                disabled={!currentNuggetText.trim()}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Add Nugget
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: textColor }}>
              Your Nuggets
            </h5>
            
            {nuggetsByCategory.map(cat => (
              <div key={cat.value} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {cat.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
                  {cat.nuggets.length === 0 && (
                    <span style={{
                      background: 'rgba(0,0,0,0.05)',
                      color: '#999',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontStyle: 'italic',
                      display: 'inline-block'
                    }}>
                      {GHOST_EXAMPLES[cat.value]}
                    </span>
                  )}
                  {cat.nuggets.map(nugget => (
                    <span 
                      key={nugget.id}
                      style={{
                        background: 'rgba(0,0,0,0.1)',
                        color: textColor,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {nugget.text}
                      <button
                        onClick={() => removeNugget(nugget.id)}
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
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            padding: '10px 12px', 
            background: 'rgba(236, 72, 153, 0.1)', 
            borderRadius: '6px',
            fontSize: '12px',
            color: textColor,
            marginBottom: '16px',
            fontStyle: 'italic'
          }}>
            {getNudgeMessage()}
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
