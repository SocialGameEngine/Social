import { useState, useCallback, useRef } from 'react';
import type { SessionStats, BragStat } from '../../../domain/share/pickBragStat';
import { pickBragStat, generateShareText } from '../../../domain/share/pickBragStat';

interface UseShareCardOptions {
  stats: SessionStats;
  playerName: string;
  venueName?: string;
}

interface ShareCardState {
  isGenerating: boolean;
  error: string | null;
  imageUrl: string | null;
}

export function useShareCard({ stats, playerName, venueName }: UseShareCardOptions) {
  const [state, setState] = useState<ShareCardState>({
    isGenerating: false,
    error: null,
    imageUrl: null,
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Pick the best brag stat
  const bragStat: BragStat = pickBragStat(stats);

  /**
   * Generate PNG from ShareCard component
   */
  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) {
      setState(prev => ({ ...prev, error: 'Card element not found' }));
      return null;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // html-to-image library not available - throw error
      throw new Error('html-to-image library not available');
    } catch (error) {
      console.error('Failed to generate share card:', error);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: 'Failed to generate image' 
      }));
      return null;
    }
  }, []);

  /**
   * Copy image to clipboard
   */
  const copyToClipboard = useCallback(async (dataUrl: string): Promise<boolean> => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Use Clipboard API
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  /**
   * Share via Web Share API
   */
  const shareViaNavigator = useCallback(async (dataUrl: string): Promise<boolean> => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create file from blob
      const file = new File([blob], 'social-game-stats.png', { type: 'image/png' });

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${playerName} @ ${venueName || 'Social Game Engine'}`,
          text: generateShareText(stats, bragStat),
          files: [file],
        });
        return true;
      }

      return false;
    } catch (error) {
      // User cancelled or error occurred
      console.error('Failed to share:', error);
      return false;
    }
  }, [playerName, venueName, stats, bragStat]);

  /**
   * Download image
   */
  const downloadImage = useCallback((dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `social-game-stats-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  /**
   * Main share function - tries multiple methods
   */
  const share = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    // Try Web Share API first (mobile-friendly)
    const sharedViaNavigator = await shareViaNavigator(dataUrl);
    if (sharedViaNavigator) return;

    // Fallback to clipboard
    const copiedToClipboard = await copyToClipboard(dataUrl);
    if (copiedToClipboard) {
      // Show toast notification
      console.log('Image copied to clipboard!');
      return;
    }

    // Final fallback: download
    downloadImage(dataUrl);
  }, [generateImage, shareViaNavigator, copyToClipboard, downloadImage]);

  return {
    cardRef,
    bragStat,
    state,
    generateImage,
    share,
    copyToClipboard,
    shareViaNavigator,
    downloadImage,
  };
}
