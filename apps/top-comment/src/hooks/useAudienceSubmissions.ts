import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import {
  audienceSubmissionService,
  type AudienceSubmission,
} from '../services/audienceSubmissionService';

interface UseAudienceSubmissionsOptions {
  roomId: string | undefined;
  membershipId: string | undefined;
  isHost: boolean;
}

export function useAudienceSubmissions({ roomId, membershipId, isHost }: UseAudienceSubmissionsOptions) {
  const [submissions, setSubmissions] = useState<AudienceSubmission[]>([]);
  const [mySubmissions, setMySubmissions] = useState<AudienceSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');

  // Load submissions
  useEffect(() => {
    if (!roomId) {
      setSubmissions([]);
      setMySubmissions([]);
      return;
    }

    setIsLoading(true);
    const promises: Promise<any>[] = [];

    if (isHost) {
      promises.push(
        audienceSubmissionService.getSubmissions(roomId).then(setSubmissions)
      );
    }

    if (membershipId) {
      promises.push(
        audienceSubmissionService.getMySubmissions(roomId, membershipId).then(setMySubmissions)
      );
    }

    Promise.all(promises)
      .catch((err) => console.error('Failed to load submissions:', err))
      .finally(() => setIsLoading(false));
  }, [roomId, membershipId, isHost]);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`audience_submissions:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audience_submissions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, any>;
          if (!raw) return;

          const submission: AudienceSubmission = {
            id: raw.id,
            roomId: raw.room_id,
            membershipId: raw.membership_id,
            questionText: raw.question_text,
            category: raw.category ?? null,
            status: raw.status,
            reviewedBy: raw.reviewed_by ?? null,
            reviewedAt: raw.reviewed_at ?? null,
            rejectionReason: raw.rejection_reason ?? null,
            usedInInteractionId: raw.used_in_interaction_id ?? null,
            createdAt: raw.created_at,
          };

          if (isHost) {
            setSubmissions((prev) => {
              const exists = prev.findIndex((s) => s.id === submission.id);
              if (exists >= 0) {
                const next = [...prev];
                next[exists] = submission;
                return next;
              }
              return [submission, ...prev];
            });
          }

          if (raw.membership_id === membershipId) {
            setMySubmissions((prev) => {
              const exists = prev.findIndex((s) => s.id === submission.id);
              if (exists >= 0) {
                const next = [...prev];
                next[exists] = submission;
                return next;
              }
              return [submission, ...prev];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, membershipId, isHost]);

  const submitQuestion = useCallback(
    async (questionText: string, category?: string) => {
      if (!roomId || !membershipId) return;
      const sub = await audienceSubmissionService.submitQuestion(roomId, membershipId, questionText, category);
      setMySubmissions((prev) => [sub, ...prev]);
      return sub;
    },
    [roomId, membershipId]
  );

  const approveSubmission = useCallback(
    async (submissionId: string) => {
      if (!membershipId) return;
      const updated = await audienceSubmissionService.approveSubmission(submissionId, membershipId);
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
      return updated;
    },
    [membershipId]
  );

  const rejectSubmission = useCallback(
    async (submissionId: string, reason?: string) => {
      if (!membershipId) return;
      const updated = await audienceSubmissionService.rejectSubmission(submissionId, membershipId, reason);
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
      return updated;
    },
    [membershipId]
  );

  return {
    submissions,
    mySubmissions,
    approvedSubmissions,
    pendingCount,
    isLoading,
    submitQuestion,
    approveSubmission,
    rejectSubmission,
  };
}
