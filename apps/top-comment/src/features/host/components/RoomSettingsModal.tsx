import React from "react";
import { Button } from "../../../components/Button";
import { usePromptLibraries } from "../../../shared/hooks/usePromptLibraries";
import type { PromptLibraryId } from "../../../shared/promptLibraries";

interface RoomSettingsModalProps {
  open: boolean;
  onClose: () => void;
  createForm: { venueName: string; gameMode: "classic" | "mashup"; selectedLibraries: PromptLibraryId[]; totalRounds?: number };
  setCreateForm: React.Dispatch<
    React.SetStateAction<{ venueName: string; gameMode: "classic" | "mashup"; selectedLibraries: PromptLibraryId[]; totalRounds?: number }>
  >;
  createErrors: Record<string, string>;
  isCreating: boolean;
  canCreateSession: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function RoomSettingsModal({
  open,
  onClose,
  createForm,
  setCreateForm,
  createErrors,
  isCreating,
  canCreateSession,
  onSubmit,
}: RoomSettingsModalProps) {
  const { data: libraries } = usePromptLibraries();

  if (!open) return null;

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
          <h2 className="text-lg font-bold text-white">Room Settings</h2>
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
        <div className="space-y-4 p-4 sm:p-5" style={{ backgroundColor: '#0f172a' }}>
          <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
            Venue Name
          </label>
          <input
            type="text"
            name="venueName"
            value={createForm.venueName}
            onChange={(e) => setCreateForm({ ...createForm, venueName: e.target.value })}
            placeholder="Enter your venue name"
            disabled={isCreating}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {createErrors.venueName && (
            <p className="mt-1 text-sm text-red-400">{createErrors.venueName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-cyan-100">
            Game Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer text-cyan-100">
              <input
                type="radio"
                name="gameMode"
                value="classic"
                checked={createForm.gameMode === "classic"}
                onChange={() => setCreateForm({ ...createForm, gameMode: "classic", selectedLibraries: [] })}
                disabled={isCreating}
                className="text-cyan-500 focus:ring-cyan-500"
              />
              <span>Classic Mode</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-cyan-100">
              <input
                type="radio"
                name="gameMode"
                value="mashup"
                checked={createForm.gameMode === "mashup"}
                onChange={() => setCreateForm({ ...createForm, gameMode: "mashup", selectedLibraries: [] })}
                disabled={isCreating}
                className="text-cyan-500 focus:ring-cyan-500"
              />
              <span>Mashup Mode</span>
            </label>
          </div>
          {createErrors.gameMode && (
            <p className="text-red-500 text-sm">{createErrors.gameMode}</p>
          )}
        </div>

        {createForm.gameMode === "mashup" && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
              Prompt Libraries
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {libraries?.map((library: any) => (
                <label key={library.id} className="flex items-center space-x-2 cursor-pointer text-cyan-100">
                  <input
                    type="checkbox"
                    checked={createForm.selectedLibraries.includes(library.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreateForm({
                          ...createForm,
                          selectedLibraries: [...createForm.selectedLibraries, library.id],
                        });
                      } else {
                        setCreateForm({
                          ...createForm,
                          selectedLibraries: createForm.selectedLibraries.filter((id) => id !== library.id),
                        });
                      }
                    }}
                    disabled={isCreating}
                    className="text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>{library.emoji} {library.name}</span>
                </label>
              ))}
            </div>
            {createErrors.selectedLibraries && (
              <p className="text-red-500 text-sm">{createErrors.selectedLibraries}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
            Total Rounds
          </label>
          <input
            type="number"
            name="totalRounds"
            min="1"
            max="20"
            value={createForm.totalRounds?.toString() || "5"}
            onChange={(e) => setCreateForm({ ...createForm, totalRounds: parseInt(e.target.value) || 5 })}
            disabled={isCreating}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {createErrors.totalRounds && (
            <p className="mt-1 text-sm text-red-400">{createErrors.totalRounds}</p>
          )}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-700/50 bg-slate-900 p-4">
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!canCreateSession || isCreating}
              isLoading={isCreating}
            >
              {isCreating ? "Saving..." : "Apply Settings"}
            </Button>
          </div>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
}
