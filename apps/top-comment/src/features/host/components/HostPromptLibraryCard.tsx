import { Card, Button } from "@social/ui";
import type { Session } from "../../../shared/types";
import type { PromptLibraryId } from "../../../shared/promptLibraries";

interface PromptLibrary {
  id: PromptLibraryId;
  name: string;
  emoji: string;
  description: string;
  prompts: string[];
}

interface HostPromptLibraryCardProps {
  session: Session;
  currentPromptLibrary: PromptLibrary | null;
  isUpdatingPromptLibrary: boolean;
  isDark: boolean;
  onChangePrompts: () => void;
  onEditLibraries: () => void;
}

export function HostPromptLibraryCard({
  session,
  currentPromptLibrary,
  isUpdatingPromptLibrary,
  isDark,
  onChangePrompts,
  onEditLibraries,
}: HostPromptLibraryCardProps) {
  if (!session || session.status !== "lobby") {
    return null;
  }

  return (
    <Card className="flex flex-col gap-4" isDark={isDark}>
      <div className="flex items-start justify-between gap-2">
        <div className={`flex flex-col gap-1 ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            Prompt library
          </span>
          {session.settings?.gameMode === "mashup" ? (
            <>
              <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                Mashup Mode
              </p>
              <p className={`text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                Rotating through {session.selectedLibraries?.length ?? 0} libraries
              </p>
            </>
          ) : currentPromptLibrary ? (
            <>
              <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
                {currentPromptLibrary.emoji} {currentPromptLibrary.name}
              </p>
              <p className={`text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                {currentPromptLibrary.description}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
              <p className={`ml-2 text-sm ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                Loading...
              </p>
            </div>
          )}
        </div>
        {session.settings?.gameMode === "classic" && (
          <Button
            variant="secondary"
            onClick={onChangePrompts}
            disabled={isUpdatingPromptLibrary}
          >
            {session.promptLibraryId ? "Change" : "Choose"} prompts
          </Button>
        )}
        {session.settings?.gameMode === "mashup" && (
          <Button
            variant="secondary"
            onClick={onEditLibraries}
          >
            Edit Libraries
          </Button>
        )}
      </div>
      {session.settings?.gameMode === "classic" && currentPromptLibrary && currentPromptLibrary.prompts.length > 0 && (
        <div className="space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            Sample prompts
          </p>
          <div className="space-y-2">
            {currentPromptLibrary.prompts.slice(0, 3).map((prompt, index) => (
              <div
                key={index}
                className={`rounded-lg border px-3 py-2 text-sm ${!isDark ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-600 bg-slate-700 text-cyan-100'}`}
              >
                {prompt}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
