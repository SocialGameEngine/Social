import { useState, useEffect } from 'react';
import { TwitterEmbed, extractTweetId } from './TwitterEmbed';
import { InstagramEmbed } from './InstagramEmbed';

interface EmbedPreviewProps {
  url: string;
  onRemove?: () => void;
}

export function EmbedPreview({ url, onRemove }: EmbedPreviewProps) {
  const [embedType, setEmbedType] = useState<'twitter' | 'instagram' | 'image' | 'unknown'>('unknown');
  const [isValid, setIsValid] = useState(false);

  // Detect embed type
  const detectEmbedType = (url: string) => {
    if (url.includes('twitter.com') || url.includes('x.com')) {
      const tweetId = extractTweetId(url);
      return tweetId ? 'twitter' : 'unknown';
    }
    if (url.includes('instagram.com')) {
      return 'instagram';
    }
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return 'image';
    }
    return 'unknown';
  };

  // Initialize embed type using useEffect instead of during render
  useEffect(() => {
    const detected = detectEmbedType(url);
    setEmbedType(detected);
    setIsValid(detected !== 'unknown');
  }, [url]);

  if (!isValid) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-medium">Unsupported URL</p>
            <p className="text-sm">This URL format is not supported for embedding</p>
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="mt-3 text-sm text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full box-border">
      {onRemove && (
        <div className="flex justify-end p-2">
          <button
            onClick={onRemove}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="w-full max-w-full">
        {embedType === 'twitter' && (
          <TwitterEmbed tweetId={extractTweetId(url)!} />
        )}
        
        {embedType === 'instagram' && (
          <InstagramEmbed url={url} />
        )}
        
        {embedType === 'image' && (
          <div className="rounded-lg overflow-hidden w-full max-w-full">
            <img
              src={url}
              alt="Embedded image"
              className="w-full h-auto max-h-64 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="bg-slate-700 p-8 rounded-lg text-center text-slate-400">
                      🖼️ Failed to load image
                    </div>
                  `;
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
