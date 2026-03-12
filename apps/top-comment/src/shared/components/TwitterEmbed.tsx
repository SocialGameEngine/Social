import { useEffect } from 'react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
  }
}

interface TwitterEmbedProps {
  tweetId: string;
  className?: string;
}

export function TwitterEmbed({ tweetId, className }: TwitterEmbedProps) {
  useEffect(() => {
    // Load Twitter widget script if not already loaded
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);
    } else {
      // Reload widgets if script already loaded
      window.twttr.widgets.load();
    }
  }, []);

  return (
    <div className={`twitter-embed ${className || ''} w-full max-w-full box-border`}>
      <blockquote
        className="twitter-tweet"
        data-theme="dark"
        data-chrome="nofooter noborders transparent"
        data-width="100%"
        data-dnt="true"
      >
        <a href={`https://twitter.com/twitter/status/${tweetId}`}>
          Loading tweet...
        </a>
      </blockquote>
    </div>
  );
}

// Utility function to extract tweet ID from URL
export function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /mobile\.twitter\.com\/\w+\/status\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
