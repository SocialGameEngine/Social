import { useState } from 'react';
import TriviaLibraryForm from './TriviaLibraryForm';
import type { TriviaQuestionPack, TriviaQuestionPackWithCounts } from '../types/trivia';
import { getErrorMessage } from '../utils/get-error-message';
import { showToast } from './Toast';

interface Props {
  libraries: TriviaQuestionPackWithCounts[];
  selectedLibraryId: string | null;
  onSelect: (id: string) => void;
  onCreate: (data: { name: string; description: string }) => Promise<void>;
  onUpdate: (data: { name: string; description: string }) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function TriviaLibraryList({
  libraries,
  selectedLibraryId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingLibrary, setEditingLibrary] = useState<TriviaQuestionPack | null>(null);

  const handleCreateLibrary = async (data: { name: string; description: string }): Promise<void> => {
    try {
      await onCreate(data);
      setFormMode(null);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to create trivia library'), 'error');
    }
  };

  const handleUpdateLibrary = async (data: { name: string; description: string }): Promise<void> => {
    try {
      await onUpdate(data);
      setFormMode(null);
      setEditingLibrary(null);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update trivia library'), 'error');
    }
  };

  const handleStartCreate = (): void => {
    setEditingLibrary(null);
    setFormMode('create');
  };

  const handleStartEdit = (library: TriviaQuestionPack): void => {
    setEditingLibrary(library);
    setFormMode('edit');
  };

  const handleCancelForm = (): void => {
    setFormMode(null);
    setEditingLibrary(null);
  };

  if (formMode) {
    return (
      <TriviaLibraryForm
        mode={formMode}
        initialData={editingLibrary ? {
          id: editingLibrary.id,
          name: editingLibrary.name,
          description: editingLibrary.description ?? ''
        } : undefined}
        onSubmit={formMode === 'create' ? handleCreateLibrary : handleUpdateLibrary}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <div className="library-list">
      <div className="library-header">
        <h3>Trivia Libraries</h3>
        <button className="btn btn-primary btn-sm" onClick={handleStartCreate}>
          + New Library
        </button>
      </div>

      <div className="libraries">
        {libraries.map((library) => (
          <div
            key={library.id}
            className={`library-item ${selectedLibraryId === library.id ? 'selected' : ''}`}
            onClick={() => onSelect(library.id)}
          >
            <div className="library-info">
              <h4>{library.name}</h4>
              <p>{library.description || 'No description'}</p>
              <div className="library-stats">
                <span className="stat">
                  {library.questionCount} questions
                </span>
                <span className={`stat ${library.publishedCount > 0 ? 'published' : 'draft'}`}>
                  {library.publishedCount} published
                </span>
                {library.draftCount > 0 && (
                  <span className="stat draft">{library.draftCount} draft</span>
                )}
              </div>
            </div>
            <div className="library-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(library);
                }}
              >
                Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(library.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {libraries.length === 0 && (
          <div className="empty-libraries">
            <p>No trivia libraries yet. Create your first library to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
