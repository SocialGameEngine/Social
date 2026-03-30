// =============================================================================
// SOCIALE CREATE MODAL
// =============================================================================
// Modal for creating new Sociales - matching Session modal design

import React, { useState } from 'react';
import { Button } from '@social/ui';
import { FormField } from '@social/ui';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import type { CreateSocialeRequest } from '../../../features/sociale';
import { 
  generateTopicsOnlyRounds, 
  generateTriviaOnlyRounds, 
  generateAlternatingRounds 
} from '../../../features/sociale/presets';

interface SocialeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSociale: (request: CreateSocialeRequest) => Promise<void>;
  roomId: string;
}

export function SocialeCreateModal({ isOpen, onClose, onCreateSociale, roomId }: SocialeCreateModalProps) {
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'topics-only' | 'trivia-only' | 'alternating' | 'custom'>('alternating');
  const [totalRounds, setTotalRounds] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Generate rounds using preset functions
      let rounds = [];
      if (mode === 'topics-only') {
        rounds = generateTopicsOnlyRounds(totalRounds);
      } else if (mode === 'trivia-only') {
        rounds = generateTriviaOnlyRounds(totalRounds);
      } else if (mode === 'alternating') {
        rounds = generateAlternatingRounds(totalRounds);
      }

      const request: CreateSocialeRequest = {
        roomId,
        title: title || undefined,
        description: description || undefined,
        mode,
        totalRounds,
        rounds: mode === 'custom' ? undefined : rounds,
      };

      await onCreateSociale(request);
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
      setTotalRounds(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Sociale');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isCreating ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">
            Create a Söcial session
          </h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6">
          <form id="create-sociale-form" className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className={`rounded-lg border p-3 text-sm ${!isDark ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-700 border-red-400/50 text-red-200'}`}>
                <p className="font-semibold">Error</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            <FormField
              label="Venue name (optional)"
              name="title"
              placeholder="Bar, venue, or event name"
              maxLength={40}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              hint="Shown to players in the lobby"
              error={error ? 'Failed to create Sociale' : undefined}
              isDark={isDark}
            />

            <FormField
              label="Description (optional)"
              name="description"
              placeholder="A fun mixed game with topics and trivia..."
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              hint="Shown to players in the lobby"
              error={error ? 'Failed to create Sociale' : undefined}
              isDark={isDark}
            />

            <div className="space-y-2">
              <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                Game Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('topics-only')}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${mode === 'topics-only'
                      ? (!isDark
                          ? "border-brand-primary bg-amber-100 text-brand-primary shadow-sm"
                          : "border-cyan-300 bg-slate-800/70 text-cyan-100 shadow-cyan-500/20")
                      : !isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500"
                    }
                  `}
                >
                  <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                    Hot Topic
                  </div>
                  <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                    Topic-based rounds only
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('trivia-only')}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${mode === 'trivia-only'
                      ? (!isDark
                          ? "border-brand-primary bg-amber-100 text-brand-primary shadow-sm"
                          : "border-cyan-300 bg-slate-800/70 text-cyan-100 shadow-cyan-500/20")
                      : !isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500"
                    }
                  `}
                >
                  <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                    Trivia
                  </div>
                  <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                    Trivia questions only
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('alternating')}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${mode === 'alternating'
                      ? (!isDark
                          ? "border-brand-primary bg-amber-100 text-brand-primary shadow-sm"
                          : "border-cyan-300 bg-slate-800/70 text-cyan-100 shadow-cyan-500/20")
                      : !isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500"
                    }
                  `}
                >
                  <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                    Alternating
                  </div>
                  <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                    Mix of topics and trivia
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${mode === 'custom'
                      ? (!isDark
                          ? "border-brand-primary bg-amber-100 text-brand-primary shadow-sm"
                          : "border-cyan-300 bg-slate-800/70 text-cyan-100 shadow-cyan-500/20")
                      : !isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500"
                    }
                  `}
                >
                  <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                    Custom
                  </div>
                  <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                    Configure your own rounds
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                Number of Rounds
              </label>
              <div className="flex gap-2">
                {[3, 5, 7, 10, 15].map((rounds) => (
                  <button
                    key={rounds}
                    type="button"
                    onClick={() => setTotalRounds(rounds)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg border-2 font-semibold transition-all
                      ${totalRounds === rounds
                        ? (!isDark
                            ? "border-brand-primary bg-amber-100 text-brand-primary"
                            : "border-cyan-300 bg-slate-800/70 text-cyan-100")
                        : !isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500"
                      }
                    `}
                  >
                    {rounds}
                  </button>
                ))}
              </div>
              <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                Each player will answer {totalRounds} prompt{totalRounds !== 1 ? 's' : ''} per round
              </p>
            </div>

            <p className={`text-xs ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              You'll get a 6-character room code and QR to share with players.
              Anonymous sign-in keeps things lightweight.
            </p>
          </form>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-700/50 bg-slate-900 p-4">
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              form="create-sociale-form"
              type="submit"
              isLoading={isCreating}
              disabled={isCreating}
            >
              Create session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
