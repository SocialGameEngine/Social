import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../shared/providers/AuthContext';
import { useRoom } from '../../../hooks/useRoom';
import { roomService } from '../../../services/roomService';
import { supabase } from '../../../supabase/client';
import type { CreateRoomRequest, Room } from '../../../shared/types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (room: Room) => void;
  existingRoom?: Room | null;
  updateVenueRoomId?: boolean; // New prop for venue room creation
}

export function CreateRoomModal({ isOpen, onClose, onSuccess, existingRoom, updateVenueRoomId }: CreateRoomModalProps) {
  const { user } = useAuth();
  const { createRoom } = useRoom();
  const isEditing = !!existingRoom;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Populate form with existing room data when editing
  useEffect(() => {
    if (existingRoom) {
      const existingSettings = existingRoom.settings as unknown as Record<string, unknown>;
      const defaultSessionSettings = existingSettings?.defaultSessionSettings as Record<string, unknown> | undefined;
      setFormData({
        name: existingRoom.name || '',
        description: existingRoom.description || '',
        maxPlayers: existingRoom.maxPlayers || 50,
        settings: {
          allowPlayerChat: typeof existingSettings?.allowPlayerChat === 'boolean' ? existingSettings.allowPlayerChat : true,
          autoStartSession: typeof existingSettings?.autoStartSession === 'boolean' ? existingSettings.autoStartSession : false,
          requireApproval: typeof existingSettings?.requireApproval === 'boolean' ? existingSettings.requireApproval : false,
          allowAnonymous: typeof existingSettings?.allowAnonymous === 'boolean' ? existingSettings.allowAnonymous : true,
          defaultSessionSettings: {
            answerSecs: typeof defaultSessionSettings?.answerSecs === 'number' ? defaultSessionSettings.answerSecs : 90,
            voteSecs: typeof defaultSessionSettings?.voteSecs === 'number' ? defaultSessionSettings.voteSecs : 30,
            resultsSecs: typeof defaultSessionSettings?.resultsSecs === 'number' ? defaultSessionSettings.resultsSecs : 12,
            gameMode: (defaultSessionSettings?.gameMode as 'classic') ?? 'classic',
          },
        },
      });
    }
  }, [existingRoom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEditing && existingRoom) {
        // Update existing room using roomService directly
        const response = await roomService.updateRoom({
          roomId: existingRoom.id,
          name: formData.name.trim() || undefined,
          description: formData.description.trim() || undefined,
          settings: {
            ...formData.settings,
            maxPlayers: formData.maxPlayers,
          },
        });
        onSuccess?.(response.room);
        onClose();
      } else {
        // Create new room
        const roomRequest: CreateRoomRequest = {
          name: formData.name.trim() || undefined,
          description: formData.description.trim() || undefined,
          maxPlayers: formData.maxPlayers,
          settings: formData.settings,
        };

        const room = await createRoom(roomRequest);
        
        // If this is a venue room creation, update the venue account with room_id
        if (updateVenueRoomId && user) {
          try {
            const { error: updateError } = await (supabase as any).rpc('update_venue_room_id', {
              p_user_id: user.id,
              p_room_id: room.id
            });
            
            if (updateError) {
              console.error('Failed to update venue room_id:', updateError);
              // Don't fail the whole operation, just log the error
            }
          } catch (error) {
            console.error('Exception updating venue room_id:', error);
            // Don't fail the whole operation, just log the error
          }
        }
        
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
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save room settings';
      setError(errorMessage);
      console.error('Error saving room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field: string, value: boolean | number | string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleSessionSettingsChange = (field: string, value: number | string) => {
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

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-slate-900 w-full h-full md:h-auto md:max-h-[90vh] md:rounded-lg md:max-w-2xl overflow-y-auto flex flex-col">
        {/* Header - sticky on mobile */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 md:p-6 md:border-0 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-white">{isEditing ? 'Room Settings' : 'Create New Room'}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2"
              disabled={isLoading}
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form content - scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6">
          {/* Basic Room Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
                Room Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="My Awesome Room"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                rows={3}
                placeholder="A fun place to play trivia!"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
                Max Players
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Room Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Room Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowPlayerChat}
                  onChange={(e) => handleSettingsChange('allowPlayerChat', e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-cyan-100">Allow player chat</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.requireApproval}
                  onChange={(e) => handleSettingsChange('requireApproval', e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-cyan-100">Require host approval to join</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowAnonymous}
                  onChange={(e) => handleSettingsChange('allowAnonymous', e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-cyan-100">Allow anonymous players</span>
              </label>
            </div>
          </div>

          {/* Default Session Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Default Session Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
                  Answer Time (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={formData.settings.defaultSessionSettings.answerSecs}
                  onChange={(e) => handleSessionSettingsChange('answerSecs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
                  Vote Time (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.settings.defaultSessionSettings.voteSecs}
                  onChange={(e) => handleSessionSettingsChange('voteSecs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
                  Results Time (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.settings.defaultSessionSettings.resultsSecs}
                  onChange={(e) => handleSessionSettingsChange('resultsSecs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-400/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

          {/* Actions - sticky on mobile with extra padding for bottom nav */}
          <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 pb-20 md:p-6 flex justify-end space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50"
              disabled={isLoading || !user}
            >
              {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Settings' : 'Create Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
