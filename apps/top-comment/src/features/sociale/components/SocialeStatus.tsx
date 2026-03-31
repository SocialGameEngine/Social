// =============================================================================
// SOCIALE STATUS COMPONENT
// =============================================================================
// Displays the current status of a Sociale with appropriate styling

import React from 'react';
import type { Sociale } from '../../domain/types/sociale.types';

interface SocialeStatusProps {
  sociale: Sociale;
  showPhase?: boolean;
  className?: string;
}

export function SocialeStatus({ 
  sociale, 
  showPhase = true, 
  className = '' 
}: SocialeStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'lobby': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'lobby': return 'Waiting for Players';
      case 'active': return 'In Progress';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'answer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'vote': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'results': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'answer': return 'Answering';
      case 'vote': return 'Voting';
      case 'results': return 'Results';
      default: return phase || '';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sociale.status)}`}>
        {getStatusText(sociale.status)}
      </div>
      
      {showPhase && sociale.status === 'active' && sociale.currentPhase && (
        <>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPhaseColor(sociale.currentPhase)}`}>
            {getPhaseText(sociale.currentPhase)}
          </div>
        </>
      )}
    </div>
  );
}
