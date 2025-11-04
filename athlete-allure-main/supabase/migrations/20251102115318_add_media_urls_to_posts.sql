-- Add media_urls array column to posts table for multi-photo support
ALTER TABLE public.posts ADD COLUMN media_urls TEXT[] DEFAULT '{}';

-- Update existing posts to have media_url in the array
UPDATE public.posts SET media_urls = ARRAY[media_url] WHERE media_url IS NOT NULL;

-- Make media_urls non-nullable after migration
ALTER TABLE public.posts ALTER COLUMN media_urls SET NOT NULL;
