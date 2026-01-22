import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import LibraryForm, { type LibraryFormData } from "./components/LibraryForm";
import LibraryList from "./components/LibraryList";
import PromptList from "./components/PromptList";
import {
  createLibrary,
  deleteLibrary,
  getLibraries,
  getPrompts,
  getPromptCount,
  replaceLibraryPrompts,
  upsertLibrary,
} from "./services/database";
import type { LibraryWithCounts, PromptLibrary } from "./types/prompts";
import { getErrorMessage } from "./utils/get-error-message";

type FormMode = "create" | "edit" | null;

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
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    null,
  );
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingLibrary, setEditingLibrary] =
    useState<PromptLibrary>(emptyLibrary);
  const [importing, setImporting] = useState(false);

  const librariesQuery = useQuery({
    queryKey: ["libraries"],
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
      await queryClient.invalidateQueries({ queryKey: ["libraries"] });
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
      await queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });

  const deleteLibraryMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deleteLibrary(id);
    },
    onSuccess: async () => {
      setSelectedLibraryId(null);
      await queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });

  const handleCreateLibrary = async (data: LibraryFormData): Promise<void> => {
    try {
      await createLibraryMutation.mutateAsync(data);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to create library"));
    }
  };

  const handleUpdateLibrary = async (data: LibraryFormData): Promise<void> => {
    try {
      await updateLibraryMutation.mutateAsync(data);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to update library"));
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
      alert(getErrorMessage(error, "Failed to delete library"));
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
      alert(getErrorMessage(error, "Failed to export libraries"));
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

      await queryClient.invalidateQueries({ queryKey: ["libraries"] });
      alert("Libraries imported successfully.");
    } catch (error) {
      alert(getErrorMessage(error, "Failed to import libraries"));
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
        <h1>Prompt Library Admin</h1>
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
      </header>

      <div className="app-content">
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
          {formMode && (
            <LibraryForm
              mode={formMode}
              initialData={editingLibrary}
              onSubmit={
                formMode === "create" ? handleCreateLibrary : handleUpdateLibrary
              }
              onCancel={handleCancelForm}
            />
          )}

          {!formMode && selectedLibrary && (
            <PromptList
              library={selectedLibrary}
              onLibraryUpdated={async () => {
                await queryClient.invalidateQueries({ queryKey: ["libraries"] });
              }}
            />
          )}

          {!formMode && !selectedLibrary && (
            <div className="empty-state">
              <h2>Select a library to manage</h2>
              <p>Choose a library from the sidebar to view and edit prompts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
