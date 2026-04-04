// =============================================================================
// SOCIALE CREATE MODAL
// =============================================================================
// Modal for creating new Sociales - matching Session modal design

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@social/ui';
import { FormField } from '@social/ui';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { supabase } from '../../../supabase/client';
import { usePromptLibraries } from '../../../shared/hooks/usePromptLibraries';
import type { CreateSocialeRequest, SocialeMode } from '../../../features/sociale';
import { 
  generateTopicsOnlyRounds, 
  generateTriviaOnlyRounds, 
  generateAlternatingRounds 
} from '../../../features/sociale/presets';
import type { PromptLibraryId } from '../../../shared/promptLibraries';

interface SocialeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSociale: (request: CreateSocialeRequest) => Promise<void>;
  onUpdateSociale?: (updates: {
    title?: string;
    description?: string;
    mode?: SocialeMode;
    totalRounds?: number;
  }) => Promise<void>;
  roomId: string;
  /**
   * When provided, the modal behaves like "Sociale settings":
   * same UI as create, but prefilled and saved via upsert.
   */
  existingSociale?: {
    id: string;
    title?: string | null;
    description?: string | null;
    mode?: SocialeMode;
    totalRounds?: number;
  } | null;
}

export function SocialeCreateModal({
  isOpen,
  onClose,
  onCreateSociale,
  onUpdateSociale,
  roomId,
  existingSociale,
}: SocialeCreateModalProps) {
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<CreateSocialeRequest['mode']>('alternating');
  const [totalRounds, setTotalRounds] = useState(5);
  const [selectedLibraries, setSelectedLibraries] = useState<PromptLibraryId[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Array<{
    roundNumber: number;
    type: string;
    prompt: string;
    libraryId?: string;
    libraryName?: string;
    validationError?: string | null;
    isValid: boolean;
  }>>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Load available prompt libraries
  const { data: libraries, isLoading: librariesLoading } = usePromptLibraries();

  // Generate preview data for rounds (async with loading state)
  const generatePreviewData = async () => {
    if (selectedLibraries.length === 0) return;
    
    // Show loading state
    setLoadingPreview(true);
    setPreviewData([{ roundNumber: 1, type: 'Loading...', prompt: 'Loading questions...', isValid: true }]);
    
    try {
      const preview: Array<{
        roundNumber: number;
        type: string;
        prompt: string;
        libraryId?: string;
        libraryName?: string;
        validationError?: string | null;
        isValid: boolean;
      }> = [];
      
      // Get the appropriate libraries based on mode
      let availableLibraries: typeof libraries = [];
      if (mode === 'topics_only') {
        availableLibraries = libraries?.filter(lib => lib.type === 'prompt') || [];
      } else if (mode === 'trivia_only') {
        availableLibraries = libraries?.filter(lib => lib.type === 'trivia') || [];
      } else if (mode === 'alternating') {
        availableLibraries = libraries || []; // All libraries for alternating
      } else {
        // Custom mode - don't show preview
        setPreviewData([]);
        setLoadingPreview(false);
        return;
      }
      
      // Filter selected libraries to only include ones that are appropriate for this mode
      const validSelectedLibraries = selectedLibraries.filter(libId => 
        availableLibraries.some(lib => lib.id === libId)
      );
      
      if (validSelectedLibraries.length === 0) {
        setPreviewData([]);
        setLoadingPreview(false);
        return;
      }
      
      // For alternating mode, libraries are already filtered by the preset functions
      
      // Generate rounds using the exact same logic as the presets
      let rounds: NonNullable<CreateSocialeRequest['rounds']> = [];
      if (mode === 'topics_only') {
        rounds = generateTopicsOnlyRounds(totalRounds, validSelectedLibraries);
      } else if (mode === 'trivia_only') {
        rounds = await generateTriviaOnlyRounds(totalRounds, validSelectedLibraries, availableLibraries);
      } else if (mode === 'alternating') {
        rounds = await generateAlternatingRounds(totalRounds, validSelectedLibraries, availableLibraries);
      }
      
      // For all libraries, fetch real content from database
      const libraryContent: Record<string, string[]> = {};
      const libraryQuestions: Record<string, any[]> = {};
      
      for (const libraryId of validSelectedLibraries) {
        const library = libraries?.find(lib => lib.id === libraryId);
        
        if (library) {
          try {
            if (library.type === 'trivia') {
              // Fetch complete trivia questions for this pack
              const { data: questions } = await supabase
                .from('trivia_questions')
                .select(`
                  id,
                  prompt,
                  format,
                  trivia_question_options (
                    option_id,
                    option_text,
                    is_correct,
                    sort_order
                  )
                `)
                .eq('pack_id', libraryId)
                .eq('status', 'published');
              
              if (questions && questions.length > 0) {
                libraryContent[libraryId] = questions.map((q: any) => q.prompt);
                // Store complete question data for edge function
                libraryQuestions[libraryId] = questions;
              } else {
                libraryContent[libraryId] = [];
                libraryQuestions[libraryId] = [];
              }
            } else if (library.type === 'prompt') {
              // Fetch real prompts for this library
              const { data: prompts } = await supabase
                .from('prompts')
                .select('text')
                .eq('library_id', libraryId)
                .eq('is_active', true);
              
              if (prompts && prompts.length > 0) {
                libraryContent[libraryId] = prompts.map((p: any) => p.text);
              }
            }
          } catch (error) {
            // Fallback to static content if available
            if (library.prompts && library.prompts.length > 0) {
              libraryContent[libraryId] = library.prompts;
            } else {
              libraryContent[libraryId] = library.type === 'trivia' 
                ? [] // No fallback - use empty array to trigger "No trivia questions available"
                : ['No prompts available'];
            }
          }
        }
      }
      
      // Generate preview using the actual round types from the presets
      const usedContent = new Set<string>();
      
      rounds.forEach((round: any, index: number) => {
        let prompt: string;
        let libraryId: string | undefined;
        let libraryName: string | undefined;
        let validationError: string | null = null;
        let isValid = true;
        
        if (round.type === 'trivia') {
          // For trivia rounds, use real questions with duplicate prevention
          libraryId = round.settings.questionPackId;
          const library = libraries?.find(lib => lib.id === libraryId);
          libraryName = library?.name || 'Unknown Pack';
          const questions = libraryId ? libraryContent[libraryId] : undefined;
          
          if (!questions || questions.length === 0) {
            prompt = 'No trivia questions available';
            validationError = 'No published questions in this pack';
            isValid = false;
          } else {
            let questionIndex = index % questions.length;
            let attempts = 0;
            
            // Find a question that hasn't been used yet
            while (usedContent.has(questions[questionIndex]) && attempts < questions.length) {
              questionIndex = (questionIndex + 1) % questions.length;
              attempts++;
            }
            
            prompt = questions[questionIndex] || 'Trivia question';
            usedContent.add(prompt);
            
            // Basic validation - check if prompt is empty
            if (!prompt || prompt.trim().length === 0) {
              validationError = 'Empty question prompt';
              isValid = false;
            }
          }
        } else {
          // For topic/prompt rounds, use real prompts with duplicate prevention
          libraryId = round.settings.promptLibraryId;
          const library = libraries?.find(lib => lib.id === libraryId);
          libraryName = library?.name || 'Unknown Library';
          const prompts = libraryId ? libraryContent[libraryId] : undefined;
          
          if (!prompts || prompts.length === 0) {
            prompt = 'No prompts available';
            validationError = 'No active prompts in this library';
            isValid = false;
          } else {
            let promptIndex = index % prompts.length;
            let attempts = 0;
            
            // Find a prompt that hasn't been used yet
            while (usedContent.has(prompts[promptIndex]) && attempts < prompts.length) {
              promptIndex = (promptIndex + 1) % prompts.length;
              attempts++;
            }
            
            prompt = prompts[promptIndex] || 'No prompt available';
            usedContent.add(prompt);
            
            // Basic validation
            if (!prompt || prompt.trim().length === 0) {
              validationError = 'Empty prompt';
              isValid = false;
            }
          }
        }
        
        preview.push({
          roundNumber: index + 1,
          type: round.type,
          prompt,
          libraryId,
          libraryName,
          validationError,
          isValid
        });
      });
      
      setPreviewData(preview);
      setLoadingPreview(false);
      
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setPreviewData([]);
      setLoadingPreview(false);
    }
  };
  
  // Regenerate content for a specific round
  const regenerateRoundContent = async (roundNumber: number) => {
    const roundIndex = roundNumber - 1;
    const round = previewData[roundIndex];
    if (!round) return;
    
    const updatedPreview = [...previewData];
    
    try {
      let newPrompt: string;
      let validationError: string | null = null;
      let isValid = true;
      
      if (round.type === 'trivia' && round.libraryId) {
        // Fetch a different question from the same pack
        const { data: questions } = await supabase
          .from('trivia_questions')
          .select('prompt')
          .eq('pack_id', round.libraryId)
          .eq('status', 'published')
          .neq('prompt', round.prompt);
        
        if (questions && questions.length > 0) {
          newPrompt = questions[Math.floor(Math.random() * questions.length)].prompt;
          isValid = true;
        } else {
          newPrompt = 'No other questions available';
          validationError = 'No alternative questions in pack';
          isValid = false;
        }
      } else if (round.libraryId) {
        // Fetch a different prompt from the same library
        const { data: prompts } = await supabase
          .from('prompts')
          .select('text')
          .eq('library_id', round.libraryId)
          .eq('is_active', true)
          .neq('text', round.prompt);
        
        if (prompts && prompts.length > 0) {
          newPrompt = prompts[Math.floor(Math.random() * prompts.length)].text;
          isValid = true;
        } else {
          newPrompt = 'No other prompts available';
          validationError = 'No alternative prompts in library';
          isValid = false;
        }
      } else {
        return; // No library ID, can't regenerate
      }
      
      updatedPreview[roundIndex] = {
        ...updatedPreview[roundIndex],
        prompt: newPrompt,
        validationError,
        isValid
      };
      setPreviewData(updatedPreview);
    } catch (error) {
      console.error('Failed to regenerate content:', error);
    }
  };
  
  // Change round type (toggle between topic and trivia for alternating mode)
  const changeRoundType = (roundNumber: number) => {
    if (mode !== 'alternating') return; // Only allow in alternating mode
    
    const roundIndex = roundNumber - 1;
    const round = previewData[roundIndex];
    if (!round) return;
    
    const newType = round.type === 'trivia' ? 'topic' : 'trivia';
    const updatedPreview = [...previewData];
    
    // Get appropriate library for new type
    const appropriateLibs = libraries?.filter(lib => 
      lib.type === (newType === 'trivia' ? 'trivia' : 'prompt')
    ) || [];
    const selectedAppropriateLibs = selectedLibraries.filter(libId =>
      appropriateLibs.some(lib => lib.id === libId)
    );
    
    if (selectedAppropriateLibs.length === 0) {
      // Can't change type if no libraries of that type are selected
      return;
    }
    
    const newLibraryId = selectedAppropriateLibs[0];
    const newLibrary = libraries?.find(lib => lib.id === newLibraryId);
    
    updatedPreview[roundIndex] = {
      ...updatedPreview[roundIndex],
      type: newType,
      libraryId: newLibraryId,
      libraryName: newLibrary?.name || 'Unknown',
      prompt: 'Loading...',
      validationError: null,
      isValid: true
    };
    setPreviewData(updatedPreview);
    
    // Regenerate content for the new type
    setTimeout(() => regenerateRoundContent(roundNumber), 100);
  };
  
  // Change library for a specific round
  const changeRoundLibrary = (roundNumber: number) => {
    const roundIndex = roundNumber - 1;
    const round = previewData[roundIndex];
    if (!round) return;
    
    // Get appropriate libraries for this round type
    const appropriateLibs = libraries?.filter(lib => 
      lib.type === (round.type === 'trivia' ? 'trivia' : 'prompt')
    ) || [];
    const selectedAppropriateLibs = selectedLibraries.filter(libId =>
      appropriateLibs.some(lib => lib.id === libId)
    );
    
    if (selectedAppropriateLibs.length <= 1) return; // Need at least 2 to cycle
    
    // Find next library in the list
    const currentIndex = selectedAppropriateLibs.indexOf(round.libraryId || '');
    const nextIndex = (currentIndex + 1) % selectedAppropriateLibs.length;
    const newLibraryId = selectedAppropriateLibs[nextIndex];
    const newLibrary = libraries?.find(lib => lib.id === newLibraryId);
    
    const updatedPreview = [...previewData];
    updatedPreview[roundIndex] = {
      ...updatedPreview[roundIndex],
      libraryId: newLibraryId,
      libraryName: newLibrary?.name || 'Unknown',
      prompt: 'Loading...',
      validationError: null,
      isValid: true
    };
    setPreviewData(updatedPreview);
    
    // Regenerate content for the new library
    setTimeout(() => regenerateRoundContent(roundNumber), 100);
  };

  // Auto-generate preview when libraries, mode, or rounds changes
  React.useEffect(() => {
    if (selectedLibraries.length > 0 && mode !== 'custom') {
      generatePreviewData();
    } else {
      setPreviewData([]);
    }
  }, [selectedLibraries, mode, totalRounds]);

  const isEditing = Boolean(existingSociale?.id);

  // Toggle library selection
  const toggleLibrary = (libraryId: PromptLibraryId) => {
    setSelectedLibraries(prev => {
      const selected = prev;
      if (selected.includes(libraryId)) {
        return selected.filter(id => id !== libraryId);
      } else if (selected.length < 6) {
        return [...selected, libraryId];
      }
      return prev;
    });
  };

  // Validate form can be submitted
  // Get libraries grouped by type for the current mode
  const getRequiredLibrarySections = () => {
    const sections: Array<{type: 'prompt' | 'trivia', label: string, libraries: typeof libraries}> = [];
    
    if (mode === 'topics_only') {
      sections.push({
        type: 'prompt',
        label: 'Prompt Libraries',
        libraries: libraries?.filter(lib => lib.type === 'prompt') || []
      });
    } else if (mode === 'trivia_only') {
      sections.push({
        type: 'trivia', 
        label: 'Trivia Libraries',
        libraries: libraries?.filter(lib => lib.type === 'trivia') || []
      });
    } else if (mode === 'alternating') {
      sections.push(
        {
          type: 'prompt',
          label: 'Prompt Libraries',
          libraries: libraries?.filter(lib => lib.type === 'prompt') || []
        },
        {
          type: 'trivia',
          label: 'Trivia Libraries', 
          libraries: libraries?.filter(lib => lib.type === 'trivia') || []
        }
      );
    }
    
    return sections;
  };
  const getLibraryValidationError = () => {
    if (mode === 'custom') return null; // Custom mode has its own validation
    
    const selectedLibraryTypes = new Set(
      selectedLibraries.map(libId => {
        const lib = libraries?.find(l => l.id === libId);
        return lib?.type;
      }).filter((type): type is 'prompt' | 'trivia' => type !== undefined)
    );
    
    const requiredTypes: ('prompt' | 'trivia')[] = [];
    if (mode === 'topics_only') {
      requiredTypes.push('prompt'); // Need prompt libraries
    } else if (mode === 'trivia_only') {
      requiredTypes.push('trivia'); // Need trivia libraries
    } else if (mode === 'alternating') {
      requiredTypes.push('prompt', 'trivia'); // Need both
    }
    
    // Check if all required types are covered
    const missingTypes = requiredTypes.filter(type => !selectedLibraryTypes.has(type));
    
    if (missingTypes.length > 0) {
      const typeNames: Record<'prompt' | 'trivia', string> = {
        'prompt': 'prompt libraries',
        'trivia': 'trivia libraries'
      };
      
      if (requiredTypes.length === 1) {
        return `${mode === 'topics_only' ? 'Topics' : mode === 'trivia_only' ? 'Trivia' : 'This'} mode requires at least one ${typeNames[missingTypes[0]]}`;
      } else {
        return `Alternating mode requires both ${missingTypes.map(type => typeNames[type]).join(' and ')}`;
      }
    }
    
    return null;
  };
  
  const libraryValidationError = getLibraryValidationError();
  const hasInvalidRounds = previewData.some(round => !round.isValid);
  const invalidRoundCount = previewData.filter(round => !round.isValid).length;
  const canSubmit = mode === 'custom' 
    ? true 
    : (selectedLibraries.length >= 1 && !libraryValidationError && !hasInvalidRounds);

  // Prevent background page scroll while the full-screen modal is open.
  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen || isCreating) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isCreating, onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (isEditing) {
      setTitle(existingSociale?.title ?? '');
      setDescription(existingSociale?.description ?? '');
      if (existingSociale?.mode) setMode(existingSociale.mode);
      if (typeof existingSociale?.totalRounds === 'number') setTotalRounds(existingSociale.totalRounds);
    } else {
      // Reset to create defaults when opening in create mode.
      setTitle('');
      setDescription('');
      setMode('alternating');
      setTotalRounds(5);
    }
  }, [
    isOpen,
    isEditing,
    existingSociale?.title,
    existingSociale?.description,
    existingSociale?.mode,
    existingSociale?.totalRounds,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Editing: update existing Sociale (preserve id)
      if (isEditing && onUpdateSociale) {
        await onUpdateSociale({
          title: title || undefined,
          description: description || undefined,
          mode,
          totalRounds,
        });
        onClose();
        return;
      }

      // Get appropriate libraries for this mode
      let availableLibraries: typeof libraries = [];
      if (mode === 'topics_only') {
        availableLibraries = libraries?.filter(lib => lib.type === 'prompt') || [];
      } else if (mode === 'trivia_only') {
        availableLibraries = libraries?.filter(lib => lib.type === 'trivia') || [];
      } else if (mode === 'alternating') {
        availableLibraries = libraries || [];
      }

      // Generate rounds using preset functions
      let rounds: NonNullable<CreateSocialeRequest['rounds']> = [];
      if (mode === 'topics_only') {
        rounds = generateTopicsOnlyRounds(totalRounds, selectedLibraries);
      } else if (mode === 'trivia_only') {
        rounds = await generateTriviaOnlyRounds(totalRounds, selectedLibraries, availableLibraries);
      } else if (mode === 'alternating') {
        rounds = await generateAlternatingRounds(totalRounds, selectedLibraries, libraries);
      }

      // Use the exact preview content that was shown to the user
      const populatedRounds = rounds.map((round: any, roundIndex: number) => {
        const previewRound = previewData[roundIndex];
        
        if (previewRound && previewRound.prompt) {
          // Use the exact content from preview
          return {
            ...round,
            title: previewRound.type === 'topic' ? 'Hot Topic' : 'Trivia Question',
            content: previewRound.prompt,
          };
        } else {
          // Fallback content if preview data is missing
          const fallbackTitle = round.type === 'topic' ? 'Hot Topic' : 'Trivia Question';
          const fallbackContent = round.type === 'topic' 
            ? 'No prompt available' 
            : 'No trivia question available';
          
          return {
            ...round,
            title: fallbackTitle,
            content: fallbackContent,
          };
        }
      });

      // Create preview questions array for exact order matching
      const previewQuestions = previewData.map((preview, index) => {
        if (preview.type === 'trivia') {
          return {
            roundIndex: index,
            prompt: preview.prompt,
            format: 'multiple_choice', // We'll detect this in the edge function
            questionId: preview.prompt, // Use prompt as temporary ID
            libraryId: preview.libraryId,
          };
        }
        return null;
      }).filter(Boolean);

      const request: CreateSocialeRequest = {
        roomId,
        title: title || undefined,
        description: description || undefined,
        mode,
        totalRounds,
        selectedLibraries: mode === 'custom' ? undefined : selectedLibraries,
        rounds: mode === 'custom' ? undefined : populatedRounds,
        previewQuestions: previewQuestions.length > 0 ? previewQuestions : undefined,
      };

      await onCreateSociale(request);
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
      setTotalRounds(5);
      setMode('alternating');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? 'Failed to save Sociale settings'
            : 'Failed to create Sociale'
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isCreating ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? 'Sociale Settings' : 'Create Sociale'}
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
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-24 sm:p-6 sm:pb-24">
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
              error={error ? 'Failed to save Sociale' : undefined}
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
              error={error ? 'Failed to save Sociale' : undefined}
              isDark={isDark}
            />

            <>
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                    Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('topics_only')}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${mode === 'topics_only'
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
                      onClick={() => setMode('trivia_only')}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${mode === 'trivia_only'
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

                {/* Prompt Library Selection */}
                {mode !== 'custom' && (
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                      Select Prompt Libraries
                    </label>
                    <p className={`text-xs mb-3 ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                      {mode === 'topics_only' && 'Topics mode requires at least one prompt library'}
                      {mode === 'trivia_only' && 'Trivia mode requires at least one trivia library'}
                      {mode === 'alternating' && 'Alternating mode requires both prompt and trivia libraries'}
                      {selectedLibraries.length}/6 libraries selected
                    </p>
                    {libraryValidationError && (
                      <div className={`text-xs p-2 rounded ${!isDark ? 'bg-red-100 text-red-700' : 'bg-red-900/50 text-red-300'}`}>
                        {libraryValidationError}
                      </div>
                    )}
                    {librariesLoading ? (
                      <div className={`text-center py-8 ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                        Loading libraries...
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {getRequiredLibrarySections().map((section) => (
                          <div key={section.type} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                                {section.label}
                              </label>
                              <span className={`text-xs px-2 py-1 rounded-full ${!isDark ? 'bg-slate-200 text-slate-600' : 'bg-slate-700 text-slate-300'}`}>
                                {selectedLibraries.filter(id => 
                                  libraries?.find(lib => lib.id === id)?.type === section.type
                                ).length} selected
                              </span>
                            </div>
                            {(section.libraries || []).length === 0 ? (
                              <div className={`text-center py-4 rounded-lg border ${!isDark ? 'border-slate-300 bg-slate-50 text-slate-500' : 'border-slate-600 bg-slate-800 text-slate-400'}`}>
                                No {section.type.toLowerCase()} libraries available yet
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {(section.libraries || []).map((library) => {
                                  const isSelected = selectedLibraries.includes(library.id);
                                  const canSelect = isSelected || selectedLibraries.length < 6;
                                  const hasSelectedThisType = selectedLibraries.some(id => 
                                    libraries?.find(lib => lib.id === id)?.type === section.type
                                  );

                                  return (
                                    <button
                                      key={library.id}
                                      type="button"
                                      onClick={() => canSelect && toggleLibrary(library.id)}
                                      disabled={!canSelect}
                                      className={`
                                        relative rounded-lg p-3 text-center transition-all
                                        ${isSelected
                                          ? "border-brand-primary bg-brand-light scale-95"
                                          : canSelect && !hasSelectedThisType
                                            ? (!isDark ? "border-amber-300 bg-amber-50 hover:border-amber-400" : "border-amber-600 bg-amber-900/30 hover:border-amber-500")
                                            : canSelect
                                              ? (!isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500")
                                              : "opacity-30 cursor-not-allowed border-slate-200 bg-slate-50"
                                        }
                                      `}
                                    >
                                      <div className="text-xl mb-1">{library.emoji}</div>
                                      <div className={`text-xs font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                                        {library.name}
                                      </div>
                                      <div className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'} capitalize`}>
                                        {library.type}
                                      </div>
                                      {isSelected && (
                                        <div className="text-brand-primary text-xs mt-1">✓</div>
                                      )}
                                      {!hasSelectedThisType && (
                                        <div className="text-amber-500 text-xs mt-1">•</div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
              </>

            <p className={`text-xs ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              You'll get a 6-character room code and QR to share with players.
              Anonymous sign-in keeps things lightweight.
            </p>

            {/* Preview Section */}
            {mode !== 'custom' && selectedLibraries.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
                      Preview Rounds
                    </label>
                    {hasInvalidRounds && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        !isDark ? 'bg-red-100 text-red-700' : 'bg-red-900/50 text-red-300'
                      }`}>
                        {invalidRoundCount} invalid
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={generatePreviewData}
                    disabled={loadingPreview}
                    className={`
                      px-3 py-1.5 text-xs rounded-lg font-medium transition-all
                      ${!isDark 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50' 
                        : 'bg-amber-900/50 text-amber-300 hover:bg-amber-900/70 disabled:opacity-50'
                      }
                    `}
                    title="Regenerate all prompts"
                  >
                    🔄 Regenerate All
                  </button>
                </div>
                
                {(loadingPreview || previewData.length > 0) && (
                  <div className={`max-h-96 overflow-y-auto rounded-lg border ${!isDark ? 'border-slate-300 bg-slate-50' : 'border-slate-600 bg-slate-800'}`}>
                    <div className="space-y-2 p-2 sm:p-3">
                      {loadingPreview ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                          <span className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            Loading questions...
                          </span>
                        </div>
                      ) : (
                        previewData.map((round) => {
                          return (
                        <div 
                          key={round.roundNumber}
                          className={`p-2 sm:p-3 rounded-lg border-2 ${
                            !round.isValid
                              ? (!isDark ? 'border-red-300 bg-red-50' : 'border-red-700 bg-red-900/20')
                              : (!isDark ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900')
                          }`}
                        >
                          {/* Round header with type and controls */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                Round {round.roundNumber}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                round.type === 'topic' 
                                  ? (!isDark ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/50 text-blue-300')
                                  : (!isDark ? 'bg-green-100 text-green-700' : 'bg-green-900/50 text-green-300')
                              }`}>
                                {round.type}
                              </span>
                              {round.libraryName && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  !isDark ? 'bg-slate-200 text-slate-600' : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {round.libraryName}
                                </span>
                              )}
                              {!round.isValid && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  !isDark ? 'bg-red-200 text-red-800' : 'bg-red-800 text-red-200'
                                }`}>
                                  ⚠️ Invalid
                                </span>
                              )}
                            </div>
                            
                            {/* Regeneration controls */}
                            <div className="flex items-center gap-1">
                              {mode === 'alternating' && (
                                <button
                                  type="button"
                                  onClick={() => changeRoundType(round.roundNumber)}
                                  className={`
                                    px-2 py-1 text-xs rounded font-medium transition-all
                                    ${!isDark 
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                      : 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                                    }
                                  `}
                                  title="Change round type"
                                >
                                  ⇄
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => changeRoundLibrary(round.roundNumber)}
                                className={`
                                  px-2 py-1 text-xs rounded font-medium transition-all
                                  ${!isDark 
                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                    : 'bg-purple-900/50 text-purple-300 hover:bg-purple-900/70'
                                  }
                                `}
                                title="Change library"
                              >
                                📚
                              </button>
                              <button
                                type="button"
                                onClick={() => regenerateRoundContent(round.roundNumber)}
                                className={`
                                  px-2 py-1 text-xs rounded font-medium transition-all
                                  ${!isDark 
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                    : 'bg-amber-900/50 text-amber-300 hover:bg-amber-900/70'
                                  }
                                `}
                                title="Regenerate content"
                              >
                                🔄
                              </button>
                            </div>
                          </div>
                          
                          {/* Prompt content */}
                          <p className={`text-sm mb-1 ${
                            !round.isValid
                              ? (!isDark ? 'text-red-700' : 'text-red-300')
                              : (!isDark ? 'text-slate-700' : 'text-slate-300')
                          }`}>
                            {round.prompt}
                          </p>
                          
                          {/* Validation error */}
                          {round.validationError && (
                            <div className={`mt-2 p-2 rounded text-xs ${
                              !isDark ? 'bg-red-100 text-red-800' : 'bg-red-900/30 text-red-200'
                            }`}>
                              <span className="font-semibold">Error:</span> {round.validationError}
                            </div>
                          )}
                        </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
                
                {/* Invalid rounds warning */}
                {hasInvalidRounds && (
                  <div className={`p-3 rounded-lg border-2 ${
                    !isDark ? 'bg-red-50 border-red-300 text-red-800' : 'bg-red-900/20 border-red-700 text-red-200'
                  }`}>
                    <p className="text-sm font-semibold mb-1">⚠️ Cannot Create Sociale</p>
                    <p className="text-xs">
                      {invalidRoundCount} round{invalidRoundCount !== 1 ? 's' : ''} {invalidRoundCount !== 1 ? 'have' : 'has'} validation errors. 
                      Use the regeneration controls (🔄 📚 ⇄) to fix invalid rounds before creating.
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-700/50 bg-slate-900 p-4">
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              form="create-sociale-form"
              type="submit"
              isLoading={isCreating}
              disabled={isCreating || !canSubmit}
              title={hasInvalidRounds ? `Fix ${invalidRoundCount} invalid round${invalidRoundCount !== 1 ? 's' : ''} first` : undefined}
            >
              {isEditing ? 'Save settings' : 'Create Sociale'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
