import { useMemo, useEffect, useRef } from "react";
import { phaseHeadline, phaseSubtitle } from "../../../shared/constants";
import { useTTS } from "../../../shared/hooks";
import { useTTSContext } from "../../../shared/providers/TTSProvider";
import type { Session, RoundGroup, Answer } from "../../../shared/types";
import classicPrompts from "../../../shared/prompts.json";

export function usePresenterTTS(
  session: Session | null,
  roundGroups: RoundGroup[],
  activeGroup: RoundGroup | null,
  activeGroupIndex: number,
  activeGroupAnswers: Answer[]
) {
  const { selectedProfile } = useTTSContext();
  const { play: playAuto } = useTTS({ profile: selectedProfile });
  const lastPlayedHeadingRef = useRef<string | null>(null);
  const lastAnnouncedAnswersKeyRef = useRef<string | null>(null);

  // 1. Build Phase Announcement Text
  const phaseAnnouncementText = useMemo(() => {
    if (!session) return "";
    const headline = phaseHeadline[session.status];
    const subtitle = phaseSubtitle[session.status];
    return `${headline}. ${subtitle}`;
  }, [session]);

  // 2. Build Prompt Announcement Text
  const promptAnnouncementText = useMemo(() => {
    if (!session) return "";
    if (session.status === "answer") {
      const prompts = roundGroups
        .map((group, index) => {
          const prompt = group.prompt?.trim();
          if (!prompt) return null;
          return `Group ${index + 1}: ${prompt}`;
        })
        .filter((prompt): prompt is string => Boolean(prompt));

      return prompts.length ? `Prompts for this round. ${prompts.join(". ")}` : "";
    }

    if (session.status === "vote") {
      const prompt =
        activeGroup?.prompt ??
        roundGroups[activeGroupIndex]?.prompt ??
        roundGroups[0]?.prompt ??
        classicPrompts[session.roundIndex % classicPrompts.length];
      return prompt ? `Current prompt. ${prompt}` : "";
    }

    return "";
  }, [session, roundGroups, activeGroup, activeGroupIndex]);

  // 3. Build Answers Announcement Text
  const answersAnnouncementText = useMemo(() => {
    if (!session || session.status !== "vote" || !activeGroupAnswers.length) return "";

    return `We have ${activeGroupAnswers.length} answers. Here they are. ${activeGroupAnswers
      .map((answer, index) => `Answer ${index + 1}: ${answer.text}`)
      .join(". ")}`;
  }, [session, activeGroupAnswers]);

  // 4. Auto-TTS for heading changes
  const presenterHeading = useMemo(() => {
    // This logic is mirrored from PresenterPage for calculation
    // We'll pass it in or calculate it here
    if (!session) return "";
    // ... Simplified version for extraction or just pass it in
    return ""; 
  }, [session]);

  // Better: Just pass the heading in
  const triggerAutoHeading = (heading: string) => {
    const phrase = heading.split("\n")[0].trim();
    if (phrase && phrase !== lastPlayedHeadingRef.current) {
      lastPlayedHeadingRef.current = phrase;
      void playAuto(phrase);
    }
  };

  // 5. Auto-TTS for voting phase answers
  useEffect(() => {
    if (session?.status === "vote" && activeGroupAnswers.length > 0) {
      const answersKey = activeGroupAnswers.map((a) => a.id).sort().join(",");

      if (lastAnnouncedAnswersKeyRef.current !== answersKey) {
        lastAnnouncedAnswersKeyRef.current = answersKey;

        const timeout = setTimeout(() => {
          void playAuto(answersAnnouncementText);
        }, 3000);

        return () => clearTimeout(timeout);
      }
    } else if (session?.status !== "vote") {
      lastAnnouncedAnswersKeyRef.current = null;
    }
  }, [session?.status, activeGroupAnswers, answersAnnouncementText, playAuto]);

  return {
    phaseAnnouncementText,
    promptAnnouncementText,
    answersAnnouncementText,
    triggerAutoHeading,
    selectedProfile,
  };
}
