import { useState, useRef } from "react";

/**
 * Manages all modal visibility state for HostPage
 * Consolidates 18 scattered useState calls into a single hook
 */
export function useHostModalState() {
  // Account modals
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPlayerAuthModal, setShowPlayerAuthModal] = useState(false);
  const [showVenueAuthModal, setShowVenueAuthModal] = useState(false);
  const [venueRoomCreated, setVenueRoomCreated] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Room modal with mode (null, "create", or "settings")
  type HostRoomModalMode = null | "create" | "settings";
  const [roomModalMode, setRoomModalMode] = useState<HostRoomModalMode>(null);

  // Sociale modals
  const [activeSocialeId, setActiveSocialeId] = useState<string | null>(null);
  const [showSocialeModal, setShowSocialeModal] = useState(false);

  // Other modals
  const [showBannedPlayersModal, setShowBannedPlayersModal] = useState(false);
  const [showVIBoxModal, setShowVIBoxModal] = useState(false);
  const [showVenueAuthPrompt, setShowVenueAuthPrompt] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [showJoinSocialeModal, setShowJoinSocialeModal] = useState(false);
  const [isJoiningSociale, setIsJoiningSociale] = useState(false);

  // Side panel state
  const [isRoomMembersOpen, setIsRoomMembersOpen] = useState(false);

  // Backward compatibility wrapper for room modal
  const showRoomCreateModal = roomModalMode !== null;
  const setShowRoomCreateModal = (show: boolean) => {
    setRoomModalMode(show ? "create" : null);
  };

  return {
    // Account
    showAccountMenu,
    setShowAccountMenu,
    showPlayerAuthModal,
    setShowPlayerAuthModal,
    showVenueAuthModal,
    setShowVenueAuthModal,
    venueRoomCreated,
    setVenueRoomCreated,
    accountMenuRef,

    // Room
    roomModalMode,
    setRoomModalMode,
    showRoomCreateModal,
    setShowRoomCreateModal,

    // Sociale
    activeSocialeId,
    setActiveSocialeId,
    showSocialeModal,
    setShowSocialeModal,

    // Other modals
    showBannedPlayersModal,
    setShowBannedPlayersModal,
    showVIBoxModal,
    setShowVIBoxModal,
    showVenueAuthPrompt,
    setShowVenueAuthPrompt,
    showJoinModal,
    setShowJoinModal,
    isJoiningSession,
    setIsJoiningSession,
    showJoinSocialeModal,
    setShowJoinSocialeModal,
    isJoiningSociale,
    setIsJoiningSociale,

    // Side panel
    isRoomMembersOpen,
    setIsRoomMembersOpen,
  };
}
