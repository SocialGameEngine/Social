import { useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

interface InstagramEmbedProps {
  url: string;
  className?: string;
}

export function InstagramEmbed({ url, className }: InstagramEmbedProps) {
  useEffect(() => {
    // Load Instagram embed script if not already loaded
    if (!window.instgrm) {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
      document.body.appendChild(script);
    } else {
      // Process embeds if script already loaded
      window.instgrm.Embeds.process();
    }
  }, []);

  return (
    <div className={`instagram-embed ${className || ''} w-full max-w-full box-border`}>
      <blockquote
        className="instagram-media embed-reset"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        data-instgrm-captioned
        data-instgrm-width="100%"
      />
    </div>
  );
}
