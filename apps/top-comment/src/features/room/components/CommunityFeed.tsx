import { useState, useCallback } from 'react';
import { EmbedPreview } from '../../../shared/components/EmbedPreview';
import { EmbedInput } from '../../../shared/components/EmbedInput';

interface CommunityPost {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  likes: number;
  embeds?: Array<{
    type: 'instagram' | 'twitter' | 'image';
    url: string;
    html?: string;
  }>;
}

interface CommunityFeedProps {
  roomId: string;
  membershipId?: string;
  displayName: string;
  isMember: boolean;
  onJoinRoom?: () => void;
}

export function CommunityFeed({ roomId: _roomId, membershipId, displayName, isMember, onJoinRoom }: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      content: 'Having an amazing time in this room! The vibes are impeccable 🎵✨',
      authorName: 'DJMike',
      authorId: 'user1',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      likes: 12,
      embeds: [
        {
          type: 'instagram',
          url: 'https://instagram.com/p/example',
          html: '<blockquote class="instagram-media" data-instgrm-permalink="https://instagram.com/p/example"></blockquote>'
        }
      ]
    },
    {
      id: '2',
      content: 'This session is fire! 🔥 Who else is feeling the energy tonight?',
      authorName: 'MusicLover92',
      authorId: 'user2',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      likes: 8
    },
    {
      id: '3',
      content: 'The host really knows how to read the room. Perfect track selection! 🎧',
      authorName: 'BeatDropper',
      authorId: 'user3',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      likes: 15,
      embeds: [
        {
          type: 'twitter',
          url: 'https://twitter.com/user/status/example',
          html: '<blockquote class="twitter-tweet"><p>Amazing music session!</p></blockquote>'
        }
      ]
    }
  ]);

  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [embedUrls, setEmbedUrls] = useState<string[]>([]);

  const handleAddEmbed = useCallback((url: string) => {
    setEmbedUrls(prev => [...prev, url]);
  }, []);

  const handleRemoveEmbed = useCallback((urlToRemove: string) => {
    setEmbedUrls(prev => prev.filter(url => url !== urlToRemove));
  }, []);

  const getEmbedType = useCallback((url: string): 'instagram' | 'twitter' | 'image' => {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'image';
  }, []);

  const handlePost = useCallback(async () => {
    if (!newPost.trim() || !isMember) return;

    setIsPosting(true);
    
    // Create embed objects from URLs
    const embedObjects = embedUrls.map(url => ({
      type: getEmbedType(url),
      url,
      html: undefined
    }));
    
    // Simulate posting
    const post: CommunityPost = {
      id: Date.now().toString(),
      content: newPost,
      authorName: displayName,
      authorId: membershipId || 'anonymous',
      createdAt: new Date().toISOString(),
      likes: 0,
      embeds: embedObjects.length > 0 ? embedObjects : undefined
    };

    setPosts(prev => [post, ...prev]);
    setNewPost('');
    setEmbedUrls([]);
    setIsPosting(false);
  }, [newPost, isMember, displayName, membershipId, embedUrls, getEmbedType]);

  const handleLike = useCallback((postId: string) => {
    if (!isMember) {
      onJoinRoom?.();
      return;
    }

    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  }, [isMember, onJoinRoom]);

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-full box-border">
      {/* Post Input */}
      <div className="border-b border-slate-700 p-3 w-full max-w-full box-border">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={isMember ? "What's happening in the room?" : "Join the room to post"}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
              rows={2}
              disabled={!isMember || isPosting}
            />
          </div>
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || !isMember || isPosting}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors flex-shrink-0 text-sm"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Embed Input */}
        {isMember && (
          <div className="mb-3">
            <EmbedInput
              onAddEmbed={handleAddEmbed}
              disabled={isPosting}
            />
          </div>
        )}

        {/* Embed Previews */}
        {embedUrls.length > 0 && (
          <div className="space-y-2 mb-3 max-w-full">
            {embedUrls.map((url, index) => (
              <EmbedPreview
                key={index}
                url={url}
                onRemove={() => handleRemoveEmbed(url)}
              />
            ))}
          </div>
        )}

        {!isMember && (
          <p className="text-xs text-slate-400">
            <button onClick={onJoinRoom} className="text-cyan-400 hover:underline">
              Join the room
            </button>{' '}
            to participate in the community feed
          </p>
        )}
      </div>

      {/* Posts Feed */}
      <div className="divide-y divide-slate-700 w-full max-w-full box-border">
        {posts.map((post) => (
          <article key={post.id} className="p-3 hover:bg-slate-800/50 transition-colors">
            <div className="flex gap-3 min-w-0 max-w-full items-start sm:items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-white text-sm truncate">{post.authorName}</span>
                  <span className="text-slate-400 text-xs">·</span>
                  <span className="text-slate-400 text-xs">{formatTimeAgo(post.createdAt)}</span>
                </div>
                
                <div className="text-white mb-3 whitespace-pre-wrap text-sm break-words">{post.content}</div>
              </div>
            </div>

            {/* Embeds - outside the main content flex */}
            {post.embeds && post.embeds.length > 0 && (
              <div className="mb-3 space-y-2 max-w-full">
                {post.embeds.map((embed, index) => (
                  <EmbedPreview
                    key={index}
                    url={embed.url}
                  />
                ))}
              </div>
            )}

            {/* Actions - below embeds */}
            <div className="flex items-center gap-4 flex-wrap px-3">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <span className="text-xs">❤️</span>
                <span className="text-xs">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                <span className="text-xs">💬</span>
                <span className="text-xs">Reply</span>
              </button>
              <button className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                <span className="text-xs">🔗</span>
                <span className="text-xs">Share</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
          <p className="text-slate-400 mb-4">Be the first to share something with the community!</p>
          {isMember ? (
            <p className="text-sm text-slate-400">Start a conversation above 👆</p>
          ) : (
            <button
              onClick={onJoinRoom}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
            >
              Join Room to Post
            </button>
          )}
        </div>
      )}
    </div>
  );
}
