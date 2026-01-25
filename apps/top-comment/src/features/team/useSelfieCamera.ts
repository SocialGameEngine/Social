import { useState, useEffect, useRef } from 'react';
import type { Team } from '../../shared/types';

interface UseSelfieCameraOptions {
  currentTeam: Team | null;
  finalLeaderboard: Array<Team & { rank: number }>;
  venueName?: string;
}

export function useSelfieCamera({ currentTeam, finalLeaderboard, venueName }: UseSelfieCameraOptions) {
  const [isTakingSelfie, setIsTakingSelfie] = useState(false);
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle camera stream initialization when cameraStream changes
  useEffect(() => {
    if (!cameraStream) {
      // If cameraStream is cleared, stop any existing video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
      return;
    }
    
    // Wait for video element to be rendered
    if (!videoRef.current) {
      // Check again after a short delay
      const checkInterval = setInterval(() => {
        if (videoRef.current) {
          clearInterval(checkInterval);
          const cleanup = initializeVideo(videoRef.current, cameraStream);
          return cleanup;
        }
      }, 50);
      
      return () => {
        clearInterval(checkInterval);
      };
    }

    const cleanup = initializeVideo(videoRef.current, cameraStream);
    return cleanup;
  }, [cameraStream]);
  
  const initializeVideo = (video: HTMLVideoElement, stream: MediaStream) => {
    // Set video source
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    
    // Event handlers
    const handleCanPlay = () => {
      if (video.paused) {
        video.play()
          .then(() => {
            setIsTakingSelfie(false);
          })
          .catch((error) => {
            console.error('Video play error:', error);
            setIsTakingSelfie(false);
          });
      }
    };
    
    const handlePlaying = () => {
      setIsTakingSelfie(false);
    };
    
    const handleError = (error: Event) => {
      console.error('Video error:', error);
      setIsTakingSelfie(false);
    };
    
    // Add event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);
    
    // Try to play after a short delay to let the stream load
    const playTimeout = setTimeout(() => {
      video.play()
        .then(() => {
          setIsTakingSelfie(false);
        })
        .catch((error) => {
          console.error('Video play failed:', error);
          // Try again
          setTimeout(() => {
            video.play().then(() => {
              setIsTakingSelfie(false);
            }).catch((retryError) => {
              console.error('Video retry failed:', retryError);
            });
          }, 200);
        });
    }, 100);
    
    // Fallback - clear loading state after 1 second
    const timeout = setTimeout(() => {
      console.log('Force clearing loading state');
      setIsTakingSelfie(false);
    }, 1000);
    
    // Return cleanup function
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
      clearTimeout(timeout);
      clearTimeout(playTimeout);
    };
  };

  const startSelfie = async () => {
    try {
      setIsTakingSelfie(true);
      setShowSelfieModal(true);
      
      console.log('Requesting camera access...');
      let stream;
      try {
        // Try with front-facing camera preference first
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false 
        });
        console.log('Got camera stream with front-facing preference');
      } catch (error) {
        console.log('Front-facing camera not available, trying default camera', error);
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false 
        });
        console.log('Got camera stream with default settings');
      }
      
      // Set the stream in state - useEffect will handle the video initialization
      setCameraStream(stream);
      
      // Safety timeout - clear loading state after 3 seconds regardless
      setTimeout(() => {
        console.log('Safety timeout: clearing loading state');
        setIsTakingSelfie(false);
      }, 3000);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // You can add toast notification here if needed
      setIsTakingSelfie(false);
      setShowSelfieModal(false);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current || !currentTeam) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('Capturing selfie, video dimensions:', video.videoWidth, video.videoHeight);
    console.log('Video readyState:', video.readyState);
    console.log('Video paused:', video.paused);
    
    // Use fixed dimensions for Instagram/TikTok portrait (9:16 aspect ratio)
    // Use a high-quality resolution that's ideal for social media
    const outputWidth = 1080; // Instagram/TikTok ideal width
    const outputHeight = 1920; // 9:16 aspect ratio
    
    // Set canvas to fixed output size
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    // Get video dimensions
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    
    // Calculate how to fit video into our fixed output dimensions
    // We'll use the full video width and crop/center vertically
    const videoAspect = videoWidth / videoHeight;
    const outputAspect = outputWidth / outputHeight;
    
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;
    
    // Crop video to match output aspect ratio
    if (videoAspect > outputAspect) {
      // Video is wider than output - crop sides
      sourceWidth = videoHeight * outputAspect;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller than output - crop top/bottom (center vertically)
      sourceHeight = videoWidth / outputAspect;
      sourceY = (videoHeight - sourceHeight) / 2;
    }

    // Draw the video frame centered and cropped to fill output dimensions
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
    
    console.log('Drew video frame to canvas');

    // Get team's rank
    const teamWithRank = finalLeaderboard.find(t => t.id === currentTeam.id);
    if (!teamWithRank) return;

    // Draw crown emoji to match overlay dimensions EXACTLY
    // Overlay uses CSS on 375px max-width viewport:
    // - Crown: text-[180px] with scale(1.5, 1), rotate(8deg), translateX(8px)
    // - Circle: w-80 h-80 (320px) with mb-4 between crown and circle
    
    // Scale from overlay viewport (375px) to output canvas (1080px)
    const viewportScale = outputWidth / 375; // 1080 / 375 = 2.88x
    
    // Absolute dimensions in overlay (as rendered on 375px viewport)
    const overlayCrownSize = 180;
    //const overlayCircleSize = 320;
    //const overlayCrownOffsetX = 8;
    //const overlayCircleOffsetY = 40; // Distance between crown and circle (mb-4 = 16px + some space)
    
    // Apply to output canvas with exact scaling
    const crownSize = overlayCrownSize * viewportScale;
    //const circleSize = overlayCircleSize * viewportScale;
    
    // Position calculations - crown positioned above player's head area
    // Crown should be centered horizontally on the canvas
    // Crown is positioned above where the head would be (roughly 15-20% from top)
    
    const crownX = canvas.width / 2; // Centered horizontally
    const crownY = canvas.height * 0.22; // ~22% from top to match overlay positioning
    
    // Save context for transformation
    ctx.save();
    
    // Move origin to crown center for proper rotation and scaling
    ctx.translate(crownX, crownY);
    
    // Apply rotation (8 degrees clockwise) to match overlay - makes it look worn at an angle
    ctx.rotate(8 * Math.PI / 180);
    
    // Apply scaling relative to crown center (1.5x wider to match overlay)
    ctx.scale(1.5, 1);
    
    // Draw text at origin (0,0) since we translated to crown center
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${crownSize}px Arial, sans-serif`;
    ctx.fillText('👑', 0, 0);
    
    // Restore context
    ctx.restore();

    // Add overlay with score and rank (scaled to match viewport scale)
    // Position overlay in bottom 20% of screen
    const overlayY = canvas.height * 0.78; // Start slightly higher (78% of screen height)
    
    // No semi-transparent background - just text
    
    // White text (scaled to match preview sizes)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Team name - match text-2xl from preview (1.5rem = 24px base)
    ctx.font = `bold ${24 * viewportScale}px Arial, sans-serif`;
    ctx.fillText(`Congrats ${currentTeam.teamName}!`, canvas.width / 2, overlayY + 30 * viewportScale);

    // Rank and score - match text-lg from preview (1.125rem = 18px base)
    ctx.font = `${18 * viewportScale}px Arial, sans-serif`;
    ctx.fillText(`You placed #${teamWithRank.rank} with ${currentTeam.score} points!`, canvas.width / 2, overlayY + 60 * viewportScale);

    // Venue callout (if set) - before Powered by Söcial, match text-sm
    let nextY = overlayY + 90 * viewportScale;
    if (venueName) {
      // White for venue text, match text-sm (0.875rem = 14px base)
      ctx.fillStyle = '#ffffff';
      ctx.font = `${14 * viewportScale}px Arial, sans-serif`;
      ctx.fillText(`At ${venueName}`, canvas.width / 2, nextY);
      nextY += 20 * viewportScale; // Spacing between venue and powered by
    }

    // Powered by Söcial - light blue color, match text-sm from preview
    ctx.fillStyle = '#60a5fa'; // light blue-400 from Tailwind
    ctx.font = `bold ${14 * viewportScale}px Arial, sans-serif`;
    ctx.fillText('Powered by Söcial', canvas.width / 2, nextY);

    // Convert to image
    const imageDataUrl = canvas.toDataURL('image/png');
    setSelfieImage(imageDataUrl);
    
    // Stop camera
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowSelfieModal(false);
  };

  const cancelSelfie = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null); // Clear the stream state
    setShowSelfieModal(false);
    setIsTakingSelfie(false);
  };

  const downloadSelfie = () => {
    if (!selfieImage || !currentTeam) return;
    
    const link = document.createElement('a');
    link.download = `bar-scores-selfie-${currentTeam.teamName}-rank-${finalLeaderboard.find(t => t.id === currentTeam.id)?.rank || '?'}.png`;
    link.href = selfieImage;
    link.click();
  };

  const shareSelfie = async () => {
    if (!selfieImage) return;
    
    try {
      const response = await fetch(selfieImage);
      const blob = await response.blob();
      
      const shareData = {
        title: 'Söcial Selfie',
        text: `I got ${currentTeam?.score} points and placed #${finalLeaderboard.find(t => t.id === currentTeam?.id)?.rank || '?'}!`,
        files: [new File([blob], 'bar-scores-selfie.png', { type: 'image/png' })]
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
  };

  return {
    isTakingSelfie,
    showSelfieModal,
    selfieImage,
    setSelfieImage,
    videoRef,
    canvasRef,
    startSelfie,
    captureSelfie,
    cancelSelfie,
    downloadSelfie,
    shareSelfie,
  };
}
