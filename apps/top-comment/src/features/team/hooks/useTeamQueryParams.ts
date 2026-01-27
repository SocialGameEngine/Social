import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { formatCode } from "../../../shared/constants";

interface UseTeamQueryParamsProps {
  setJoinForm: (form: { code: string; teamName: string } | ((prev: { code: string; teamName: string }) => { code: string; teamName: string })) => void;
  setAutoJoinAttempted: (attempted: boolean) => void;
  hasManuallyLeft: boolean;
}

export function useTeamQueryParams({
  setJoinForm,
  setAutoJoinAttempted,
  hasManuallyLeft,
}: UseTeamQueryParamsProps) {
  const [searchParams] = useSearchParams();

  const queryCodeParam = searchParams.get("code");
  const queryTeamNameParam = searchParams.get("teamName");
  const allowAutoJoin =
    (searchParams.get("auto") ?? "true").toLowerCase() !== "false";

  const formattedQueryCode = useMemo(
    () => (queryCodeParam ? formatCode(queryCodeParam) : ""),
    [queryCodeParam],
  );

  const queryTeamName = useMemo(
    () => (queryTeamNameParam ?? "").trim(),
    [queryTeamNameParam],
  );

  // Initialize join form from query parameters
  useEffect(() => {
    if (!formattedQueryCode) return;
    setJoinForm((prev) =>
      prev.code === formattedQueryCode
        ? prev
        : { ...prev, code: formattedQueryCode },
    );
  }, [formattedQueryCode, setJoinForm]);

  useEffect(() => {
    if (!queryTeamName) return;
    setJoinForm((prev) =>
      prev.teamName === queryTeamName
        ? prev
        : { ...prev, teamName: queryTeamName },
    );
  }, [queryTeamName, setJoinForm]);

  // Reset autoJoinAttempted when query code changes
  useEffect(() => {
    if (!hasManuallyLeft) {
      setAutoJoinAttempted(false);
    }
  }, [formattedQueryCode, hasManuallyLeft, setAutoJoinAttempted]);

  return {
    formattedQueryCode,
    queryTeamName,
    allowAutoJoin,
  };
}
