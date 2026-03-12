-- Community Posts Schema
-- Create table for community posts within rooms

-- Table for community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Content validation
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  CONSTRAINT likes_non_negative CHECK (likes >= 0),
  CONSTRAINT reply_count_non_negative CHECK (reply_count >= 0)
);

-- Table for post embeds (Instagram, Twitter, images, etc.)
CREATE TABLE IF NOT EXISTS public.post_embeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  embed_type TEXT NOT NULL CHECK (embed_type IN ('instagram', 'twitter', 'image', 'youtube', 'tiktok')),
  url TEXT NOT NULL,
  html_content TEXT,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- URL validation
  CONSTRAINT valid_url CHECK (url ~* '^https?://.*')
);

-- Table for post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate likes
  UNIQUE(post_id, membership_id)
);

-- Table for post replies
CREATE TABLE IF NOT EXISTS public.post_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Content validation
  CONSTRAINT reply_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  CONSTRAINT reply_likes_non_negative CHECK (likes >= 0)
);

-- Table for reply likes
CREATE TABLE IF NOT EXISTS public.reply_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID NOT NULL REFERENCES public.post_replies(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate likes
  UNIQUE(reply_id, membership_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_room_created ON public.community_posts(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_membership ON public.community_posts(membership_id);
CREATE INDEX IF NOT EXISTS idx_post_embeds_post ON public.post_embeds(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_membership ON public.post_likes(membership_id);
CREATE INDEX IF NOT EXISTS idx_post_replies_post_created ON public.post_replies(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_replies_membership ON public.post_replies(membership_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply ON public.reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_membership ON public.reply_likes(membership_id);

-- RLS (Row Level Security) Policies

-- Community posts can be viewed by anyone in the room
CREATE POLICY "Community posts are viewable by room members" ON public.community_posts
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Only room members can create posts
CREATE POLICY "Room members can create posts" ON public.community_posts
  FOR INSERT WITH CHECK (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid() AND room_id = community_posts.room_id
    )
  );

-- Users can only update their own posts
CREATE POLICY "Users can update own posts" ON public.community_posts
  FOR UPDATE USING (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Users can only delete their own posts (or room hosts can delete any post)
CREATE POLICY "Users can delete own posts, hosts can delete any" ON public.community_posts
  FOR DELETE USING (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    ) OR
    room_id IN (
      SELECT id FROM public.rooms 
      WHERE host_uid = auth.uid()
    )
  );

-- Embeds inherit the same policies as posts
CREATE POLICY "Embeds are viewable with posts" ON public.post_embeds
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.community_posts 
      WHERE room_id IN (
        SELECT room_id FROM public.room_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Only post authors can add embeds
CREATE POLICY "Post authors can create embeds" ON public.post_embeds
  FOR INSERT WITH CHECK (
    post_id IN (
      SELECT id FROM public.community_posts 
      WHERE membership_id IN (
        SELECT id FROM public.room_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Post likes policies
CREATE POLICY "Post likes are viewable by room members" ON public.post_likes
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.community_posts 
      WHERE room_id IN (
        SELECT room_id FROM public.room_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Room members can like posts
CREATE POLICY "Room members can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    ) AND
    post_id IN (
      SELECT id FROM public.community_posts 
      WHERE room_id IN (
        SELECT room_id FROM public.room_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can only remove their own likes
CREATE POLICY "Users can delete own likes" ON public.post_likes
  FOR DELETE USING (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Similar policies for replies and reply likes
CREATE POLICY "Replies are viewable by room members" ON public.post_replies
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.community_posts 
      WHERE room_id IN (
        SELECT room_id FROM public.room_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Room members can create replies" ON public.post_replies
  FOR INSERT WITH CHECK (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    ) AND
    post_id IN (
      SELECT id FROM public.community_posts 
      WHERE room_id IN (
        SELECT room_id FROM public.room_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own replies" ON public.post_replies
  FOR UPDATE USING (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own replies" ON public.post_replies
  FOR DELETE USING (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Reply likes are viewable by room members" ON public.reply_likes
  FOR SELECT USING (
    reply_id IN (
      SELECT id FROM public.post_replies 
      WHERE post_id IN (
        SELECT id FROM public.community_posts 
        WHERE room_id IN (
          SELECT room_id FROM public.room_memberships 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Room members can like replies" ON public.reply_likes
  FOR INSERT WITH CHECK (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reply likes" ON public.reply_likes
  FOR DELETE USING (
    membership_id IN (
      SELECT id FROM public.room_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on all tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;

-- Functions and triggers for updated_at and like counting

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_post_replies_updated_at
  BEFORE UPDATE ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update post like count
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET likes = likes + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET likes = GREATEST(likes - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post like counting
CREATE TRIGGER update_post_like_count_on_insert
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

CREATE TRIGGER update_post_like_count_on_delete
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

-- Function to update reply like count
CREATE OR REPLACE FUNCTION public.update_reply_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_replies 
    SET likes = likes + 1 
    WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_replies 
    SET likes = GREATEST(likes - 1, 0) 
    WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reply like counting
CREATE TRIGGER update_reply_like_count_on_insert
  AFTER INSERT ON public.reply_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_reply_like_count();

CREATE TRIGGER update_reply_like_count_on_delete
  AFTER DELETE ON public.reply_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_reply_like_count();

-- Function to update reply count
CREATE OR REPLACE FUNCTION public.update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET reply_count = GREATEST(reply_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reply counting
CREATE TRIGGER update_post_reply_count_on_insert
  AFTER INSERT ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_post_reply_count();

CREATE TRIGGER update_post_reply_count_on_delete
  AFTER DELETE ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_post_reply_count();

-- Grant permissions
GRANT ALL ON public.community_posts TO authenticated;
GRANT ALL ON public.post_embeds TO authenticated;
GRANT ALL ON public.post_likes TO authenticated;
GRANT ALL ON public.post_replies TO authenticated;
GRANT ALL ON public.reply_likes TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
