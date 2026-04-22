import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import LibraryForm, { type LibraryFormData } from "./components/LibraryForm";
import LibraryList from "./components/LibraryList";
import PromptList from "./components/PromptList";
import AmbientRoundList from "./components/AmbientRoundList";
import AIPromptGenerator from "./components/AIPromptGenerator";
import TriviaLibraryForm from "./components/TriviaLibraryForm";
import TriviaLibraryList from "./components/TriviaLibraryList";
import TriviaQuestionList from "./components/TriviaQuestionList";
import { Toast, showToast } from "./components/Toast";
import { queryKeys } from "./lib/queryKeys";
import {
  createLibrary,
  deleteLibrary,
  getLibraries,
  getPrompts,
  getPromptCount,
  replaceLibraryPrompts,
  upsertLibrary,
} from "./services/database";
import {
  createTriviaPack,
  deleteTriviaPack,
  getTriviaPacks,
  getTriviaPackWithCounts,
  updateTriviaPack,
} from "./services/triviaDatabase";
import type { LibraryWithCounts, PromptLibrary } from "./types/prompts";
import type { TriviaQuestionPackWithCounts, TriviaQuestionPack } from "./types/trivia";
import { getErrorMessage } from "./utils/get-error-message";

type FormMode = "create" | "edit" | "trivia" | null;
type AppTab = 'libraries' | 'trivia' | 'ambient';

const emptyLibrary: PromptLibrary = {
  id: "",
  name: "",
  emoji: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

function App() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AppTab>('libraries');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    null,
  );
  const [selectedTriviaLibraryId, setSelectedTriviaLibraryId] = useState<string | null>(
    null,
  );
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingLibrary, setEditingLibrary] =
    useState<PromptLibrary>(emptyLibrary);
  const [editingTriviaLibrary, setEditingTriviaLibrary] =
    useState<TriviaQuestionPack | null>(null);
  const [importing, setImporting] = useState(false);

  const librariesQuery = useQuery({
    queryKey: queryKeys.libraries(),
    queryFn: async (): Promise<LibraryWithCounts[]> => {
      const libraries = await getLibraries();
      const withCounts = await Promise.all(
        libraries.map(async (library) => ({
          ...library,
          promptCount: await getPromptCount(library.id),
        })),
      );

      return withCounts;
    },
  });

  const libraries = librariesQuery.data ?? [];

  const selectedLibrary = useMemo(
    () => libraries.find((library) => library.id === selectedLibraryId) ?? null,
    [libraries, selectedLibraryId],
  );

  const triviaLibrariesQuery = useQuery({
    queryKey: queryKeys.triviaLibraries(),
    queryFn: async (): Promise<TriviaQuestionPackWithCounts[]> => {
      const packs = await getTriviaPacks();
      return Promise.all(packs.map(pack => getTriviaPackWithCounts(pack.id).then(p => p!)));
    },
  });

  const triviaLibraries = triviaLibrariesQuery.data ?? [];
  const selectedTriviaLibrary = useMemo(
    () => triviaLibraries.find((library) => library.id === selectedTriviaLibraryId) ?? null,
    [triviaLibraries, selectedTriviaLibraryId],
  );

  const createLibraryMutation = useMutation({
    mutationFn: async (data: LibraryFormData): Promise<void> => {
      const sortOrder = libraries.length;
      await createLibrary({
        id: data.id.trim(),
        name: data.name.trim(),
        emoji: data.emoji.trim(),
        description: data.description.trim(),
        sort_order: sortOrder,
        is_active: true,
      });
    },
    onSuccess: async () => {
      setFormMode(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.libraries() });
    },
  });

  const updateLibraryMutation = useMutation({
    mutationFn: async (data: LibraryFormData): Promise<void> => {
      await upsertLibrary({
        id: data.id.trim(),
        name: data.name.trim(),
        emoji: data.emoji.trim(),
        description: data.description.trim(),
        sort_order: editingLibrary.sort_order,
        is_active: editingLibrary.is_active,
      });
    },
    onSuccess: async () => {
      setFormMode(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.libraries() });
    },
  });

  const deleteLibraryMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deleteLibrary(id);
    },
    onSuccess: async () => {
      setSelectedLibraryId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.libraries() });
    },
  });

  const handleCreateLibrary = async (data: LibraryFormData): Promise<void> => {
    try {
      await createLibraryMutation.mutateAsync(data);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to create library"), 'error');
    }
  };

  const handleUpdateLibrary = async (data: LibraryFormData): Promise<void> => {
    try {
      await updateLibraryMutation.mutateAsync(data);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to update library"), 'error');
    }
  };

  const handleDeleteLibrary = async (id: string): Promise<void> => {
    if (
      !confirm(
        "Delete this library and all of its prompts? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteLibraryMutation.mutateAsync(id);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to delete library"), 'error');
    }
  };

  const handleDeleteTriviaLibrary = async (id: string): Promise<void> => {
    if (
      !confirm(
        "Delete this trivia library and all of its questions? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteTriviaPack(id);
      setSelectedTriviaLibraryId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.triviaLibraries() });
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to delete trivia library"), 'error');
    }
  };

  const handleStartCreate = (): void => {
    setEditingLibrary(emptyLibrary);
    setFormMode("create");
  };

  const handleStartEdit = (library: PromptLibrary): void => {
    setEditingLibrary(library);
    setFormMode("edit");
  };

  
  const handleCancelForm = (): void => {
    setFormMode(null);
    setEditingLibrary(emptyLibrary);
    setEditingTriviaLibrary(null);
  };

  const handleCreateTriviaLibrary = async (data: { name: string; description: string }): Promise<void> => {
    try {
      await createTriviaPack({
        name: data.name.trim(),
        description: data.description.trim(),
        status: 'draft',
      });
      setFormMode(null);
      setEditingTriviaLibrary(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.triviaLibraries() });
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to create trivia library'), 'error');
    }
  };

  const handleUpdateTriviaLibrary = async (data: { name: string; description: string }): Promise<void> => {
    try {
      if (!editingTriviaLibrary) return;
      await updateTriviaPack(editingTriviaLibrary.id, {
        name: data.name.trim(),
        description: data.description.trim(),
      });
      setFormMode(null);
      setEditingTriviaLibrary(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.triviaLibraries() });
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update trivia library'), 'error');
    }
  };

  const handleExportLibraries = async (): Promise<void> => {
    try {
      const librariesData = await getLibraries();
      const exportPayload = await Promise.all(
        librariesData.map(async (library) => {
          const prompts = await getPrompts(library.id);
          return {
            id: library.id,
            name: library.name,
            emoji: library.emoji,
            description: library.description,
            sort_order: library.sort_order,
            is_active: library.is_active,
            prompts: prompts.map((prompt) => ({
              text: prompt.text,
              variant: prompt.variant ?? null,
            })),
          };
        }),
      );

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "prompt-libraries.json";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to export libraries"), 'error');
    }
  };

  const handleImportLibraries = async (file: File): Promise<void> => {
    if (importing) {
      return;
    }

    if (
      !confirm(
        "Import will overwrite prompts for any matching library IDs. Continue?",
      )
    ) {
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (!Array.isArray(parsed)) {
        throw new Error("Expected a JSON array of libraries.");
      }

      for (const [index, entry] of parsed.entries()) {
        if (
          typeof entry !== "object" ||
          entry === null ||
          !("id" in entry) ||
          !("name" in entry) ||
          !("emoji" in entry) ||
          !("description" in entry)
        ) {
          throw new Error("Library entry is missing required fields.");
        }

        const library = entry as {
          id: string;
          name: string;
          emoji: string;
          description: string;
          sort_order?: number;
          is_active?: boolean;
          prompts?: { text: string; variant?: string | null }[];
        };

        await upsertLibrary({
          id: library.id,
          name: library.name,
          emoji: library.emoji,
          description: library.description,
          sort_order: library.sort_order ?? index,
          is_active: library.is_active ?? true,
        });

        if (library.prompts) {
          await replaceLibraryPrompts(
            library.id,
            library.prompts.map((prompt) => prompt.text),
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.libraries() });
      showToast("Libraries imported successfully.", 'success');
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to import libraries"), 'error');
    } finally {
      setImporting(false);
    }
  };

  if (librariesQuery.isLoading) {
    return <div className="loading">Loading libraries...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Prompt Admin</h1>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeTab === 'libraries' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('libraries')}
          >
            Prompt Libraries
          </button>
          <button
            className={`btn ${activeTab === 'trivia' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('trivia')}
          >
            Trivia Libraries
          </button>
          <button
            className={`btn ${activeTab === 'ambient' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('ambient')}
          >
            Ambient Rounds
          </button>
        </nav>
        {/* Only show library actions on the libraries tab */}
        {activeTab === 'libraries' && (
          <div className="header-actions">
            <button onClick={handleStartCreate} className="btn btn-primary">
              + New Library
            </button>
            <button onClick={handleExportLibraries} className="btn btn-secondary">
              Export Libraries
            </button>
            <label className="btn btn-secondary">
              {importing ? "Importing..." : "Import Libraries"}
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleImportLibraries(file);
                  }
                  event.currentTarget.value = "";
                }}
                disabled={importing}
                hidden
              />
            </label>
          </div>
        )}
      </header>

      <div className="app-content">
        {activeTab === 'ambient' ? (
          <div className="main-content" style={{ padding: 24 }}>
            <AmbientRoundList />
          </div>
        ) : activeTab === 'trivia' ? (
          <>
            <div className="sidebar">
              <TriviaLibraryList
                libraries={triviaLibraries}
                selectedLibraryId={selectedTriviaLibraryId}
                onSelect={setSelectedTriviaLibraryId}
                onCreate={handleCreateTriviaLibrary}
                onUpdate={handleUpdateTriviaLibrary}
                onDelete={handleDeleteTriviaLibrary}
              />
            </div>

            <div className="main-content">
              {formMode === 'trivia' && (
                <TriviaLibraryForm
                  mode={editingTriviaLibrary?.id ? 'edit' : 'create'}
                  initialData={editingTriviaLibrary ? {
                    id: editingTriviaLibrary.id,
                    name: editingTriviaLibrary.name,
                    description: editingTriviaLibrary.description ?? ''
                  } : undefined}
                  onSubmit={
                    editingTriviaLibrary?.id ? handleUpdateTriviaLibrary : handleCreateTriviaLibrary
                  }
                  onCancel={handleCancelForm}
                />
              )}

              {!formMode && selectedTriviaLibrary && (
                <TriviaQuestionList
                  library={selectedTriviaLibrary}
                  onLibraryUpdated={async () => {
                    await queryClient.invalidateQueries({ queryKey: queryKeys.triviaLibraries() });
                  }}
                />
              )}

              {!formMode && !selectedTriviaLibrary && (
                <div className="main-content" style={{ padding: 24 }}>
                  <div className="empty-state" style={{ marginBottom: 24 }}>
                    <h2>Select a trivia library to manage</h2>
                    <p>Choose a library from the sidebar to view and edit trivia questions.</p>
                  </div>
                  
                  <div style={{ marginBottom: 24 }}>
                    <h3>Or generate trivia questions for a new library:</h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                      Use the AI generator below to create trivia questions, then create a new library and import them.
                    </p>
                    <AIPromptGenerator type="trivia" />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="sidebar">
              <LibraryList
                libraries={libraries}
                selectedLibraryId={selectedLibraryId}
                onSelect={setSelectedLibraryId}
                onDelete={handleDeleteLibrary}
                onEdit={handleStartEdit}
              />
            </div>

            <div className="main-content">
              {formMode === "create" || formMode === "edit" ? (
                <LibraryForm
                  mode={formMode}
                  initialData={editingLibrary}
                  onSubmit={
                    formMode === "create" ? handleCreateLibrary : handleUpdateLibrary
                  }
                  onCancel={handleCancelForm}
                />
              ) : null}

              {!formMode && selectedLibrary && (
                <PromptList
                  library={selectedLibrary}
                  onLibraryUpdated={async () => {
                    await queryClient.invalidateQueries({ queryKey: queryKeys.libraries() });
                  }}
                />
              )}

              {!formMode && !selectedLibrary && (
                <div className="main-content" style={{ padding: 24 }}>
                  <div className="empty-state" style={{ marginBottom: 24 }}>
                    <h2>Select a library to manage</h2>
                    <p>Choose a library from the sidebar to view and edit prompts.</p>
                  </div>
                  
                  <div style={{ marginBottom: 24 }}>
                    <h3>Or generate prompts for a new library:</h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                      Use the AI generator below to create prompts, then create a new library and import them.
                    </p>
                    <AIPromptGenerator type="prompts" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Toast />
    </div>
  );
}

export default App;
