import { useState } from 'react';
import AIPromptGenerator from './AIPromptGenerator';
import BarContextGenerator from './BarContextGenerator';
import ApiTriviaSourcer from './ApiTriviaSourcer';

/**
 * AIPromptGeneratorTabs - Tab Wrapper for AI Prompt Generators
 * 
 * PURPOSE: Provides a three-tab interface switching between:
 * - General: The existing AI prompt generator (researches facts)
 * - Bar Context: The venue-specific generator (formats host-supplied facts)
 * - API Source: Live API fetcher (pulls real questions from free trivia APIs)
 * 
 * USAGE: Replaces direct <AIPromptGenerator> usage in App.tsx.
 * The 'type' prop is passed through to the General tab only.
 */

interface Props {
  type: 'prompts' | 'ambient' | 'trivia';
}

export default function AIPromptGeneratorTabs({ type }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'bar_context' | 'api_source'>('general');

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'general' ? 'bold' : 'normal',
            background: activeTab === 'general' ? '#e5e7eb' : 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'general' ? 'none' : '1px solid #d1d5db',
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('bar_context')}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'bar_context' ? 'bold' : 'normal',
            background: activeTab === 'bar_context' ? '#e5e7eb' : 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'bar_context' ? 'none' : '1px solid #d1d5db',
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          Bar Context
        </button>
        <button
          onClick={() => setActiveTab('api_source')}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'api_source' ? 'bold' : 'normal',
            background: activeTab === 'api_source' ? '#e5e7eb' : 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'api_source' ? 'none' : '1px solid #d1d5db',
            cursor: 'pointer',
            color: '#374151',
          }}
        >
          API Source
        </button>
      </div>

      {activeTab === 'general' && <AIPromptGenerator type={type} />}
      {activeTab === 'bar_context' && <BarContextGenerator />}
      {activeTab === 'api_source' && <ApiTriviaSourcer />}
    </div>
  );
}
