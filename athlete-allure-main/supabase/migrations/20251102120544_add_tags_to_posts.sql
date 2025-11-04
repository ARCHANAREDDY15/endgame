-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create post_tags junction table
CREATE TABLE public.post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_post_tags_post_id ON public.post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON public.post_tags(tag_id);
CREATE INDEX idx_tags_name ON public.tags(name);

-- Function to create tag if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_tag_if_not_exists(tag_name TEXT)
RETURNS UUID AS $$
DECLARE
  tag_id UUID;
BEGIN
  -- Try to find existing tag
  SELECT id INTO tag_id FROM public.tags WHERE name = tag_name;

  -- If not found, create new tag
  IF tag_id IS NULL THEN
    INSERT INTO public.tags (name) VALUES (tag_name) RETURNING id INTO tag_id;
  END IF;

  RETURN tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Tags are viewable by everyone" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create tags" ON public.tags
  FOR INSERT WITH CHECK (true);

-- RLS Policies for post_tags
CREATE POLICY "Post tags are viewable by everyone" ON public.post_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can create post tags for their posts" ON public.post_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_tags.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete post tags for their posts" ON public.post_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_tags.post_id
      AND posts.user_id = auth.uid()
    )
  );
