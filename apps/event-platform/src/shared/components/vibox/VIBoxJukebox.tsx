import React from "react";
import { VIBoxThemeProviderWithSystem } from "./ThemeProvider";
import { VIBoxJukeboxInner } from "./VIBoxJukeboxInner";
import { VotingProvider } from "../../contexts/ViboxVotingContext";

interface VIBoxJukeboxProps {
  isOpen: boolean;
  onClose: () => void;
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
  mode?: "host" | "team";
  allowUploads?: boolean;
}

/**
 * VIBoxJukebox - Main entry point with VIBox theme system
 * Wraps the original VIBoxJukeboxInner with the VIBox theme provider and voting context
 * This gives us the full-featured original implementation with proper theming and database-backed voting
 */
export const VIBoxJukebox: React.FC<VIBoxJukeboxProps> = (props) => {
  return (
    <VIBoxThemeProviderWithSystem>
      <VotingProvider>
        <VIBoxJukeboxInner {...props} />
      </VotingProvider>
    </VIBoxThemeProviderWithSystem>
  );
};
