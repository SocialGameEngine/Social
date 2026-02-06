import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { WidgetModal } from './WidgetModal';
import type { ActivityItem } from './widget.types';

const mockActivities: ActivityItem[] = [
  { id: '1', type: 'join', user: 'Alex', message: 'joined the room', timestamp: new Date(Date.now() - 5000) },
  { id: '2', type: 'answer', user: 'Sam', message: 'submitted an answer', timestamp: new Date(Date.now() - 15000) },
  { id: '3', type: 'vote', user: 'Jordan', message: 'voted for an answer', timestamp: new Date(Date.now() - 30000) },
  { id: '4', type: 'phase_change', user: 'Host', message: 'started Vote phase', timestamp: new Date(Date.now() - 45000) },
];

function dotColor(type: ActivityItem['type']): string {
  switch (type) {
    case 'join': return 'bg-green-400';
    case 'answer': return 'bg-blue-400';
    case 'vote': return 'bg-purple-400';
    case 'phase_change': return 'bg-orange-400';
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  return `${Math.floor(seconds / 60)}m ago`;
}

export function ActivityFeedWidget() {
  const [showModal, setShowModal] = useState(false);

  return (
    <BaseWidget
      title="Activity Feed"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      modalContent={
        <WidgetModal title="Activity Feed" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor(activity.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-slate-300">{activity.message}</span>
                  </p>
                  <p className="text-xs text-slate-500">{activity.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </WidgetModal>
      }
    >
      <div className="space-y-2">
        {mockActivities.slice(0, 3).map((activity) => (
          <div key={activity.id} className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(activity.type)}`} />
            <span className="text-slate-300">{activity.user}</span>
            <span className="text-slate-500">{activity.message}</span>
            <span className="text-slate-600 text-xs ml-auto">{formatTimeAgo(activity.timestamp)}</span>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
}
