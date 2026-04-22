import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import TriviaQuestionForm from './TriviaQuestionForm';
import TriviaBulkImport from './TriviaBulkImport';
import AIPromptGenerator from './AIPromptGenerator';
import { supabase } from '../services/database';
import {
  createTriviaQuestion,
  deleteTriviaQuestion,
  getTriviaQuestions,
  replaceTriviaQuestions,
  updateTriviaQuestion,
} from '../services/triviaDatabase';
import type { TriviaQuestionPackWithCounts, TriviaQuestionWithDetails } from '../types/trivia';
import { getErrorMessage } from '../utils/get-error-message';
import { queryKeys } from '../lib/queryKeys';
import { showToast } from './Toast';

interface Props {
  library: TriviaQuestionPackWithCounts;
  onLibraryUpdated: () => Promise<void>;
}

function TriviaQuestionList({ library, onLibraryUpdated }: Props) {
  const queryClient = useQueryClient();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  const storageKey = `trivia-filters-${library.id}`;
  
  const [searchValue, setSearchValue] = useState<string>(() => {
    try { 
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return saved.searchText ?? '';
    } catch { return ''; }
  });
  
  const [filterFormat, setFilterFormat] = useState<'all' | 'multiple_choice' | 'written_answer'>(() => {
    try { 
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return saved.formatFilter ?? 'all';
    } catch { return 'all'; }
  });
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>(() => {
    try { 
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return saved.statusFilter ?? 'all';
    } catch { return 'all'; }
  });

  const questionsQuery = useQuery({
    queryKey: queryKeys.triviaQuestions(library.id),
    queryFn: () => getTriviaQuestions(library.id),
  });

  const questions = questionsQuery.data ?? [];

  const filteredQuestions = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return questions.filter((question) => {
      const matchesSearch = !term || 
        question.prompt.toLowerCase().includes(term) ||
        question.category_key.toLowerCase().includes(term) ||
        (question.tags && question.tags.some(tag => tag.toLowerCase().includes(term)));
      
      const matchesFormat = filterFormat === 'all' || question.format === filterFormat;
      const matchesStatus = filterStatus === 'all' || question.status === filterStatus;
      
      return matchesSearch && matchesFormat && matchesStatus;
    });
  }, [questions, searchValue, filterFormat, filterStatus]);

  // Sync filter state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ 
      searchText: searchValue, 
      formatFilter: filterFormat, 
      statusFilter: filterStatus 
    }));
  }, [searchValue, filterFormat, filterStatus, storageKey]);

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any): Promise<void> => {
      const question = await createTriviaQuestion(data);
      
      // Create options if multiple choice
      if (data.format === 'multiple_choice' && data.options) {
        for (const option of data.options) {
          await supabase
            .from('trivia_question_options')
            .insert({
              question_id: question.id,
              option_id: option.option_id,
              option_text: option.option_text,
              is_correct: option.is_correct,
              sort_order: option.sort_order,
            });
        }
      }
      
      // Create aliases if written answer
      if (data.format === 'written_answer' && data.aliases) {
        for (const alias of data.aliases) {
          await supabase
            .from('trivia_question_aliases')
            .insert({
              question_id: question.id,
              alias_text: alias.alias_text,
              alias_normalized: alias.alias_text.toLowerCase().trim(),
              match_type: 'alias',
            });
        }
      }
    },
    onSuccess: async () => {
      setEditingQuestionId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.triviaQuestions(library.id) });
      await onLibraryUpdated();
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<TriviaQuestionWithDetails> }): Promise<void> => {
      const { id, data } = payload;
      await updateTriviaQuestion(id, {
        format: data.format,
        category_key: data.category_key,
        difficulty: data.difficulty,
        prompt: data.prompt,
        explanation: data.explanation,
        hint: data.hint,
        tags: data.tags,
        status: data.status,
      });
    },
    onSuccess: async () => {
      setEditingQuestionId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.triviaQuestions(library.id) });
      await onLibraryUpdated();
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deleteTriviaQuestion(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.triviaQuestions(library.id) });
      await onLibraryUpdated();
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (rows: any[]): Promise<void> => {
      await replaceTriviaQuestions(library.id, rows);
    },
    onSuccess: async () => {
      setShowImport(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.triviaQuestions(library.id) });
      await onLibraryUpdated();
    },
  });

  
  const handleDeleteQuestion = async (id: string): Promise<void> => {
    if (!confirm('Delete this question? This cannot be undone.')) {
      return;
    }
    try {
      await deleteQuestionMutation.mutateAsync(id);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to delete question'), 'error');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string): Promise<void> => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await updateQuestionMutation.mutateAsync({ 
        id, 
        data: { status: newStatus as 'draft' | 'published' | 'archived' }
      });
      showToast(`Question ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, `Failed to ${newStatus === 'published' ? 'publish' : 'unpublish'} question`), 'error');
    }
  };

  const handlePublishAllDrafts = async (): Promise<void> => {
    const draftQuestions = questions.filter(q => q.status === 'draft');
    if (draftQuestions.length === 0) {
      showToast('No draft questions to publish', 'info');
      return;
    }
    
    if (!confirm(`Publish all ${draftQuestions.length} draft questions?`)) {
      return;
    }

    try {
      await Promise.all(
        draftQuestions.map(question => 
          updateQuestionMutation.mutateAsync({ 
            id: question.id, 
            data: { status: 'published' }
          })
        )
      );
      showToast(`Published ${draftQuestions.length} questions successfully`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to publish questions'), 'error');
    }
  };

  const handleBulkImport = async (rows: any[]): Promise<void> => {
    try {
      await bulkImportMutation.mutateAsync(rows);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to import questions'), 'error');
    }
  };

  if (questionsQuery.isLoading) {
    return (
      <div style={{ padding: 24 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            height: 72,
            background: '#f1f5f9',
            borderRadius: 6,
            marginBottom: 8,
            animation: 'pulse 1.5s ease-in-out infinite',
            opacity: 1 - i * 0.15,
          }} />
        ))}
      </div>
    );
  }

  return (
    <div className="prompt-list">
      {/* AI Prompt Generator */}
      <AIPromptGenerator type="trivia" />

      {/* Library Header */}
      <div className="prompt-header">
        <div>
          <h2>
            {library.name}
          </h2>
          <p className="prompt-subtitle">{library.description}</p>
        </div>
        <div className="prompt-header-actions">
          <span className="prompt-count">{questions.length} questions</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="prompt-toolbar">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button 
            className="btn btn-success btn-sm" 
            onClick={handlePublishAllDrafts}
            disabled={questions.filter(q => q.status === 'draft').length === 0}
          >
            Publish All Drafts ({questions.filter(q => q.status === 'draft').length})
          </button>
          </div>
      </div>

      {/* Add Question Dropdown */}
      <div className="ai-prompt-generator" style={{ 
        background: '#f0fdf4', 
        border: '1px solid #16a34a', 
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
            background: 'rgba(22, 163, 74, 0.1)',
            borderBottom: showAddForm ? '1px solid #16a34a' : 'none'
          }}
          onClick={() => {
              if (!showAddForm) {
                setShowAddForm(true);
              } else {
                setShowAddForm(false);
                setEditingQuestionId(null);
              }
            }}
        >
          <h4 style={{ margin: 0, color: '#166534', fontSize: '14px' }}>
            {editingQuestionId === 'new' ? 'Add Question' : 'Edit Question'}
          </h4>
          <span style={{ 
            fontSize: '12px', 
            color: '#16a34a',
            transition: 'transform 0.2s',
            transform: showAddForm ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block'
          }}>
            &#9662;
          </span>
        </div>

        {showAddForm && (
          <div style={{ padding: '16px' }}>
            <TriviaQuestionForm
              mode={editingQuestionId === 'new' ? 'create' : 'edit'}
              initialData={editingQuestionId === 'new' ? undefined : questions.find(q => q.id === editingQuestionId)}
              packId={library.id}
              onSubmit={async (data: any) => {
                if (editingQuestionId === 'new') {
                  await createQuestionMutation.mutateAsync(data);
                } else if (editingQuestionId) {
                  await updateQuestionMutation.mutateAsync({ id: editingQuestionId, data });
                }
                setShowAddForm(false);
                setEditingQuestionId(null);
              }}
              onCancel={() => {
                setShowAddForm(false);
                setEditingQuestionId(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Bulk Import Dropdown */}
      <div className="ai-prompt-generator" style={{ 
        background: '#fef3c7', 
        border: '1px solid #f59e0b', 
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
            background: 'rgba(245, 158, 11, 0.1)',
            borderBottom: showImport ? '1px solid #f59e0b' : 'none'
          }}
          onClick={() => setShowImport(!showImport)}
        >
          <h4 style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            Bulk Import
          </h4>
          <span style={{ 
            fontSize: '12px', 
            color: '#f59e0b',
            transition: 'transform 0.2s',
            transform: showImport ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block'
          }}>
            &#9662;
          </span>
        </div>

        {showImport && (
          <div style={{ padding: '16px' }}>
            <TriviaBulkImport onImport={handleBulkImport} existingQuestionCount={questions.length} />
          </div>
        )}
      </div>

      {/* Search and Filter Toolbar */}
      <div className="prompt-toolbar">
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <select value={filterFormat} onChange={e => setFilterFormat(e.target.value as any)}>
            <option value="all">All Formats</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="written_answer">Written Answer</option>
          </select>
          
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search questions..."
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div className="prompts">
        {filteredQuestions.map((question) => {
          return (
            <div key={question.id} className="prompt-item">
              <div className="prompt-index">
                {question.format === 'multiple_choice' ? 'MC' : 'WA'}
              </div>

              <div className="prompt-content">
                <div className="prompt-text">
                  <strong>{question.prompt}</strong>
                  <div className="prompt-meta">
                    <span className={`status ${question.status}`}>{question.status}</span>
                    <span className="category">{question.category_key}</span>
                    <span className="difficulty">{question.difficulty}</span>
                  </div>
                </div>
                {question.explanation && (
                  <div className="prompt-explanation">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
                {question.tags && question.tags.length > 0 && (
                  <div className="prompt-tags">
                    {question.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="prompt-actions">
                <button
                  type="button"
                  onClick={() => void handleTogglePublish(question.id, question.status)}
                  className={`btn btn-sm ${question.status === 'published' ? 'btn-warning' : 'btn-success'}`}
                >
                  {question.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                  setEditingQuestionId(question.id);
                  setShowAddForm(true);
                }}
                  className="btn btn-secondary btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => void handleDeleteQuestion(question.id)}
                  className="btn btn-danger btn-sm"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {filteredQuestions.length === 0 && (
          <div className="empty-prompts">No questions match that filter.</div>
        )}
      </div>
    </div>
  );
}

export default TriviaQuestionList;
