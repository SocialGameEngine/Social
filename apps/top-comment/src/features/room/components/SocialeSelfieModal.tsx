import { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@social/ui';
import type { SocialeLeaderboardTeam } from './SocialeLeaderboardModal';

interface SocialeSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSocialite?: SocialeLeaderboardTeam | null;
  finalLeaderboard?: Array<SocialeLeaderboardTeam & { rank: number }>;
  venueName?: string;
}

export function SocialeSelfieModal({ 
  isOpen, 
  onClose, 
  currentSocialite = null, 
  finalLeaderboard = [], 
  venueName 
}: SocialeSelfieModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [, setIsTakingSelfie] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [restartCounter, setRestartCounter] = useState(0);
  // Auto-start camera when modal opens or restartCounter changes
  useEffect(() => {
    if (isOpen && !cameraStream && !selfieImage) {
      startSelfie();
    }
  }, [isOpen, restartCounter]); // Trigger on modal open or restart

  // Shared overlay drawing function - Strava style
  const drawOverlay = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!currentSocialite || finalLeaderboard.length === 0) return;
    
    const socialiteWithRank = finalLeaderboard.find(s => s.id === currentSocialite.id);
    if (!socialiteWithRank) return;

    const scale = width / 375;
    const padding = 24 * scale;
    const topY = padding + 40 * scale;
    
    // Add semi-transparent gradient at top for readability
    const gradient = ctx.createLinearGradient(0, 0, 0, 150 * scale);
    gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 150 * scale);
    
    // Player name - large, bold at top left
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${28 * scale}px Arial, sans-serif`;
    ctx.fillText(currentSocialite.teamName, padding, topY);
    
    // Rank - smaller, below player name
    ctx.font = `${16 * scale}px Arial, sans-serif`;
    ctx.fillText(`#${socialiteWithRank.rank}`, padding, topY + 32 * scale);
    
    // Venue if available
    if (venueName) {
      ctx.font = `${12 * scale}px Arial, sans-serif`;
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(venueName, padding, topY + 55 * scale);
    }
    
    // Söcial logo/text at bottom right
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#60a5fa';
    ctx.font = `bold ${12 * scale}px Arial, sans-serif`;
    ctx.fillText('Söcial', width - padding, height - padding);
  }, [currentSocialite, finalLeaderboard, venueName]);

  // Preview animation loop - draws overlay on preview canvas
  const startPreviewOverlay = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!overlayCanvas || !video) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Match overlay canvas size to video display size
      const rect = video.getBoundingClientRect();
      overlayCanvas.width = rect.width;
      overlayCanvas.height = rect.height;

      // Clear and redraw overlay
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      drawOverlay(ctx, overlayCanvas.width, overlayCanvas.height);

      rafRef.current = requestAnimationFrame(render);
    };

    render();
  }, [drawOverlay]);

  const stopPreviewOverlay = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startSelfie = async () => {
    try {
      setIsTakingSelfie(true);
      
      let stream;
      try {
        // Try to get a resolution closer to 4:5 aspect ratio
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1080 },
            height: { ideal: 1350 }
          },
          audio: false 
        });
      } catch (error) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' },
          audio: false 
        });
      }
      
      setCameraStream(stream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsTakingSelfie(false);
    }
  };

  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !captureCanvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture at 4:5 to match preview - crop camera feed
    const outputWidth = 1080;
    const outputHeight = 1350;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    // Get video dimensions and crop to 9:16
    const videoWidth = video.videoWidth || 1080;
    const videoHeight = video.videoHeight || 1920;
    const videoAspect = videoWidth / videoHeight;
    const outputAspect = outputWidth / outputHeight;
    
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;
    
    // Crop video to match 4:5 output
    if (videoAspect > outputAspect) {
      // Video is wider - crop sides
      sourceWidth = videoHeight * outputAspect;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller - crop top/bottom
      sourceHeight = videoWidth / outputAspect;
      sourceY = (videoHeight - sourceHeight) / 2;
    }
    
    // Draw cropped video frame
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);

    // Draw overlay using SAME function as preview
    drawOverlay(ctx, outputWidth, outputHeight);

    // Convert to image
    const imageDataUrl = canvas.toDataURL('image/png');
    setSelfieImage(imageDataUrl);
    
    // Stop camera and preview
    stopPreviewOverlay();
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
  }, [cameraStream, drawOverlay, stopPreviewOverlay]);

  const cancelSelfie = useCallback(() => {
    stopPreviewOverlay();
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setSelfieImage(null);
    setIsTakingSelfie(false);
    // Trigger camera restart
    setRestartCounter(c => c + 1);
  }, [cameraStream, stopPreviewOverlay]);

  const downloadSelfie = useCallback(() => {
    if (!selfieImage) return;
    
    const link = document.createElement('a');
    const filename = currentSocialite?.teamName 
      ? `${currentSocialite.teamName}-sociale-selfie.png` 
      : 'sociale-selfie.png';
    link.download = filename;
    link.href = selfieImage;
    link.click();
  }, [selfieImage, currentSocialite]);

  const shareSelfie = useCallback(async () => {
    if (!selfieImage) return;
    
    try {
      const response = await fetch(selfieImage);
      const blob = await response.blob();
      
      const shareData = {
        title: 'Söcial Selfie',
        text: currentSocialite 
          ? 'Check out my Söcial selfie!' 
          : 'Check out my Söcial selfie!',
        files: [new File([blob], currentSocialite?.teamName ? `${currentSocialite.teamName}-sociale-selfie.png` : 'sociale-selfie.png', { type: 'image/png' })]
      };
      
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        downloadSelfie();
      }
    } catch (error) {
      console.error('Error sharing selfie:', error);
      downloadSelfie();
    }
  }, [selfieImage, currentSocialite, downloadSelfie]);

  const handleClose = useCallback(() => {
    cancelSelfie();
    onClose();
  }, [cancelSelfie, onClose]);

  // Handle camera stream changes - initialize video when stream is set, stop when cleared
  useEffect(() => {
    if (!cameraStream) {
      // If cameraStream is cleared, stop any existing video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
      return;
    }
    
    // Initialize video with the stream
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      
      videoRef.current.play()
        .then(() => {
          setIsTakingSelfie(false);
          startPreviewOverlay();
        })
        .catch((error) => {
          console.error('Video play error:', error);
          setIsTakingSelfie(false);
        });
    }
    
    // Fallback timeout
    const timeout = setTimeout(() => {
      setIsTakingSelfie(false);
    }, 1000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [cameraStream, startPreviewOverlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreviewOverlay();
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream, stopPreviewOverlay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-w-md sm:mx-4 sm:rounded-2xl rounded-none mx-0 bg-slate-900 shadow-2xl overflow-hidden border-0 sm:border border-slate-700">
        <div className="p-0 sm:p-6 space-y-0 sm:space-y-4 h-full">
          {/* Hidden canvas for capturing final image */}
          <canvas ref={captureCanvasRef} className="hidden" />

          {selfieImage ? (
            <div className="space-y-3 p-6">
              <div className="relative">
                <img
                  src={selfieImage}
                  alt="Selfie"
                  className="w-full rounded-xl"
                />
                {/* X button floating over image */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={cancelSelfie} className="flex-1">
                  Retake
                </Button>
                <Button onClick={shareSelfie} className="flex-1">
                  Share
                </Button>
              </div>
            </div>
          ) : cameraStream ? (
            <div className="relative h-full flex flex-col bg-black">
              <div className="relative w-full aspect-4-5">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Canvas overlay - matches video size */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                {/* X button floating over camera */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Circular capture button at bottom of camera */}
                <button
                  onClick={captureSelfie}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white bg-pink-400 hover:bg-pink-500 active:scale-95 transition-all shadow-lg flex items-center justify-center z-10"
                >
                  <div className="w-14 h-14 rounded-full bg-white" />
                </button>
              </div>
              {/* Overlay Style Selector - fills dead space */}
              <div className="flex-1 flex flex-col justify-center px-4 py-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 text-center">Overlay Style</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {/* Classic Style */}
                  <button className="flex-shrink-0 flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-white text-xs font-bold">#1</span>
                    </div>
                    <span className="text-xs text-slate-300">Classic</span>
                  </button>
                  {/* Neon Style */}
                  <button className="flex-shrink-0 flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-xl bg-black border-2 border-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.5)] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-pink-400 text-xs font-bold">#1</span>
                    </div>
                    <span className="text-xs text-slate-300">Neon</span>
                  </button>
                  {/* Minimal Style */}
                  <button className="flex-shrink-0 flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-white text-xs font-light">1st</span>
                    </div>
                    <span className="text-xs text-slate-300">Minimal</span>
                  </button>
                  {/* Gold Style */}
                  <button className="flex-shrink-0 flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-yellow-200 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-white text-xs font-bold">#1</span>
                    </div>
                    <span className="text-xs text-slate-300">Gold</span>
                  </button>
                  {/* Retro Style */}
                  <button className="flex-shrink-0 flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 border-2 border-orange-200 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-white text-xs font-bold">#1</span>
                    </div>
                    <span className="text-xs text-slate-300">Retro</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-6">
              <p className="text-slate-300">Starting camera...</p>
              <div className="w-full h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialeSelfieModal;
