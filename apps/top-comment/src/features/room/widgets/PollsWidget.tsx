import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { WidgetModal } from './WidgetModal';
import type { Poll } from './widget.types';

const mockPoll: Poll = {
  id: '1',
  question: 'What should be the next theme?',
  options: ['Movies', 'Music', 'Sports', 'Food'],
  votes: { 'Movies': 5, 'Music': 8, 'Sports': 3, 'Food': 4 },
  totalVotes: 20,
  isActive: true,
  userVote: 'Music',
};

function PollBar({ option, poll }: { option: string; poll: Poll }) {
  const percentage = (poll.votes[option] / poll.totalVotes) * 100;
  const isUserVote = option === poll.userVote;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={isUserVote ? 'text-cyan-300 font-medium' : 'text-slate-300'}>
          {option} {isUserVote && '(you)'}
        </span>
        <span className="text-xs text-slate-400">{percentage.toFixed(0)}%</span>
      </div>
      <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${isUserVote ? 'bg-cyan-400' : 'bg-slate-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function PollsWidget() {
  const [showModal, setShowModal] = useState(false);

  return (
    <BaseWidget
      title="Quick Poll"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V13a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
        </svg>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      modalContent={
        <WidgetModal title="Quick Poll" onClose={() => setShowModal(false)}>
          <p className="text-lg font-medium text-white mb-4">{mockPoll.question}</p>
          <div className="space-y-3">
            {mockPoll.options.map((option) => (
              <PollBar key={option} option={option} poll={mockPoll} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">{mockPoll.totalVotes} total votes</p>
        </WidgetModal>
      }
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-200">{mockPoll.question}</p>
        <div className="space-y-1">
          {mockPoll.options.slice(0, 2).map((option) => {
            const percentage = (mockPoll.votes[option] / mockPoll.totalVotes) * 100;
            return (
              <div key={option} className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${option === mockPoll.userVote ? 'bg-cyan-400' : 'bg-slate-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">{mockPoll.totalVotes} votes</p>
      </div>
    </BaseWidget>
  );
}
