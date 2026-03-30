// =============================================================================
// SOCIALES PANEL
// =============================================================================
// Panel for managing Sociales (replaces SessionsPanel for Sociales)

import React, { useState } from 'react';
import { Button, Card } from '@social/ui';
import { useSocialesByRoom, useCreateSociale } from "../../../features/sociale";
import { useSocialeOrchestrator } from "../../../application/hooks/useSocialeOrchestrator";
import { SocialeCreateModal } from "./SocialeCreateModal";
import { supabase } from "../../../supabase/client";

interface SocialesPanelProps {
  isDark: boolean;
  roomId: string;
  userId?: string;
  onSocialeChange?: (socialeId: string | null) => void;
}

export function SocialesPanel({ isDark, roomId, userId, onSocialeChange }: SocialesPanelProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Fetch single active Sociale for this room
  const { data: sociales, isLoading, error } = useSocialesByRoom(roomId);
  const sociale = sociales && sociales.length > 0 ? sociales[0] : null;
  
  // Create Sociale mutation
  const createSociale = useCreateSociale();
  
  // Get orchestrator for the active Sociale
  const { startSociale } = useSocialeOrchestrator({ 
    socialeId: sociale?.id || '' 
  });

  // Notify parent when Sociale changes (with debouncing to prevent infinite loops)
  const lastSocialeIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const currentSocialeId = sociale?.id || null;
    if (lastSocialeIdRef.current !== currentSocialeId) {
      lastSocialeIdRef.current = currentSocialeId;
      onSocialeChange?.(currentSocialeId);
    }
  }, [sociale?.id, onSocialeChange]);

  const handleCreateSociale = async (request: any) => {
    try {
      await createSociale.mutateAsync(request);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create Sociale:', error);
    }
  };

  const handleStartSociale = async (socialeId: string) => {
    try {
      console.log('Starting Sociale:', socialeId);
      
      // Use the existing Edge Function which should handle round creation
      // The Edge Function has proper RLS permissions
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/sociales-start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ socialeId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to start Sociale' }));
        throw new Error(errorData.message || errorData.error || 'Failed to start Sociale');
      }
      
      console.log('Sociale started successfully via Edge Function!');
      
    } catch (error) {
      console.error('Failed to start Sociale:', error);
    }
  };

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

  const handleEndSociale = async (socialeId: string) => {
    // TODO: Implement end functionality
    console.log('Ending Sociale:', socialeId);
  };

  if (error) {
    return (
      <Card className="space-y-5 p-4" isDark={isDark}>
        <div className="text-red-500">Error loading Sociales: {error.message}</div>
      </Card>
    );
  }

  return (
    <>
      <Card className="space-y-5" isDark={isDark}>
        <div className={`border-t pt-5 ${!isDark ? "border-slate-200" : "border-cyan-400/20"}`}>
          <div className="mb-3 flex items-center justify-between">
            <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? "text-slate-500" : "text-cyan-400"}`}>
              Sociales
            </h4>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="sm"
              >
                Create Sociale
              </Button>
            </div>
          </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className={`text-lg font-semibold mb-2 ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}>
                Loading Sociales...
              </div>
            </div>
          ) : !sociale ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className={`text-lg font-semibold mb-2 ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}>
                  No Active Sociale
                </div>
                <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                  Create a new Sociale to get started with the social gaming system
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  className="w-full"
                >
                  Create Sociale
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sociale Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                    {sociale.title || `Sociale ${sociale.id.slice(0, 8)}`}
                  </h4>
                  <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                    Mode: {sociale.mode} • {sociale.totalRounds} rounds
                  </p>
                </div>
                <div className="flex gap-2">
                  {sociale.status === 'draft' && (
                    <Button
                      onClick={() => handleStartSociale(sociale.id)}
                      variant="primary"
                      size="sm"
                    >
                      Start
                    </Button>
                  )}
                  {sociale.status === 'active' && (
                    <Button
                      onClick={() => handleEndSociale(sociale.id)}
                      variant="secondary"
                      size="sm"
                    >
                      End
                    </Button>
                  )}
                </div>
              </div>

              {/* Sociale Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  !isDark ? "bg-slate-100 text-slate-600" : "bg-pink-500/20 text-pink-400 border border-pink-400/30"
                }`}>
                  {sociale.status === 'draft' ? 'In Draft' :
                   sociale.status === 'active' ? 'In Progress' :
                   sociale.status === 'paused' ? 'Paused' :
                   sociale.status === 'completed' ? 'Completed' :
                   sociale.status}
                </span>
              </div>

              {/* Sociale Content Area */}
              <div className={`p-4 rounded-lg border ${
                !isDark 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-slate-700 border-slate-600'
              }`}>
                <div className={`text-center py-8 ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <div className={`text-lg font-semibold mb-2 ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}>
                    {sociale.status === 'draft' ? 'Ready to Start' :
                     sociale.status === 'active' ? 'Sociale in Progress' :
                     sociale.status === 'paused' ? 'Sociale Paused' :
                     sociale.status === 'completed' ? 'Sociale Completed' :
                     'Sociale Ready'}
                  </div>
                  <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                    {sociale.status === 'draft' ? 'Click Start to begin the social gaming experience' :
                     sociale.status === 'active' ? 'Players are currently participating in the Sociale' :
                     sociale.status === 'paused' ? 'Sociale is temporarily paused' :
                     sociale.status === 'completed' ? 'This Sociale has been completed' :
                     'Sociale is ready'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </Card>

      <SocialeCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomId={roomId}
        onCreateSociale={handleCreateSociale}
      />
    </>
  );
}
