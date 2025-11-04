import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Leaderboard = () => {
  const [topAthletes, setTopAthletes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("followers_count", { ascending: false })
      .limit(50);

    setTopAthletes(data || []);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-700" />;
    return null;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (index === 1) return "bg-gradient-to-r from-gray-300 to-gray-500";
    if (index === 2) return "bg-gradient-to-r from-amber-600 to-amber-800";
    return "bg-muted";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-gradient">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">
          Top athletes ranked by followers and engagement
        </p>
      </div>

      <div className="space-y-3">
        {topAthletes.map((athlete, index) => (
          <Card
            key={athlete.id}
            className={`card-gradient hover-lift cursor-pointer transition-all ${
              index < 3 ? "shadow-glow" : ""
            }`}
            onClick={() => navigate(`/profile/${athlete.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 min-w-[80px]">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getRankBadge(
                      index
                    )}`}
                  >
                    {index < 3 ? getRankIcon(index) : index + 1}
                  </div>
                </div>

                <Avatar className="w-14 h-14 border-2 border-primary/50">
                  <AvatarImage src={athlete.profile_image_url} />
                  <AvatarFallback className="bg-gradient-primary text-white text-lg font-bold">
                    {athlete.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{athlete.full_name}</h3>
                    {athlete.is_verified && (
                      <Badge className="bg-gradient-primary text-white text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{athlete.username}</p>
                  {athlete.sport && (
                    <Badge variant="secondary" className="mt-1 capitalize text-xs">
                      {athlete.sport.replace("_", " ")}
                    </Badge>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {athlete.followers_count}
                    </div>
                    <div className="text-xs text-muted-foreground">followers</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {athlete.posts_count} posts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
