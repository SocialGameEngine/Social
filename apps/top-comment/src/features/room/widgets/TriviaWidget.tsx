import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { WidgetModal } from './WidgetModal';
import type { TriviaQuestion } from './widget.types';

const mockTrivia: TriviaQuestion = {
  id: '1',
  question: 'What is the capital of France?',
  answer: 'Paris',
  category: 'Geography',
  difficulty: 'easy',
  points: 10,
  isAnswered: false,
};

const difficultyStyles: Record<TriviaQuestion['difficulty'], string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
};

export function TriviaWidget() {
  const [showModal, setShowModal] = useState(false);

  return (
    <BaseWidget
      title="Quick Trivia"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      modalContent={
        <WidgetModal title="Quick Trivia" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${difficultyStyles[mockTrivia.difficulty]}`}>
                {mockTrivia.difficulty}
              </span>
              <span className="text-xs text-slate-500">{mockTrivia.category}</span>
              <span className="text-xs text-cyan-400 ml-auto">+{mockTrivia.points} pts</span>
            </div>
            <p className="text-lg text-white">{mockTrivia.question}</p>
            <div className="grid grid-cols-2 gap-2">
              {['Paris', 'London', 'Berlin', 'Madrid'].map((option) => (
                <button
                  key={option}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
                  disabled
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </WidgetModal>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${difficultyStyles[mockTrivia.difficulty]}`}>
            {mockTrivia.difficulty}
          </span>
          <span className="text-xs text-slate-500">{mockTrivia.category}</span>
          <span className="text-xs text-cyan-400 ml-auto">+{mockTrivia.points} pts</span>
        </div>
        <p className="text-sm text-slate-300">{mockTrivia.question}</p>
        {!mockTrivia.isAnswered && (
          <button className="text-xs text-cyan-400 hover:text-cyan-300">
            Tap to answer →
          </button>
        )}
      </div>
    </BaseWidget>
  );
}
