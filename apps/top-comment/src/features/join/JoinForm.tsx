import { useState, useCallback, type FormEvent } from "react";
import { Button, FormField } from "@social/ui";
import { formatCode } from "../../shared/constants";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { generatePlayerNames } from "../../shared/utils/nameGenerator";

interface JoinFormProps {
  joinForm: { code: string; playerName: string };
  joinErrors: Record<string, string>;
  isJoining: boolean;
  handleJoin: (event: FormEvent<HTMLFormElement>) => void;
  setJoinForm: React.Dispatch<
    React.SetStateAction<{ code: string; playerName: string }>
  >;
}

export function JoinForm({
  joinForm,
  joinErrors,
  isJoining,
  handleJoin,
  setJoinForm,
}: JoinFormProps) {
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState(() => generatePlayerNames(3));

  const handleShuffle = useCallback(() => {
    setSuggestions(generatePlayerNames(3));
  }, []);

  const handlePickName = useCallback((name: string) => {
    setJoinForm((prev) => ({ ...prev, playerName: name }));
  }, [setJoinForm]);
  
  // Disable button if either field is empty or too short
  const isDisabled = 
    !joinForm.code || joinForm.code.trim().length === 0 || 
    !joinForm.playerName || joinForm.playerName.trim().length === 0;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black text-pink-400 text-center">Join Söcial</h1>
      <form className="space-y-4" onSubmit={handleJoin}>
        <FormField
          label="Room code"
          name="code"
          placeholder="A1B2C3"
          value={joinForm.code}
          onChange={(event) =>
            setJoinForm((prev) => ({
              ...prev,
              code: formatCode(event.target.value),
            }))
          }
          inputMode="text"
          autoComplete="off"
          error={joinErrors.code}
          maxLength={6}
          isDark={isDark}
        />
        <FormField
          label="Display name"
          name="playerName"
          placeholder="Your name"
          value={joinForm.playerName}
          onChange={(event) =>
            setJoinForm((prev) => ({ ...prev, playerName: event.target.value }))
          }
          maxLength={15}
          error={joinErrors.playerName}
          isDark={isDark}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Or try:</span>
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handlePickName(name)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                isDark
                  ? 'border-slate-600 bg-slate-700/60 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-500'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-cyan-50 hover:border-cyan-400'
              }`}
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={handleShuffle}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-cyan-300'
                : 'text-slate-500 hover:text-cyan-600'
            }`}
            title="Shuffle names"
          >
            <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <Button type="submit" fullWidth isLoading={isJoining} disabled={isDisabled}>
          Join game
        </Button>
      </form>
    </div>
  );
}
