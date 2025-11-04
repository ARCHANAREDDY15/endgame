import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Image as ImageIcon, Hash } from "lucide-react";

interface CreatePostProps {
  userId: string;
}

const CreatePost = ({ userId }: CreatePostProps) => {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0 && files.length + selectedFiles.length <= 5) {
      const newFiles = [...files, ...selectedFiles];
      setFiles(newFiles);

      const newPreviews: string[] = [];
      selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === selectedFiles.length) {
            setPreviews([...previews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    } else if (selectedFiles.length > 0) {
      toast({
        title: "Too many files",
        description: "You can upload up to 5 photos per post",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // Upload all files
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Create a single post with multiple media URLs
      const { data: postData, error: insertError } = await supabase.from("posts").insert({
        user_id: userId,
        caption,
        media_urls: uploadedUrls,
        media_url: uploadedUrls[0], // Keep for backward compatibility
        media_type: "image",
      }).select().single();

      if (insertError) throw insertError;

      // Add tags if any
      if (tags.length > 0 && postData) {
        const tagInserts = tags.map(tagName => ({
          post_id: postData.id,
          tag_id: supabase.rpc('create_tag_if_not_exists', { tag_name: tagName })
        }));

        // First create tags, then link them
        for (const tag of tags) {
          const { data: tagData, error: tagError } = await supabase.rpc('create_tag_if_not_exists', { tag_name: tag });
          if (tagError) throw tagError;

          const { error: linkError } = await supabase.from("post_tags").insert({
            post_id: postData.id,
            tag_id: tagData
          });

          if (linkError) throw linkError;
        }
      }

      toast({
        title: "Post created!",
        description: `Your ${files.length > 1 ? files.length + ' photos have' : 'photo has'} been shared successfully${tags.length > 0 ? ` with ${tags.length} tag${tags.length > 1 ? 's' : ''}` : ''}`,
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gradient">
            Create New Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="file-upload"
                className="block w-full cursor-pointer"
              >
                {previews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/50 hover:border-primary transition-colors">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 bg-muted/50">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Add more</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-4 bg-muted/50">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload Images</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select up to 5 photos
                      </p>
                    </div>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[120px] resize-none input-premium text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                <label className="text-sm font-semibold text-white">Tags (optional)</label>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 rounded-full text-sm text-cyan-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-cyan-400 hover:text-cyan-200 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tags (press Enter or comma to add)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1 input-premium text-white placeholder:text-gray-500 text-sm"
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                  className="btn-premium text-black font-semibold px-4"
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {tags.length}/10 tags • Tag teammates, goals, or sports (e.g., #basketball, #johnsmith, #championship)
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={uploading || files.length === 0}
                className="flex-1 gradient-hero text-white font-semibold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Share {files.length > 1 ? `${files.length} Photos` : 'Post'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;
