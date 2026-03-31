// =============================================================================
// SOCIALE CARD COMPONENT
// =============================================================================
// Displays a Sociale game card with status, participants, and actions

import React from 'react';
import type { Sociale } from '../../domain/types/sociale.types';

interface SocialeCardProps {
  sociale: Sociale;
  participantCount?: number;
  onJoin?: () => void;
  onStart?: () => void;
  onView?: () => void;
  className?: string;
}

export function SocialeCard({
  sociale,
  participantCount = 0,
  onJoin,
  onStart,
  onView,
  className = '',
}: SocialeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'lobby': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'lobby': return 'Lobby';
      case 'active': return 'In Progress';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <div className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {sociale.title || 'Untitled Sociale'}
          </h3>
          {sociale.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {sociale.description}
            </p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sociale.status)}`}>
          {getStatusText(sociale.status)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {participantCount} participants
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {sociale.mode}
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        {sociale.status === 'lobby' && onJoin && (
          <button
            onClick={onJoin}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Join
          </button>
        )}
        {sociale.status === 'lobby' && onStart && (
          <button
            onClick={onStart}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Start
          </button>
        )}
        {onView && (
          <button
            onClick={onView}
            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}
