import type { FormEvent } from "react";
import { Button, FormField } from "@social/ui";
import { formatCode } from "../../../shared/constants";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface JoinFormProps {
  joinForm: { code: string; teamName: string };
  joinErrors: Record<string, string>;
  isJoining: boolean;
  handleJoin: (event: FormEvent<HTMLFormElement>) => void;
  setJoinForm: React.Dispatch<
    React.SetStateAction<{ code: string; teamName: string }>
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
  
  // Disable button if either field is empty or too short
  const isDisabled = 
    !joinForm.code || joinForm.code.trim().length === 0 || 
    !joinForm.teamName || joinForm.teamName.trim().length === 0;

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
          label="Team name"
          name="teamName"
          placeholder="Your team name"
          value={joinForm.teamName}
          onChange={(event) =>
            setJoinForm((prev) => ({ ...prev, teamName: event.target.value }))
          }
          maxLength={15}
          error={joinErrors.teamName}
          isDark={isDark}
        />
        <Button type="submit" fullWidth isLoading={isJoining} disabled={isDisabled}>
          Join game
        </Button>
      </form>
    </div>
  );
}

