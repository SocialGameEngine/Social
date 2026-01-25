import { useMemo, useState } from "react";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { usePromptLibraries } from "../../../shared/hooks/usePromptLibraries";
import type {
  PromptLibrary,
  PromptLibraryId,
} from "../../../shared/promptLibraries";

interface PromptLibrarySelectorProps {
  selectedId: PromptLibraryId;
  onSelect: (id: PromptLibraryId) => void;
  disabled?: boolean;
}

export function PromptLibrarySelector({
  selectedId,
  onSelect,
  disabled = false,
}: PromptLibrarySelectorProps) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<PromptLibraryId | null>(null);
  const { data: promptLibraries, isLoading } = usePromptLibraries();

  const filteredLibraries = useMemo(() => {
    if (!promptLibraries) return [];
    const value = query.trim().toLowerCase();
    if (!value) return promptLibraries;
    return promptLibraries.filter((library) =>
      `${library.emoji} ${library.name} ${library.description}`
        .toLowerCase()
        .includes(value),
    );
  }, [query, promptLibraries]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <p className={`text-sm font-semibold ${!isDark ? 'text-slate-800' : 'text-slate-200'}`}>Prompt library</p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search libraries"
          className={`px-4 py-2 text-sm placeholder:text-slate-400 border rounded-lg focus:outline-none focus:ring-2 ${!isDark ? 'bg-white border-slate-200 focus:border-brand-primary focus:ring-brand-light' : 'bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20'}`}
          disabled={disabled}
        />
      </div>
      
      <div className={`border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto ${!isDark ? 'border-slate-200' : 'border-slate-600'}`}>
        {isLoading && (
          <div className={`p-4 text-sm text-center ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Loading libraries...
          </div>
        )}
        {!isLoading && filteredLibraries.length === 0 && (
          <div className={`p-4 text-sm text-center ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {query ? 'No libraries found. Try a different search.' : 'No libraries available'}
          </div>
        )}
        {!isLoading && filteredLibraries.map((library: PromptLibrary, index: number) => {
          const isExpanded = expandedId === library.id;
          const isSelected = selectedId === library.id;
          const isLast = index === filteredLibraries.length - 1;
          
          return (
            <div 
              key={library.id} 
              className={`${!isLast ? (isDark ? 'border-b border-slate-600' : 'border-b border-slate-200') : ''}`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : library.id)}
                disabled={disabled}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                  disabled 
                    ? 'cursor-not-allowed opacity-50' 
                    : !isDark 
                      ? 'hover:bg-slate-50' 
                      : 'hover:bg-slate-700/50'
                } ${isSelected ? (!isDark ? 'bg-brand-light/20' : 'bg-cyan-900/20') : ''}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl" aria-hidden="true">
                    {library.emoji}
                  </span>
                  <div className="flex-1">
                    <span className={`font-medium ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
                      {library.name}
                    </span>
                    {isSelected && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${!isDark ? 'bg-green-100 text-green-700' : 'bg-green-900/40 text-green-300'}`}>
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-sm ${!isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className={`px-4 pb-4 space-y-3 ${!isDark ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                  <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                    {library.description}
                  </p>
                  
                  {library.prompts.length > 0 && (
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Sample prompts ({library.prompts.length} total):
                      </p>
                      <div className="space-y-1">
                        {library.prompts.slice(0, 3).map((prompt, i) => (
                          <p 
                            key={i} 
                            className={`text-sm ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}
                          >
                            • {prompt}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!isSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!disabled) {
                          onSelect(library.id);
                          setExpandedId(null);
                        }
                      }}
                      disabled={disabled}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        disabled
                          ? 'cursor-not-allowed opacity-50'
                          : !isDark
                            ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                            : 'bg-cyan-600 text-white hover:bg-cyan-500'
                      }`}
                    >
                      Select This Library
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PromptLibrarySelector;
