-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'like',
  'comment',
  'follow',
  'mention',
  'achievement'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Function to create like notifications
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  sender_profile RECORD;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Don't create notification if user likes their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get sender profile info
  SELECT username INTO sender_profile
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notification
  INSERT INTO public.notifications (recipient_id, sender_id, type, post_id, message)
  VALUES (
    post_owner_id,
    NEW.user_id,
    'like',
    NEW.post_id,
    sender_profile.username || ' liked your post'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create comment notifications
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  sender_profile RECORD;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Don't create notification if user comments on their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get sender profile info
  SELECT username INTO sender_profile
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notification
  INSERT INTO public.notifications (recipient_id, sender_id, type, post_id, comment_id, message)
  VALUES (
    post_owner_id,
    NEW.user_id,
    'comment',
    NEW.post_id,
    NEW.id,
    sender_profile.username || ' commented on your post'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create follow notifications
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
BEGIN
  -- Get sender profile info
  SELECT username INTO sender_profile
  FROM public.profiles
  WHERE id = NEW.follower_id;

  -- Create notification
  INSERT INTO public.notifications (recipient_id, sender_id, type, message)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    sender_profile.username || ' started following you'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for notifications
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.create_like_notification();

CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.create_follow_notification();

-- Create indexes
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
