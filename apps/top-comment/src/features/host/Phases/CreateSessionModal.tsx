import React from "react";
import { Button } from "../../../components/Button";
import { FormField } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { usePromptLibraries } from "../../../shared/hooks/usePromptLibraries";
import type { PromptLibraryId } from "../../../shared/promptLibraries";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  submitLabel?: string;
  createForm: { venueName: string; gameMode: "classic" | "mashup"; selectedLibraries: PromptLibraryId[]; totalRounds?: number };
  setCreateForm: React.Dispatch<
    React.SetStateAction<{ venueName: string; gameMode: "classic" | "mashup"; selectedLibraries: PromptLibraryId[]; totalRounds?: number }>
  >;
  createErrors: Record<string, string>;
  isCreating: boolean;
  canCreateSession: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenVenueLogin?: () => void;
}

export function CreateSessionModal({
  open,
  onClose,
  title,
  submitLabel,
  createForm,
  setCreateForm,
  createErrors,
  isCreating,
  canCreateSession,
  onSubmit,
  onOpenVenueLogin,
}: CreateSessionModalProps) {
  const { isDark } = useTheme();
  const { data: libraries, isLoading: librariesLoading } = usePromptLibraries();

  const toggleLibrary = (libraryId: PromptLibraryId) => {
    setCreateForm((prev) => {
      const selected = prev.selectedLibraries;
      if (selected.includes(libraryId)) {
        return { ...prev, selectedLibraries: selected.filter(id => id !== libraryId) };
      } else if (selected.length < 6) {
        return { ...prev, selectedLibraries: [...selected, libraryId] };
      }
      return prev;
    });
  };

  const canSubmit = createForm.gameMode === "classic" || (createForm.gameMode === "mashup" && createForm.selectedLibraries.length >= 2);

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
          <h2 className="text-lg font-bold text-white">
            {title ?? "Create a Söcial session"}
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
        <div className="p-4 sm:p-6">
          <form id="create-session-form" className="space-y-4" onSubmit={onSubmit}>
        {!canCreateSession && (
          <div className={`rounded-lg border p-3 text-sm ${!isDark ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-700 border-cyan-400/50 text-cyan-200'}`}>
            <p className="font-semibold">Venue account required</p>
            <p className="mt-1">
              {isCreating
                ? "Creating session..."
                : "Sign in with your venue credentials before hosting."}
            </p>
            {!isCreating && onOpenVenueLogin && (
              <button
                type="button"
                onClick={onOpenVenueLogin}
                className={`mt-2 inline-flex text-sm font-semibold underline ${!isDark ? 'text-brand-primary' : 'text-cyan-200'}`}
              >
                Open venue login
              </button>
            )}
          </div>
        )}
        <FormField
          label="Venue name (optional)"
          name="venueName"
          placeholder="Bar, team, or event name"
          maxLength={40}
          value={createForm.venueName}
          onChange={(e) =>
            setCreateForm((prev) => ({ ...prev, venueName: e.target.value }))
          }
          hint="Shown to teams in the lobby"
          error={createErrors.venueName}
          isDark={isDark}
        />
        <div className="space-y-2">
          <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCreateForm((prev) => ({ ...prev, gameMode: "classic" }))}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${createForm.gameMode === "classic"
                  ? (!isDark
                      ? "border-brand-primary bg-amber-100 text-brand-primary shadow-sm"
                      : "border-cyan-300 bg-slate-800/70 text-cyan-100 shadow-cyan-500/20")
                  : !isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500"
                }
              `}
            >
              <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                Classic
              </div>
              <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                Traditional gameplay with one prompt library
              </div>
            </button>
            <button
              type="button"
              onClick={() => setCreateForm((prev) => ({ ...prev, gameMode: "mashup" }))}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${createForm.gameMode === "mashup"
                  ? (!isDark
                      ? "border-brand-primary bg-amber-100 text-brand-primary shadow-sm"
                      : "border-cyan-300 bg-slate-800/70 text-cyan-100 shadow-cyan-500/20")
                  : !isDark ? "border-slate-300 bg-white hover:border-slate-400" : "border-slate-600 bg-slate-800 hover:border-slate-500"
                }
              `}
            >
              <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                Mashup
              </div>
              <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                Rotate through selected libraries automatically
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
            Number of Rounds
          </label>
          <div className="flex gap-2">
            {[3, 5, 7, 10, 15].map((rounds) => (
              <button
                key={rounds}
                type="button"
                onClick={() => setCreateForm((prev) => ({ ...prev, totalRounds: rounds }))}
                className={`
                  flex-1 py-2 px-3 rounded-lg border-2 font-semibold transition-all
                  ${(createForm.totalRounds || 5) === rounds
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
            Each team will answer {createForm.totalRounds || 5} prompt{(createForm.totalRounds || 5) !== 1 ? 's' : ''} per round
          </p>
        </div>

        {createForm.gameMode === "mashup" && (
          <div className="space-y-2">
            <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
              Select 2-6 Libraries to Rotate
            </label>
            <p className={`text-xs mb-3 ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              {createForm.selectedLibraries.length}/6 libraries selected. The game will automatically rotate through these each round.
            </p>
            {librariesLoading ? (
              <div className={`text-center py-8 ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                Loading libraries...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {libraries?.map((library) => {
                  const isSelected = createForm.selectedLibraries.includes(library.id);
                  const canSelect = isSelected || createForm.selectedLibraries.length < 6;

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
                      {isSelected && (
                        <div className="text-brand-primary text-xs mt-1">✓</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className={`text-xs ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          You'll get a 6-character room code and QR to share with teams.
          Anonymous sign-in keeps things lightweight.
        </p>
          </form>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-700/50 bg-slate-900 p-4">
          <div className="flex w-full items-center justify-between">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              form="create-session-form"
              type="submit"
              isLoading={isCreating}
              disabled={!canCreateSession || isCreating || !canSubmit}
              title={
                !canCreateSession
                  ? "Please wait for authentication to complete"
                  : undefined
              }
            >
              {submitLabel ?? "Create session"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
