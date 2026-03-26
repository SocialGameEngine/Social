import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRoomChat, type ChatMessage } from '../../../../hooks/useRoomChat';
import { ReportButton } from '../../../../shared/components/ReportButton';
import { ReportModal } from '../../../../shared/components/ReportModal';
import { BlockConfirmation } from '../../../../shared/components/BlockConfirmation';
import { reportService, type ReportReason } from '../../../../services/reportService';
import { chatModerationService } from '../../../../services/chatModerationService';

interface ChatPanelProps {
  roomId: string | undefined;
  userId: string | undefined;
  membershipId: string | undefined;
  displayName: string | undefined;
  blockedIds?: Set<string>;
  blockPlayer?: (membershipId: string) => Promise<void>;
  isMod?: boolean;
  isMuted?: boolean;
}

export function ChatPanel({ roomId, userId, membershipId, displayName, blockedIds, blockPlayer, isMod, isMuted }: ChatPanelProps) {
  const { messages, isLoading, isSending, sendMessage } = useRoomChat({
    roomId,
    userId,
    membershipId,
    displayName,
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ membershipId: string; name: string } | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);

  // Filter out blocked players' messages
  const filteredMessages = useMemo(
    () => blockedIds && blockedIds.size > 0
      ? messages.filter((msg) => !blockedIds.has(msg.membershipId))
      : messages,
    [messages, blockedIds]
  );

  const handleReport = useCallback(
    async (reason: ReportReason, description?: string) => {
      if (!roomId || !membershipId || !reportTarget) return;
      await reportService.submitReport({
        roomId,
        reporterMembershipId: membershipId,
        reportedMembershipId: reportTarget.membershipId,
        contentType: 'chat_message',
        contentId: reportTarget.id,
        reason,
        description,
      });
    },
    [roomId, membershipId, reportTarget]
  );

  const handleHideMessage = useCallback(
    async (messageId: string) => {
      if (!membershipId) return;
      try {
        await chatModerationService.hideMessage(messageId, membershipId);
      } catch (err) {
        console.error('Failed to hide message:', err);
      }
    },
    [membershipId]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (isMuted) return;
    const messageToSend = input.trim();
    setInput('');
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore the message if sending failed
      setInput(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full pb-16">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {isLoading ? (
          <p className="text-xs text-slate-500 text-center">Loading messages...</p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-xs text-slate-500 text-center">No messages yet. Say hi!</p>
        ) : (
          filteredMessages.map((msg: ChatMessage) => {
            const isOwn = msg.userId === userId;
            const isHovered = hoveredMsg === msg.id;
            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`text-[11px] font-medium ${isOwn ? 'text-cyan-400' : 'text-purple-400'}`}>
                    {msg.displayName}
                  </span>
                  {isHovered && !isOwn && (
                    <ReportButton onReport={() => setReportTarget(msg)} />
                  )}
                  {isHovered && isMod && !isOwn && (
                    <button
                      onClick={() => handleHideMessage(msg.id)}
                      className="p-0.5 text-slate-500 hover:text-amber-400 transition-colors"
                      title="Hide message"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className={`px-3 py-1.5 rounded-lg max-w-[85%] text-sm ${
                  isOwn ? 'bg-cyan-500/15 text-cyan-100' : 'bg-slate-800 text-slate-200'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-600 mt-0.5">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-700/50 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={isMuted ? 'You are muted' : 'Type a message...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            disabled={!roomId || !membershipId || isMuted}
          />
          <button
            onClick={handleSend}
            className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            disabled={!input.trim() || isSending || !roomId || !membershipId}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
        onBlock={reportTarget && blockPlayer ? () => {
          setBlockTarget({ membershipId: reportTarget.membershipId, name: reportTarget.displayName });
        } : undefined}
        targetName={reportTarget?.displayName}
        contentType="chat_message"
      />
      <BlockConfirmation
        isOpen={!!blockTarget}
        playerName={blockTarget?.name || ''}
        onConfirm={async () => {
          if (blockTarget && blockPlayer) {
            await blockPlayer(blockTarget.membershipId);
          }
          setBlockTarget(null);
        }}
        onCancel={() => setBlockTarget(null)}
      />
    </div>
  );
}
