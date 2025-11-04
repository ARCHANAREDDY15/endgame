import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [athletes, setAthletes] = useState<any[]>([]);
  const [topAthletes, setTopAthletes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopAthletes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchAthletes();
    } else {
      setAthletes([]);
    }
  }, [searchQuery]);

  const fetchTopAthletes = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("followers_count", { ascending: false })
      .limit(10);

    setTopAthletes(data || []);
  };

  const searchAthletes = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(20);

    setAthletes(data || []);
  };

  const AthleteCard = ({ athlete }: { athlete: any }) => (
    <Card
      className="card-gradient hover-lift cursor-pointer"
      onClick={() => navigate(`/profile/${athlete.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/50">
            <AvatarImage src={athlete.profile_image_url} />
            <AvatarFallback className="bg-gradient-primary text-white text-xl font-bold">
              {athlete.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{athlete.full_name}</h3>
              {athlete.is_verified && (
                <Badge className="bg-gradient-primary text-white text-xs">Verified</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{athlete.username}</p>
            {athlete.sport && (
              <Badge variant="secondary" className="mt-2 capitalize text-xs">
                {athlete.sport.replace("_", " ")}
              </Badge>
            )}
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{athlete.followers_count}</div>
            <div className="text-xs text-muted-foreground">followers</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search athletes by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 border-border/50 focus:border-primary"
        />
      </div>

      {searchQuery ? (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Search Results
          </h2>
          {athletes.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No athletes found
            </p>
          ) : (
            <div className="space-y-3">
              {athletes.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Top Athletes
          </h2>
          <div className="space-y-3">
            {topAthletes.map((athlete) => (
              <AthleteCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
