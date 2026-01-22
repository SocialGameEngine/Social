import type { LibraryWithCounts, PromptLibrary } from "../types/prompts";

interface LibraryListProps {
  libraries: LibraryWithCounts[];
  selectedLibraryId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (library: PromptLibrary) => void;
}

function LibraryList({
  libraries,
  selectedLibraryId,
  onSelect,
  onDelete,
  onEdit,
}: LibraryListProps) {
  return (
    <div className="library-list">
      <h2>Libraries</h2>
      {libraries.length === 0 && (
        <div className="empty-sidebar">No libraries yet.</div>
      )}
      {libraries.map((library) => (
        <div
          key={library.id}
          className={`library-item ${
            selectedLibraryId === library.id ? "selected" : ""
          }`}
        >
          <div
            className="library-info"
            onClick={() => onSelect(library.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                onSelect(library.id);
              }
            }}
          >
            <div className="library-header">
              <span className="library-emoji">{library.emoji}</span>
              <span className="library-name">{library.name}</span>
            </div>
            <div className="library-description">{library.description}</div>
            <div className="library-count">
              {library.promptCount} prompts
            </div>
          </div>
          <div className="library-actions">
            <button
              onClick={() => onEdit(library)}
              className="btn btn-secondary btn-sm"
              type="button"
            >
              Edit
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete(library.id);
              }}
              className="btn btn-danger btn-sm"
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LibraryList;
