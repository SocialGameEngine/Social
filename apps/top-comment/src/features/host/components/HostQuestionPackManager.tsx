import { useState, useEffect } from 'react';
import { Button } from '@social/ui';
import { HostModal } from './HostModal';
import { triviaService } from '../../../services/triviaService';
import type { QuestionPack, TriviaQuestion } from '../../../services/triviaService';

interface HostQuestionPackManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HostQuestionPackManager({ isOpen, onClose }: HostQuestionPackManagerProps) {
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'packs' | 'questions'>('packs');

  // Form states
  const [packForm, setPackForm] = useState({
    name: '',
    description: '',
    status: 'draft' as 'draft' | 'published'
  });

  const [questionForm, setQuestionForm] = useState({
    format: 'multiple_choice' as 'multiple_choice' | 'written_answer',
    categoryKey: 'general',
    difficulty: 'medium',
    prompt: '',
    explanation: '',
    hint: '',
    media: ''
  });

  const [options, setOptions] = useState([
    { id: 'a', text: '', isCorrect: false, sortOrder: 1 },
    { id: 'b', text: '', isCorrect: false, sortOrder: 2 },
    { id: 'c', text: '', isCorrect: false, sortOrder: 3 },
    { id: 'd', text: '', isCorrect: false, sortOrder: 4 }
  ]);

  const [aliases, setAliases] = useState<string[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPacks();
    }
  }, [isOpen]);

  const loadPacks = async () => {
    try {
      const data = await triviaService.getQuestionPacks({});
      setPacks(data);
    } catch (error) {
      console.error('Failed to load question packs:', error);
      setError('Failed to load question packs');
    }
  };

  const loadQuestions = async (packId: string) => {
    try {
      const data = await triviaService.getQuestions({ packId });
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setError('Failed to load questions');
    }
  };

  const handleCreatePack = async () => {
    if (!packForm.name.trim()) {
      setError('Please enter a pack name');
      return;
    }

    setIsCreatingPack(true);
    setError('');

    try {
      await triviaService.createQuestionPack({
        name: packForm.name,
        description: packForm.description,
        status: packForm.status,
        createdBy: 'current-user' // TODO: Get actual user ID
      });
      
      await loadPacks();
      setPackForm({ name: '', description: '', status: 'draft' });
    } catch (error) {
      console.error('Failed to create pack:', error);
      setError('Failed to create question pack');
    } finally {
      setIsCreatingPack(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedPackId || !questionForm.prompt.trim()) {
      setError('Please select a pack and enter a question');
      return;
    }

    setIsCreatingQuestion(true);
    setError('');

    try {
      const questionData = {
        packId: selectedPackId,
        format: questionForm.format,
        categoryKey: questionForm.categoryKey,
        difficulty: questionForm.difficulty as 'easy' | 'medium' | 'hard',
        prompt: questionForm.prompt,
        explanation: questionForm.explanation,
        hint: questionForm.hint,
        media: questionForm.media ? { imageUrl: questionForm.media } : undefined
      };

      if (questionForm.format === 'multiple_choice') {
        const validOptions = options.filter(opt => opt.text.trim());
        if (validOptions.length < 2) {
          setError('Multiple choice questions need at least 2 options');
          setIsCreatingQuestion(false);
          return;
        }

        const hasCorrectOption = validOptions.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
          setError('Multiple choice questions must have one correct option');
          setIsCreatingQuestion(false);
          return;
        }

        // Create the question first
        const question = await triviaService.createQuestion({
          ...questionData,
          status: 'draft',
          createdBy: 'current-user', // TODO: Get actual user ID
          tags: []
        });

        // Create options
        for (const option of validOptions) {
          await triviaService.createQuestionOption(question.id, {
            text: option.text,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder
          });
        }
      } else {
        // Written answer question
        const question = await triviaService.createQuestion({
          ...questionData,
          status: 'draft',
          createdBy: 'current-user', // TODO: Get actual user ID
          tags: []
        });

        // Create aliases
        for (const alias of aliases.filter(a => a.trim())) {
          await triviaService.createQuestionAlias(question.id, {
            text: alias,
            normalized: alias.toLowerCase()
          });
        }
      }

      await loadQuestions(selectedPackId);
      resetQuestionForm();
    } catch (error) {
      console.error('Failed to create question:', error);
      setError('Failed to create question');
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      format: 'multiple_choice',
      categoryKey: 'general',
      difficulty: 'medium',
      prompt: '',
      explanation: '',
      hint: '',
      media: ''
    });
    setOptions([
      { id: 'a', text: '', isCorrect: false, sortOrder: 1 },
      { id: 'b', text: '', isCorrect: false, sortOrder: 2 },
      { id: 'c', text: '', isCorrect: false, sortOrder: 3 },
      { id: 'd', text: '', isCorrect: false, sortOrder: 4 }
    ]);
    setAliases([]);
  };

  const updateOption = (id: string, field: string, value: any) => {
    setOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const addAlias = () => {
    setAliases(prev => [...prev, '']);
  };

  const updateAlias = (index: number, value: string) => {
    setAliases(prev => prev.map((alias, i) => i === index ? value : alias));
  };

  const removeAlias = (index: number) => {
    setAliases(prev => prev.filter((_, i) => i !== index));
  };

  const deletePack = async (packId: string) => {
    if (!confirm('Are you sure you want to delete this question pack? This will also delete all questions in the pack.')) {
      try {
        await triviaService.deleteQuestionPack(packId);
        await loadPacks();
        if (selectedPackId === packId) {
          setSelectedPackId('');
          setQuestions([]);
        }
      } catch (error) {
        console.error('Failed to delete pack:', error);
        setError('Failed to delete question pack');
      }
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      try {
        await triviaService.deleteQuestion(questionId);
        await loadQuestions(selectedPackId);
      } catch (error) {
        console.error('Failed to delete question:', error);
        setError('Failed to delete question');
      }
    }
  };

  return (
    <HostModal isOpen={isOpen} onClose={onClose} title="Question Pack Manager" maxWidth="2xl">
      <div className="space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'packs'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Question Packs ({packs.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            disabled={!selectedPackId}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            } ${!selectedPackId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Questions ({questions.length})
          </button>
        </div>

        {/* Packs Tab */}
        {activeTab === 'packs' && (
          <div className="space-y-4">
            {/* Create Pack Form */}
            <div className="bg-slate-800 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white">Create New Pack</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Pack Name</label>
                  <input
                    type="text"
                    value={packForm.name}
                    onChange={(e) => setPackForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g., Science Basics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={packForm.description}
                    onChange={(e) => setPackForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Optional description for the pack"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={packForm.status}
                    onChange={(e) => setPackForm(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <Button
                  onClick={handleCreatePack}
                  disabled={isCreatingPack || !packForm.name.trim()}
                  className="w-full"
                >
                  {isCreatingPack ? 'Creating...' : 'Create Pack'}
                </Button>
              </div>
            </div>

            {/* Packs List */}
            <div className="space-y-3">
              {packs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-4">📚</div>
                  <p>No question packs yet. Create your first pack above!</p>
                </div>
              ) : (
                packs.map((pack) => (
                  <div key={pack.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{pack.name}</h3>
                        {pack.description && (
                          <p className="text-sm text-slate-400 mt-1">{pack.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            pack.status === 'published'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {pack.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-slate-400">
                            {pack.questionCount || 0} questions
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedPackId(pack.id);
                            loadQuestions(pack.id);
                            setActiveTab('questions');
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          Manage
                        </Button>
                        {pack.status === 'draft' && (
                          <Button
                            onClick={() => deletePack(pack.id)}
                                                        size="sm"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {!selectedPackId ? (
              <>
                {/* Create Question Form */}
                <div className="bg-slate-800 rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-white">Create New Question</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Question Type</label>
                      <select
                        value={questionForm.format}
                        onChange={(e) => {
                          setQuestionForm(prev => ({ ...prev, format: e.target.value as 'multiple_choice' | 'written_answer' }));
                          resetQuestionForm();
                        }}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="written_answer">Written Answer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                      <input
                        type="text"
                        value={questionForm.categoryKey}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, categoryKey: e.target.value }))}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                        placeholder="e.g., science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                      <select
                        value={questionForm.difficulty}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Question</label>
                      <textarea
                        value={questionForm.prompt}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, prompt: e.target.value }))}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none resize-none"
                        rows={2}
                        placeholder="Enter your question here..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Explanation</label>
                      <textarea
                        value={questionForm.explanation}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none resize-none"
                        rows={2}
                        placeholder="Optional explanation for the answer"
                      />
                    </div>

                    {/* Multiple Choice Options */}
                    {questionForm.format === 'multiple_choice' && (
                      <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">Answer Options</label>
                      {options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                            placeholder={`Option ${option.id.toUpperCase()}`}
                            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
                          />
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => updateOption(option.id, 'isCorrect', e.target.checked)}
                            className="w-4 h-4 text-cyan-500"
                          />
                        </div>
                      ))}
                      <Button
                        onClick={() => setOptions(prev => [...prev, {
                          id: String.fromCharCode(97 + prev.length),
                          text: '',
                          isCorrect: false,
                          sortOrder: prev.length + 1
                        }])}
                        variant="secondary"
                        size="sm"
                      >
                        Add Option
                      </Button>
                    </div>
                    )}

                    {/* Written Answer Aliases */}
                    {questionForm.format === 'written_answer' && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-300">Answer Aliases</label>
                        {aliases.map((alias, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={alias}
                              onChange={(e) => updateAlias(index, e.target.value)}
                              placeholder={`Alias ${index + 1}`}
                              className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
                            />
                            <Button
                              onClick={() => removeAlias(index)}
                                                            size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={addAlias}
                          variant="secondary"
                          size="sm"
                        >
                          Add Alias
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={handleCreateQuestion}
                      disabled={isCreatingQuestion || !questionForm.prompt.trim()}
                      className="w-full"
                    >
                      {isCreatingQuestion ? 'Creating...' : 'Create Question'}
                    </Button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <div className="text-4xl mb-4">❓</div>
                      <p>No questions in this pack yet. Create your first question above!</p>
                    </div>
                  ) : (
                    questions.map((question) => (
                      <div key={question.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium line-clamp-2">{question.prompt}</h4>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className={question.difficulty === 'easy' ? 'text-green-500' : question.difficulty === 'hard' ? 'text-red-500' : 'text-yellow-500'}>
                                {question.difficulty}
                              </span>
                              <span>{question.categoryKey}</span>
                              <span>{question.format === 'multiple_choice' ? 'Multiple Choice' : 'Written Answer'}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteQuestion(question.id)}
                                                        size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-4">📚</div>
                <p>Select a question pack to manage questions</p>
              </div>
            )}
          </div>
        )}
      </div>
    </HostModal>
  );
}
