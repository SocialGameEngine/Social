import React, { useState } from 'react';
import { useAuth } from '../../../shared/providers/AuthContext';
import { useRoom } from '../../../hooks/useRoom';
import type { CreateRoomRequest, Room } from '../../../shared/types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (room: Room) => void;
}

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const { user } = useAuth();
  const { createRoom, isLoading, error } = useRoom();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxPlayers: 50,
    settings: {
      allowPlayerChat: true,
      autoStartSession: false,
      requireApproval: false,
      allowAnonymous: true,
      defaultSessionSettings: {
        answerSecs: 90,
        voteSecs: 30,
        resultsSecs: 12,
        gameMode: 'classic' as const,
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      return;
    }

    try {
      const roomRequest: CreateRoomRequest = {
        name: formData.name.trim() || undefined,
        description: formData.description.trim() || undefined,
        maxPlayers: formData.maxPlayers,
        settings: formData.settings,
      };

      const room = await createRoom(roomRequest);
      onSuccess?.(room);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        maxPlayers: 50,
        settings: {
          allowPlayerChat: true,
          autoStartSession: false,
          requireApproval: false,
          allowAnonymous: true,
          defaultSessionSettings: {
            answerSecs: 90,
            voteSecs: 30,
            resultsSecs: 12,
            gameMode: 'classic' as const,
          },
        },
      });
    } catch (err) {
      // Error is handled by the useRoom hook
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleSessionSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        defaultSessionSettings: {
          ...prev.settings.defaultSessionSettings,
          [field]: value,
        },
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Room Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Awesome Room"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="A fun place to play trivia!"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Players
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Room Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Room Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowPlayerChat}
                  onChange={(e) => handleSettingsChange('allowPlayerChat', e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Allow player chat</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.requireApproval}
                  onChange={(e) => handleSettingsChange('requireApproval', e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Require host approval to join</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowAnonymous}
                  onChange={(e) => handleSettingsChange('allowAnonymous', e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Allow anonymous players</span>
              </label>
            </div>
          </div>

          {/* Default Session Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Default Session Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Time (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={formData.settings.defaultSessionSettings.answerSecs}
                  onChange={(e) => handleSessionSettingsChange('answerSecs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vote Time (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.settings.defaultSessionSettings.voteSecs}
                  onChange={(e) => handleSessionSettingsChange('voteSecs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Results Time (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.settings.defaultSessionSettings.resultsSecs}
                  onChange={(e) => handleSessionSettingsChange('resultsSecs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading || !user}
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
