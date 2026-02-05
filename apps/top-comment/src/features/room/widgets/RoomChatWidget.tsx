import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { WidgetModal } from './WidgetModal';
import type { ChatMessage } from './widget.types';

const mockMessages: ChatMessage[] = [
  { id: '1', user: 'Alex', message: 'Hey everyone! Ready for the next round?', timestamp: new Date(Date.now() - 20000), isOwn: false },
  { id: '2', user: 'You', message: 'Yeah, this is fun!', timestamp: new Date(Date.now() - 15000), isOwn: true },
  { id: '3', user: 'Sam', message: 'The last prompt was hilarious', timestamp: new Date(Date.now() - 10000), isOwn: false },
  { id: '4', user: 'Jordan', message: "Can't wait for the results", timestamp: new Date(Date.now() - 5000), isOwn: false },
];

export function RoomChatWidget() {
  const [showModal, setShowModal] = useState(false);
  const unreadCount = mockMessages.filter(m => !m.isOwn).length;

  return (
    <BaseWidget
      title="Room Chat"
      icon={
        <div className="relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      modalContent={
        <WidgetModal title="Room Chat" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {mockMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}
              >
                <span className={`text-xs font-medium mb-1 ${msg.isOwn ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {msg.user}
                </span>
                <div className={`px-3 py-2 rounded-lg max-w-[80%] ${
                  msg.isOwn ? 'bg-cyan-500/20 text-cyan-100' : 'bg-slate-800 text-slate-200'
                }`}>
                  {msg.message}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              disabled
            />
            <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium" disabled>
              Send
            </button>
          </div>
        </WidgetModal>
      }
    >
      <div className="space-y-2">
        {mockMessages.slice(-2).map((message) => (
          <div key={message.id} className={`text-sm ${message.isOwn ? 'text-right' : ''}`}>
            <span className={`font-medium ${message.isOwn ? 'text-cyan-400' : 'text-purple-400'}`}>
              {message.user}:
            </span>
            <span className="text-slate-300 ml-1">{message.message}</span>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
}
