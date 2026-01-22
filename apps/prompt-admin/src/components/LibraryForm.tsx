import { useState, type FormEvent } from "react";

import type { PromptLibrary } from "../types/prompts";

export interface LibraryFormData {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface LibraryFormProps {
  mode: "create" | "edit";
  initialData: PromptLibrary;
  onSubmit: (data: LibraryFormData) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: LibraryFormData = {
  id: "",
  name: "",
  emoji: "",
  description: "",
};

function LibraryForm({ mode, initialData, onSubmit, onCancel }: LibraryFormProps) {
  const [formData, setFormData] = useState<LibraryFormData>({
    ...emptyForm,
    id: initialData.id,
    name: initialData.name,
    emoji: initialData.emoji,
    description: initialData.description,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{mode === "create" ? "Create New Library" : "Edit Library"}</h2>
      <form onSubmit={handleSubmit} className="library-form">
        <div className="form-group">
          <label htmlFor="library-id">Library ID</label>
          <input
            id="library-id"
            type="text"
            value={formData.id}
            onChange={(event) =>
              setFormData({ ...formData, id: event.target.value })
            }
            required
            disabled={mode === "edit"}
            placeholder="classic"
          />
        </div>

        <div className="form-group">
          <label htmlFor="library-name">Name</label>
          <input
            id="library-name"
            type="text"
            value={formData.name}
            onChange={(event) =>
              setFormData({ ...formData, name: event.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="library-emoji">Emoji</label>
          <input
            id="library-emoji"
            type="text"
            value={formData.emoji}
            onChange={(event) =>
              setFormData({ ...formData, emoji: event.target.value })
            }
            maxLength={2}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="library-description">Description</label>
          <textarea
            id="library-description"
            value={formData.description}
            onChange={(event) =>
              setFormData({ ...formData, description: event.target.value })
            }
            rows={3}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting
              ? "Saving..."
              : mode === "create"
                ? "Create Library"
                : "Update Library"}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default LibraryForm;
