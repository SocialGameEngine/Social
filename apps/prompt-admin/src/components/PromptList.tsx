import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import BulkImport from "./BulkImport";
import {
  createPrompt,
  createPromptsBulk,
  deletePrompt,
  getPrompts,
  reorderPrompts,
  updatePrompt,
} from "../services/database";
import type { Prompt, PromptLibrary } from "../types/prompts";
import { getErrorMessage } from "../utils/get-error-message";

interface PromptListProps {
  library: PromptLibrary & { promptCount: number };
  onLibraryUpdated: () => Promise<void>;
}

function PromptList({ library, onLibraryUpdated }: PromptListProps) {
  const queryClient = useQueryClient();
  const [newPromptText, setNewPromptText] = useState("");
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [showImport, setShowImport] = useState(false);

  const promptsQuery = useQuery({
    queryKey: ["prompts", library.id],
    queryFn: () => getPrompts(library.id),
  });

  const prompts = promptsQuery.data ?? [];

  const filteredPrompts = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      return prompts;
    }
    return prompts.filter((prompt) => prompt.text.toLowerCase().includes(term));
  }, [prompts, searchValue]);

  const createPromptMutation = useMutation({
    mutationFn: async (text: string): Promise<void> => {
      await createPrompt({
        library_id: library.id,
        text,
        sort_order: prompts.length,
        is_active: true,
      });
    },
    onSuccess: async () => {
      setNewPromptText("");
      await queryClient.invalidateQueries({ queryKey: ["prompts", library.id] });
      await onLibraryUpdated();
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async (payload: { id: string; text: string }): Promise<void> => {
      await updatePrompt(payload.id, { text: payload.text });
    },
    onSuccess: async () => {
      setEditingPromptId(null);
      await queryClient.invalidateQueries({ queryKey: ["prompts", library.id] });
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deletePrompt(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prompts", library.id] });
      await onLibraryUpdated();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (nextPrompts: Prompt[]): Promise<void> => {
      await reorderPrompts(
        library.id,
        nextPrompts.map((prompt) => prompt.id),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prompts", library.id] });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (texts: string[]): Promise<void> => {
      await createPromptsBulk(library.id, texts, prompts.length);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prompts", library.id] });
      await onLibraryUpdated();
    },
  });

  const handleAddPrompt = async (): Promise<void> => {
    const trimmed = newPromptText.trim();
    if (!trimmed) {
      return;
    }
    try {
      await createPromptMutation.mutateAsync(trimmed);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to add prompt"));
    }
  };

  const handleUpdatePrompt = async (
    id: string,
    text: string,
  ): Promise<void> => {
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        alert("Prompt text cannot be empty.");
        return;
      }
      await updatePromptMutation.mutateAsync({ id, text: trimmed });
    } catch (error) {
      alert(getErrorMessage(error, "Failed to update prompt"));
    }
  };

  const handleDeletePrompt = async (id: string): Promise<void> => {
    if (!confirm("Delete this prompt?")) {
      return;
    }
    try {
      await deletePromptMutation.mutateAsync(id);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to delete prompt"));
    }
  };

  const handleMovePrompt = async (
    fromIndex: number,
    toIndex: number,
  ): Promise<void> => {
    if (toIndex < 0 || toIndex >= prompts.length) {
      return;
    }

    const next = [...prompts];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    try {
      await reorderMutation.mutateAsync(next);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to reorder prompts"));
    }
  };

  const handleBulkImport = async (texts: string[]): Promise<void> => {
    try {
      await bulkImportMutation.mutateAsync(texts);
      setShowImport(false);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to import prompts"));
    }
  };

  const handleExportLibrary = (): void => {
    const payload = {
      library: {
        id: library.id,
        name: library.name,
        emoji: library.emoji,
        description: library.description,
      },
      prompts: prompts.map((prompt) => ({
        text: prompt.text,
        variant: prompt.variant ?? null,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${library.id}-prompts.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (promptsQuery.isLoading) {
    return <div className="loading">Loading prompts...</div>;
  }

  return (
    <div className="prompt-list">
      <div className="prompt-header">
        <div>
          <h2>
            {library.emoji} {library.name}
          </h2>
          <p className="prompt-subtitle">{library.description}</p>
        </div>
        <div className="prompt-header-actions">
          <span className="prompt-count">{prompts.length} prompts</span>
          <button
            type="button"
            onClick={handleExportLibrary}
            className="btn btn-secondary btn-sm"
          >
            Export Library
          </button>
          <button
            type="button"
            onClick={() => setShowImport((prev) => !prev)}
            className="btn btn-secondary btn-sm"
          >
            {showImport ? "Hide Import" : "Show Import"}
          </button>
        </div>
      </div>

      <div className="prompt-toolbar">
        <input
          type="text"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search prompts..."
        />
        <div className="add-prompt">
          <input
            type="text"
            value={newPromptText}
            onChange={(event) => setNewPromptText(event.target.value)}
            placeholder="Add new prompt..."
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleAddPrompt();
              }
            }}
          />
          <button onClick={() => void handleAddPrompt()} className="btn btn-primary">
            Add
          </button>
        </div>
      </div>

      {showImport && <BulkImport onImport={handleBulkImport} />}

      <div className="prompts">
        {filteredPrompts.map((prompt) => {
          const promptIndex = prompts.findIndex(
            (item) => item.id === prompt.id,
          );
          return (
          <div key={prompt.id} className="prompt-item">
            <div className="prompt-index">{promptIndex + 1}</div>

            {editingPromptId === prompt.id ? (
              <input
                type="text"
                defaultValue={prompt.text}
                autoFocus
                onBlur={(event) =>
                  void handleUpdatePrompt(prompt.id, event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleUpdatePrompt(
                      prompt.id,
                      (event.target as HTMLInputElement).value,
                    );
                  }
                }}
              />
            ) : (
              <div
                className="prompt-text"
                onClick={() => setEditingPromptId(prompt.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setEditingPromptId(prompt.id);
                  }
                }}
              >
                {prompt.text}
              </div>
            )}

            <div className="prompt-actions">
              <button
                type="button"
                onClick={() =>
                  void handleMovePrompt(promptIndex, promptIndex - 1)
                }
                className="btn btn-secondary btn-sm"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleMovePrompt(promptIndex, promptIndex + 1)
                }
                className="btn btn-secondary btn-sm"
              >
                ↓
              </button>
              <button
                onClick={() => void handleDeletePrompt(prompt.id)}
                className="btn btn-danger btn-sm"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
          );
        })}
        {filteredPrompts.length === 0 && (
          <div className="empty-prompts">No prompts match that search.</div>
        )}
      </div>
    </div>
  );
}

export default PromptList;
