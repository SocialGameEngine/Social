import type { FormEvent } from "react";
import { Card, Button, FormField } from "@social/ui";
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
    <Card className="space-y-5" isDark={isDark}>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-black text-pink-400">Join Söcial</h1>
        <p className="text-sm text-cyan-300">
          Enter the room code from the host screen and choose your display name.
        </p>
      </div>
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
          name="teamName"
          placeholder="Your name"
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
    </Card>
  );
}

