import { useState } from 'react';

interface EmbedInputProps {
  onAddEmbed: (url: string) => void;
  disabled?: boolean;
}

export function EmbedInput({ onAddEmbed, disabled }: EmbedInputProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || disabled) return;

    setIsSubmitting(true);
    try {
      onAddEmbed(url.trim());
      setUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    if (url.includes('twitter.com') || url.includes('x.com')) {
      return '✓ Valid X.com post URL';
    }
    if (url.includes('instagram.com')) {
      return '✓ Valid Instagram post URL';
    }
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return '✓ Valid image URL';
    }
    return 'Paste X.com, Instagram, or image URL...';
  };

  const isValidUrl = () => {
    const trimmedUrl = url.trim();
    return (
      trimmedUrl.includes('twitter.com') ||
      trimmedUrl.includes('x.com') ||
      trimmedUrl.includes('instagram.com') ||
      trimmedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={getPlaceholder()}
        className="flex-1 min-w-0 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
        disabled={disabled || isSubmitting}
      />
      <button
        type="submit"
        disabled={!url.trim() || !isValidUrl() || disabled || isSubmitting}
        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors text-sm whitespace-nowrap flex-shrink-0"
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
