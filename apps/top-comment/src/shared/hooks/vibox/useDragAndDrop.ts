import { useCallback } from "react";
import type { Track } from "../../types/vibox";

interface UseDragAndDropProps {
  allowUploads: boolean;
  onTracksAdded: (tracks: Track[]) => void;
  showToast: (message: { title: string; variant: "success" | "error" | "info" }) => void;
}

interface UseDragAndDropReturn {
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleFileInput: (files: FileList) => void;
}

export const useDragAndDrop = ({
  allowUploads,
  onTracksAdded,
  showToast
}: UseDragAndDropProps): UseDragAndDropReturn => {
  const processFiles = useCallback((files: FileList) => {
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')
    );

    if (audioFiles.length === 0) {
      showToast({ title: 'No audio files found', variant: 'error' });
      return;
    }

    const newTracks: Track[] = audioFiles.map((file, index) => {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const parts = fileName.split(' - ');
      const title = parts[1] || parts[0] || fileName;
      const artist = parts[1] ? parts[0] : 'Unknown Artist';

      return {
        id: `track-${Date.now()}-${index}`,
        title: title.trim(),
        artist: artist.trim(),
        duration: 0, // Will be updated when loaded
        file,
        url: URL.createObjectURL(file),
        isPreloaded: false
      };
    });

    onTracksAdded(newTracks);
    showToast({ title: `Added ${newTracks.length} track${newTracks.length !== 1 ? 's' : ''}`, variant: "success" });
  }, [onTracksAdded, showToast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!allowUploads) return;
    
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [allowUploads, processFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!allowUploads) return;
    
    event.preventDefault();
  }, [allowUploads]);

  const handleFileInput = useCallback((files: FileList) => {
    if (!files) return;
    processFiles(files);
  }, [processFiles]);

  return {
    handleDrop,
    handleDragOver,
    handleFileInput,
  };
};
