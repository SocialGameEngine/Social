import { useState, useRef, useEffect } from 'react';
import { useRoomChat, type ChatMessage } from '../../../../hooks/useRoomChat';

interface ChatPanelProps {
  roomId: string | undefined;
  userId: string | undefined;
  membershipId: string | undefined;
  displayName: string | undefined;
}

export function ChatPanel({ roomId, userId, membershipId, displayName }: ChatPanelProps) {
  const { messages, isLoading, isSending, sendMessage } = useRoomChat({
    roomId,
    userId,
    membershipId,
    displayName,
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
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
        ) : messages.length === 0 ? (
          <p className="text-xs text-slate-500 text-center">No messages yet. Say hi!</p>
        ) : (
          messages.map((msg: ChatMessage) => {
            const isOwn = msg.userId === userId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <span className={`text-[11px] font-medium mb-0.5 ${isOwn ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {msg.displayName}
                </span>
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
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            disabled={!roomId || !membershipId}
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
    </div>
  );
}
