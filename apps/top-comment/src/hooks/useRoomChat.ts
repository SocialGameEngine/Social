import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import type { RoomMessageRow } from '../domain/types/database.types';
import { censorText } from '../shared/utils/profanityFilter';
import { createRateLimiter } from '../shared/utils/rateLimiter';
import { RATE_LIMITS } from '../shared/constants/rateLimits';

const chatLimiter = createRateLimiter(RATE_LIMITS.chat.maxActions, RATE_LIMITS.chat.windowMs);

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  membershipId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

interface UseRoomChatOptions {
  roomId: string | undefined;
  userId: string | undefined;
  membershipId: string | undefined;
  displayName: string | undefined;
}

export function useRoomChat({ roomId, userId, membershipId, displayName }: UseRoomChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!roomId) return;

    setIsLoading(true);
    (supabase as any)
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('Error fetching chat messages:', error);
        } else if (data) {
          setMessages(
            (data as RoomMessageRow[]).map((msg) => ({
              id: msg.id,
              roomId: msg.room_id,
              userId: msg.user_id,
              membershipId: msg.membership_id,
              displayName: msg.display_name,
              content: msg.content,
              createdAt: msg.created_at,
            }))
          );
        }
        setIsLoading(false);
      });
  }, [roomId]);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room_chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const msg = payload.new as RoomMessageRow;
          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              roomId: msg.room_id,
              userId: msg.user_id,
              membershipId: msg.membership_id,
              displayName: msg.display_name,
              content: msg.content,
              createdAt: msg.created_at,
            },
          ]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId || !userId || !membershipId || !content.trim()) return;

      if (!chatLimiter.canAct()) {
        throw new Error('Slow down! You are sending messages too fast.');
      }

      setIsSending(true);
      const filteredContent = censorText(content.trim());
      const { error } = await (supabase as any).from('room_messages').insert({
        room_id: roomId,
        user_id: userId,
        membership_id: membershipId,
        display_name: displayName || 'Anonymous',
        content: filteredContent,
      });

      if (error) {
        console.error('Error sending message:', error);
      }
      setIsSending(false);
    },
    [roomId, userId, membershipId, displayName]
  );

  return { messages, isLoading, isSending, sendMessage };
}
