import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';

interface CommunityPost {
  id: string;
  room_id: string;
  membership_id: string;
  content: string;
  likes: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  author_name: string;
  author_avatar?: string;
  embeds?: PostEmbed[];
  user_liked?: boolean;
}

interface PostEmbed {
  id: string;
  post_id: string;
  embed_type: 'instagram' | 'twitter' | 'image' | 'youtube' | 'tiktok';
  url: string;
  html_content?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  created_at: string;
}

interface PostReply {
  id: string;
  post_id: string;
  membership_id: string;
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  author_name: string;
  author_avatar?: string;
  user_liked?: boolean;
}

interface UseCommunityPostsOptions {
  roomId: string;
  membershipId?: string;
  limit?: number;
}

export function useCommunityPosts({ roomId, membershipId, limit = 50 }: UseCommunityPostsOptions) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch posts
  const fetchPosts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('community_posts')
        .select(`
          *,
          room_memberships!inner(
            player_name,
            user_metadata
          ),
          post_embeds(*),
          post_likes(membership_id)
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!reset && posts.length > 0) {
        // For pagination, get posts older than the last one
        const lastPost = posts[posts.length - 1];
        query = query.lt('created_at', lastPost.created_at);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const processedPosts: CommunityPost[] = (data || []).map((post: any) => ({
        ...post,
        author_name: post.room_memberships.player_name || 'Anonymous',
        author_avatar: post.room_memberships.user_metadata?.avatar_url,
        embeds: post.post_embeds || [],
        user_liked: post.post_likes?.some((like: any) => like.membership_id === membershipId) || false
      }));

      if (reset) {
        setPosts(processedPosts);
      } else {
        setPosts(prev => [...prev, ...processedPosts]);
      }

      setHasMore(processedPosts.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [roomId, membershipId, limit, posts.length]);

  // Create a new post
  const createPost = useCallback(async (content: string, embeds?: Omit<PostEmbed, 'id' | 'post_id' | 'created_at'>[]) => {
    if (!membershipId) throw new Error('Must be a room member to post');

    try {
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .insert({
          room_id: roomId,
          membership_id: membershipId,
          content: content.trim()
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add embeds if provided
      if (embeds && embeds.length > 0) {
        const embedData = embeds.map(embed => ({
          post_id: postData.id,
          embed_type: embed.embed_type,
          url: embed.url,
          html_content: embed.html_content,
          thumbnail_url: embed.thumbnail_url,
          title: embed.title,
          description: embed.description
        }));

        const { error: embedError } = await supabase
          .from('post_embeds')
          .insert(embedData);

        if (embedError) throw embedError;
      }

      // Refresh posts to get the new one
      await fetchPosts(true);
      
      return postData;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create post');
    }
  }, [roomId, membershipId, fetchPosts]);

  // Like/unlike a post
  const toggleLike = useCallback(async (postId: string) => {
    if (!membershipId) throw new Error('Must be a room member to like posts');

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('membership_id', membershipId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('membership_id', membershipId);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            membership_id: membershipId
          });
      }

      // Update local state optimistically
      setPosts(prev => prev.map((post: any) => 
        post.id === postId 
          ? { 
              ...post, 
              likes: existingLike ? Math.max(post.likes - 1, 0) : post.likes + 1,
              user_liked: !existingLike
            }
          : post
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle like');
    }
  }, [membershipId]);

  // Delete a post
  const deletePost = useCallback(async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_deleted: true })
        .eq('id', postId);

      if (error) throw error;

      // Remove from local state
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete post');
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`community_posts:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: `room_id=eq.${roomId}`
        },
        async (payload: any) => {
          if (payload.eventType === 'INSERT' && !payload.new.is_deleted) {
            // New post added - fetch the complete post with author info
            const { data } = await supabase
              .from('community_posts')
              .select(`
                *,
                room_memberships!inner(
                  player_name,
                  user_metadata
                ),
                post_embeds(*),
                post_likes(membership_id)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const newPost: CommunityPost = {
                ...data,
                author_name: data.room_memberships.player_name || 'Anonymous',
                author_avatar: data.room_memberships.user_metadata?.avatar_url,
                embeds: data.post_embeds || [],
                user_liked: data.post_likes?.some((like: any) => like.membership_id === membershipId) || false
              };

              setPosts(prev => [newPost, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_deleted) {
              // Post was deleted
              setPosts(prev => prev.filter(post => post.id !== payload.new.id));
            } else {
              // Post was updated (like count, etc.)
              setPosts(prev => prev.map(post => 
                post.id === payload.new.id 
                  ? { ...post, ...payload.new }
                  : post
              ));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, membershipId]);

  // Initial fetch
  useEffect(() => {
    if (roomId) {
      fetchPosts(true);
    }
  }, [roomId, fetchPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    createPost,
    toggleLike,
    deletePost,
    loadMore: () => fetchPosts(false),
    refresh: () => fetchPosts(true)
  };
}

export function usePostReplies(postId: string, membershipId?: string) {
  const [replies, setReplies] = useState<PostReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReplies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('post_replies')
        .select(`
          *,
          room_memberships!inner(
            player_name,
            user_metadata
          ),
          reply_likes(membership_id)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const processedReplies: PostReply[] = (data || []).map((reply: any) => ({
        ...reply,
        author_name: reply.room_memberships.player_name || 'Anonymous',
        author_avatar: reply.room_memberships.user_metadata?.avatar_url,
        user_liked: reply.reply_likes?.some((like: any) => like.membership_id === membershipId) || false
      }));

      setReplies(processedReplies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch replies');
    } finally {
      setLoading(false);
    }
  }, [postId, membershipId]);

  const createReply = useCallback(async (content: string) => {
    if (!membershipId) throw new Error('Must be a room member to reply');

    try {
      const { data, error } = await supabase
        .from('post_replies')
        .insert({
          post_id: postId,
          membership_id: membershipId,
          content: content.trim()
        })
        .select(`
          *,
          room_memberships!inner(
            player_name,
            user_metadata
          )
        `)
        .single();

      if (error) throw error;

      const newReply: PostReply = {
        ...data,
        author_name: data.room_memberships.player_name || 'Anonymous',
        author_avatar: data.room_memberships.user_metadata?.avatar_url,
        user_liked: false
      };

      setReplies(prev => [...prev, newReply]);
      return newReply;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create reply');
    }
  }, [postId, membershipId]);

  const toggleReplyLike = useCallback(async (replyId: string) => {
    if (!membershipId) throw new Error('Must be a room member to like replies');

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('reply_likes')
        .select('id')
        .eq('reply_id', replyId)
        .eq('membership_id', membershipId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('reply_likes')
          .delete()
          .eq('reply_id', replyId)
          .eq('membership_id', membershipId);
      } else {
        // Like
        await supabase
          .from('reply_likes')
          .insert({
            reply_id: replyId,
            membership_id: membershipId
          });
      }

      // Update local state optimistically
      setReplies(prev => prev.map(reply => 
        reply.id === replyId 
          ? { 
              ...reply, 
              likes: existingLike ? Math.max(reply.likes - 1, 0) : reply.likes + 1,
              user_liked: !existingLike
            }
          : reply
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle reply like');
    }
  }, [membershipId]);

  // Real-time subscription for replies
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`post_replies:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_replies',
          filter: `post_id=eq.${postId}`
        },
        async (payload: any) => {
          if (payload.eventType === 'INSERT' && !payload.new.is_deleted) {
            // New reply added
            const { data } = await supabase
              .from('post_replies')
              .select(`
                *,
                room_memberships!inner(
                  player_name,
                  user_metadata
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const newReply: PostReply = {
                ...data,
                author_name: data.room_memberships.player_name || 'Anonymous',
                author_avatar: data.room_memberships.user_metadata?.avatar_url,
                user_liked: false
              };

              setReplies(prev => [...prev, newReply]);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new.is_deleted) {
            // Reply was deleted
            setReplies(prev => prev.filter(reply => reply.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchReplies();
    }
  }, [postId, fetchReplies]);

  return {
    replies,
    loading,
    error,
    createReply,
    toggleReplyLike,
    refresh: fetchReplies
  };
}
