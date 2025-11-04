import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/PostCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface FeedProps {
  userId: string;
}

const Feed = ({ userId }: FeedProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (
            id,
            username,
            profile_image_url,
            sport
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">No posts yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Follow athletes or create your first post!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in bw-particle-bg">
      {posts.map((post, index) => (
        <div key={post.id} className="bw-stagger" style={{ animationDelay: `${index * 0.2}s` }}>
          <PostCard
            post={post}
            currentUserId={userId}
            onLikeUpdate={fetchPosts}
          />
        </div>
      ))}
    </div>
  );
};

export default Feed;
