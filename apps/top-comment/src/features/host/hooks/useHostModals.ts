// =============================================================================
// USE HOST MODALS HOOK
// =============================================================================
// Consolidates all modal state management for HostPage.

import { useState, useRef } from 'react';

export interface UseHostModalsReturn {
  // Account menu
  showAccountMenu: boolean;
  setShowAccountMenu: (show: boolean) => void;
  accountMenuRef: React.RefObject<HTMLDivElement>;
  
  // Auth modals
  showPlayerAuthModal: boolean;
  setShowPlayerAuthModal: (show: boolean) => void;
  showVenueAuthModal: boolean;
  setShowVenueAuthModal: (show: boolean) => void;
  showVenueAuthPrompt: boolean;
  setShowVenueAuthPrompt: (show: boolean) => void;
  
  // Room modals
  showRoomCreateModal: boolean;
  setShowRoomCreateModal: (show: boolean) => void;
  roomModalMode: 'create' | 'settings' | null;
  setRoomModalMode: (mode: 'create' | 'settings' | null) => void;
  setVenueRoomCreated: (roomCode: string) => void;
  
  // Session modals
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  showJoinModal: boolean;
  setShowJoinModal: (show: boolean) => void;
  isJoiningSession: boolean;
  setIsJoiningSession: (joining: boolean) => void;
  showEndSessionModal: boolean;
  setShowEndSessionModal: (show: boolean) => void;
  
  // Sociale modals
  activeSocialeId: string | null;
  setActiveSocialeId: (id: string | null) => void;
  showSocialeModal: boolean;
  setShowSocialeModal: (show: boolean) => void;
  showJoinSocialeModal: boolean;
  setShowJoinSocialeModal: (show: boolean) => void;
  isJoiningSociale: boolean;
  setIsJoiningSociale: (joining: boolean) => void;
  
  // Other modals
  showBannedPlayersModal: boolean;
  setShowBannedPlayersModal: (show: boolean) => void;
  showVIBoxModal: boolean;
  setShowVIBoxModal: (show: boolean) => void;
  showPromptLibraryModal: boolean;
  setShowPromptLibraryModal: (show: boolean) => void;
  
  // Room members
  isRoomMembersOpen: boolean;
  setIsRoomMembersOpen: (open: boolean) => void;
}

/**
 * Consolidates all modal state management for HostPage
 * Reduces HostPage.tsx complexity by ~50 lines
 */
export function useHostModals(): UseHostModalsReturn {
  // Account menu
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  // Auth modals
  const [showPlayerAuthModal, setShowPlayerAuthModal] = useState(false);
  const [showVenueAuthModal, setShowVenueAuthModal] = useState(false);
  const [showVenueAuthPrompt, setShowVenueAuthPrompt] = useState(false);
  
  // Room modals
  const [showRoomCreateModal, setShowRoomCreateModal] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState<'create' | 'settings' | null>(null);
  const [venueRoomCreated, setVenueRoomCreated] = useState<string | null>(null);
  
  // Session modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  
  // Sociale modals
  const [activeSocialeId, setActiveSocialeId] = useState<string | null>(null);
  const [showSocialeModal, setShowSocialeModal] = useState(false);
  const [showJoinSocialeModal, setShowJoinSocialeModal] = useState(false);
  const [isJoiningSociale, setIsJoiningSociale] = useState(false);
  
  // Other modals
  const [showBannedPlayersModal, setShowBannedPlayersModal] = useState(false);
  const [showVIBoxModal, setShowVIBoxModal] = useState(false);
  const [showPromptLibraryModal, setShowPromptLibraryModal] = useState(false);
  
  // Room members
  const [isRoomMembersOpen, setIsRoomMembersOpen] = useState(false);
  
  return {
    // Account menu
    showAccountMenu,
    setShowAccountMenu,
    accountMenuRef,
    
    // Auth modals
    showPlayerAuthModal,
    setShowPlayerAuthModal,
    showVenueAuthModal,
    setShowVenueAuthModal,
    showVenueAuthPrompt,
    setShowVenueAuthPrompt,
    
    // Room modals
    showRoomCreateModal,
    setShowRoomCreateModal,
    roomModalMode,
    setRoomModalMode,
    setVenueRoomCreated,
    
    // Session modals
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showJoinModal,
    setShowJoinModal,
    isJoiningSession,
    setIsJoiningSession,
    showEndSessionModal,
    setShowEndSessionModal,
    
    // Sociale modals
    activeSocialeId,
    setActiveSocialeId,
    showSocialeModal,
    setShowSocialeModal,
    showJoinSocialeModal,
    setShowJoinSocialeModal,
    isJoiningSociale,
    setIsJoiningSociale,
    
    // Other modals
    showBannedPlayersModal,
    setShowBannedPlayersModal,
    showVIBoxModal,
    setShowVIBoxModal,
    showPromptLibraryModal,
    setShowPromptLibraryModal,
    
    // Room members
    isRoomMembersOpen,
    setIsRoomMembersOpen,
  };
}
