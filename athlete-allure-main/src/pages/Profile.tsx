import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MapPin, Trophy, Users, Image as ImageIcon, Edit, Camera, Upload, UserPlus, UserMinus, MoreVertical, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PostCard from "@/components/PostCard";

interface ProfileProps {
  currentUserId: string;
}

const Profile = ({ currentUserId }: ProfileProps) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    if (!isOwnProfile) {
      checkFollowing();
    }
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            username,
            full_name,
            profile_image_url
          )
        `)
        .eq("following_id", userId);

      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            profile_image_url
          )
        `)
        .eq("follower_id", userId);

      if (error) throw error;
      setFollowing(data || []);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  const openEditDialog = () => {
    setEditingProfile({
      full_name: profile?.full_name || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      sport: profile?.sport || "other",
      profile_image_url: profile?.profile_image_url || "",
    });
    setEditDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update profile directly in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          profile_image_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast({
        title: "Profile photo updated!",
        description: "Your profile photo has been updated successfully.",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile photo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editingProfile.full_name,
          bio: editingProfile.bio,
          location: editingProfile.location,
          sport: editingProfile.sport,
          profile_image_url: editingProfile.profile_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });

      setEditDialogOpen(false);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

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
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
    }
  };

  const checkFollowing = async () => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: userId });

        if (error) throw error;
        setIsFollowing(true);
      }
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost || deletingPost) return;

    setDeletingPost(true);
    try {
      // Delete the post
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", selectedPost.id)
        .eq("user_id", currentUserId); // Ensure user can only delete their own posts

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      });

      // Close modals and refresh posts
      setShowDeleteDialog(false);
      setShowPostModal(false);
      setSelectedPost(null);
      fetchPosts();
      fetchProfile(); // Update post count
    } catch (error: any) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingPost(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden card-gradient">
        <div className="h-48 bg-gradient-hero relative">
          {profile?.cover_image_url && (
            <img
              src={profile.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
                <AvatarImage src={profile?.profile_image_url} />
                <AvatarFallback className="bg-gradient-primary text-white text-4xl font-bold">
                  {profile?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                  title="Update profile photo"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 text-center sm:text-left sm:mt-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
                {profile?.is_verified && (
                  <Badge className="bg-gradient-primary text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">@{profile?.username}</p>
            </div>
            {isOwnProfile && (
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={openEditDialog}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editingProfile.full_name || ""}
                        onChange={(e) => setEditingProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        value={editingProfile.bio || ""}
                        onChange={(e) => setEditingProfile(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editingProfile.location || ""}
                        onChange={(e) => setEditingProfile(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Your location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sport">Sport</Label>
                      <select
                        id="sport"
                        value={editingProfile.sport || "other"}
                        onChange={(e) => setEditingProfile(prev => ({ ...prev, sport: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="basketball">Basketball</option>
                        <option value="soccer">Soccer</option>
                        <option value="tennis">Tennis</option>
                        <option value="running">Running</option>
                        <option value="swimming">Swimming</option>
                        <option value="cycling">Cycling</option>
                        <option value="volleyball">Volleyball</option>
                        <option value="baseball">Baseball</option>
                        <option value="football">Football</option>
                        <option value="hockey">Hockey</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full gradient-primary text-white"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {!isOwnProfile && (
              <Button
                onClick={handleFollow}
                className={
                  isFollowing
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : "gradient-primary text-white"
                }
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {profile?.bio && (
              <p className="text-foreground">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              {profile?.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              {profile?.sport && (
                <Badge variant="secondary" className="capitalize">
                  {profile.sport.replace("_", " ")}
                </Badge>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold text-foreground">{profile?.posts_count}</span>
                <span className="text-muted-foreground ml-1">posts</span>
              </div>
              <button
                onClick={() => {
                  setShowFollowers(true);
                  fetchFollowers();
                }}
                className="hover:text-primary transition-colors"
              >
                <span className="font-bold text-foreground">{profile?.followers_count}</span>
                <span className="text-muted-foreground ml-1">followers</span>
              </button>
              <button
                onClick={() => {
                  setShowFollowing(true);
                  fetchFollowing();
                }}
                className="hover:text-primary transition-colors"
              >
                <span className="font-bold text-foreground">{profile?.following_count}</span>
                <span className="text-muted-foreground ml-1">following</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-6">
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Posts</h2>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
              const mediaUrls = post.media_urls && post.media_urls.length > 0
                ? post.media_urls
                : [post.media_url];
              const hasMultipleImages = mediaUrls.length > 1;

              return (
                <div
                  key={post.id}
                  className="aspect-square overflow-hidden rounded-lg hover-lift cursor-pointer relative"
                  onClick={() => {
                    setSelectedPost(post);
                    setShowPostModal(true);
                  }}
                >
                  <img
                    src={mediaUrls[0]}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  {hasMultipleImages && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {mediaUrls.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {followers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No followers yet</p>
            ) : (
              followers.map((follow) => (
                <div key={follow.follower_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={follow.profiles?.profile_image_url} />
                    <AvatarFallback>
                      {follow.profiles?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{follow.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{follow.profiles?.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/profile/${follow.follower_id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {following.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Not following anyone yet</p>
            ) : (
              following.map((follow) => (
                <div key={follow.following_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={follow.profiles?.profile_image_url} />
                    <AvatarFallback>
                      {follow.profiles?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{follow.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{follow.profiles?.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/profile/${follow.following_id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-white border-0 shadow-2xl">
          {selectedPost && (
            <div className="relative bg-white rounded-lg">
              <button
                onClick={() => setShowPostModal(false)}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
              {isOwnProfile && (
                <div className="absolute top-4 left-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 text-white rounded-full w-10 h-10 hover:bg-black/70 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <div className="p-6">
                <PostCard
                  post={selectedPost}
                  currentUserId={currentUserId}
                  onLikeUpdate={fetchPosts}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deletingPost}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePost}
                disabled={deletingPost}
              >
                {deletingPost ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
