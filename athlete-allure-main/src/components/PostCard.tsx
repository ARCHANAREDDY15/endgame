import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Send, X, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onLikeUpdate?: () => void;
}

const PostCard = ({ post, currentUserId, onLikeUpdate }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tags, setTags] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get media URLs - support both single and multiple images
  const mediaUrls = post.media_urls && post.media_urls.length > 0
    ? post.media_urls
    : [post.media_url];

  useEffect(() => {
    checkIfLiked();
    fetchTags();
  }, []);

  const checkIfLiked = async () => {
    try {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("post_id", post.id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      setIsLiked(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("post_tags")
        .select(`
          tags (
            id,
            name
          )
        `)
        .eq("post_id", post.id);

      if (error) throw error;
      setTags(data?.map(item => item.tags) || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", post.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: currentUserId, post_id: post.id });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
      onLikeUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles (
            username,
            profile_image_url
          )
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || commentLoading) return;

    setCommentLoading(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          user_id: currentUserId,
          post_id: post.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      onLikeUpdate?.(); // Refresh post data to update comment count
    } catch (error: any) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShowComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };

  return (
    <Card className="w-full bw-card overflow-hidden group relative bw-dynamic-bg">

      <CardContent className="p-0">
        <div className="p-6 flex items-center gap-5">
          <Avatar
            className="w-14 h-14 border-4 border-white cursor-pointer ring-4 ring-blue-100 shadow-xl hover:ring-blue-200 transition-all duration-300 hover:scale-105"
            onClick={() => navigate(`/profile/${post.profiles?.id}`)}
          >
            <AvatarImage src={post.profiles?.profile_image_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-black text-xl">
              {post.profiles?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p
              className="font-semibold text-black hover:text-black hover:font-bold cursor-pointer transition-all duration-200"
              onClick={() => navigate(`/profile/${post.profiles?.id}`)}
            >
              {post.profiles?.username}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                {post.profiles?.sport?.replace("_", " ")}
              </span>
              <span className="text-sm text-gray-400 font-medium">•</span>
              <span className="text-sm text-gray-500 font-medium">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden bw-particle-bg">
          <img
            src={mediaUrls[currentImageIndex]}
            alt="Post"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600"></div>

          {/* Navigation arrows for multiple images */}
          {mediaUrls.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Image indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {post.caption && (
          <div className="p-5">
            <p className="text-base leading-relaxed">
              <span className="font-bold mr-2 text-black hover:text-primary cursor-pointer transition-colors" onClick={() => navigate(`/profile/${post.profiles?.id}`)}>
                {post.profiles?.username}
              </span>
              <span className="text-black">{post.caption}</span>
            </p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Hash className="w-4 h-4 text-cyan-400" />
              {tags.map((tag, index) => (
                <button
                  key={tag.id}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag.name)}`)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline"
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 p-5 pt-0">
        <div className="flex items-center gap-6 w-full">
          <Button
            variant="ghost"
            size="sm"
            className={`hover:text-red-500 transition-all duration-200 hover:scale-110 ${
              isLiked ? "text-red-500" : "text-gray-700"
            }`}
            onClick={handleLike}
            disabled={loading}
          >
            <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""} transition-all duration-200`} />
          </Button>
          <Dialog open={showComments} onOpenChange={setShowComments}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:text-blue-500 transition-all duration-200 hover:scale-110 text-gray-700"
                onClick={handleShowComments}
              >
                <MessageCircle className="w-6 h-6 transition-all duration-200" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden glass-morphism border-0 shadow-2xl">
              <DialogHeader className="border-b border-gray-100 pb-4">
                <DialogTitle className="text-xl font-bold text-center">Comments</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Post Preview */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                    <AvatarImage src={post.profiles?.profile_image_url} />
                    <AvatarFallback className="bg-gradient-primary text-white font-bold">
                      {post.profiles?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 hover:text-primary cursor-pointer transition-colors">
                      {post.profiles?.username}
                    </p>
                    {post.caption && (
                      <p className="text-sm text-gray-600 leading-relaxed mt-1">{post.caption}</p>
                    )}
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No comments yet</p>
                      <p className="text-sm text-gray-400 mt-1">Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    comments.map((comment, index) => (
                      <div key={comment.id} className={`flex items-start gap-4 stagger-animation`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <Avatar className="w-10 h-10 ring-2 ring-gray-100 shadow-sm">
                          <AvatarImage src={comment.profiles?.profile_image_url} />
                          <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm">
                            {comment.profiles?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                            <p className="font-bold text-gray-900 hover:text-primary cursor-pointer transition-colors">
                              {comment.profiles?.username}
                            </p>
                            <p className="text-gray-700 leading-relaxed mt-1">{comment.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 ml-1 font-medium">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 px-6 py-4 rounded-b-xl">
                  <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                    <AvatarImage src={post.profiles?.profile_image_url} />
                    <AvatarFallback className="bg-gradient-primary text-white font-bold text-xs">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-3">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                      disabled={commentLoading}
                      className="bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-full px-4 py-2 text-sm"
                    />
                    <Button
                      onClick={handleComment}
                      disabled={!newComment.trim() || commentLoading}
                      size="sm"
                      className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {commentLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Posting...</span>
                        </div>
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-green-500 transition-all duration-200 hover:scale-110 text-gray-700 ml-auto"
          >
            <Send className="w-6 h-6 transition-all duration-200" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-900">
            {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
          </span>
          {post.comments_count > 0 && (
            <button
              onClick={handleShowComments}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              View all {post.comments_count} comments
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
