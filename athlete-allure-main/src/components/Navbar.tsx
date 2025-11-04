import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Home, Search, PlusSquare, User, Trophy, LogOut, Dumbbell, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  user: any;
  profile: any;
}

const Navbar = ({ user, profile }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      // Set up real-time subscription for notifications
      const channel = supabase
        .channel("navbar_notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 navbar-premium shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center neon-glow-primary group-hover:neon-glow-secondary transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-green-400 flex items-center justify-center">
                <img src="/favicon.ico" alt="ENDGAME" className="w-6 h-6 filter brightness-0 invert" />
              </div>
            </div>
            <span className="text-3xl font-black text-white hidden sm:block drop-shadow-lg">
              ENDGAME
            </span>
          </Link>

          <div className="flex items-center gap-5 sm:gap-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className={`btn-premium rounded-3xl p-5 ${isActive('/') ? 'bg-black text-white neon-glow-primary' : 'hover:neon-glow-secondary'} transition-all duration-300`}
            >
              <Home className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/search")}
              className={`btn-premium rounded-3xl p-5 ${isActive('/search') ? 'bg-black text-white neon-glow-primary' : 'hover:neon-glow-secondary'} transition-all duration-300`}
            >
              <Search className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/leaderboard")}
              className={`btn-premium rounded-3xl p-5 ${isActive('/leaderboard') ? 'bg-black text-white neon-glow-primary' : 'hover:neon-glow-secondary'} transition-all duration-300`}
            >
              <Trophy className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/create")}
              className={`btn-premium rounded-3xl p-5 ${isActive('/create') ? 'bg-black text-white neon-glow-primary' : 'hover:neon-glow-secondary'} transition-all duration-300`}
            >
              <PlusSquare className="w-8 h-8" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/notifications")}
                className={`btn-premium rounded-3xl p-5 ${isActive('/notifications') ? 'bg-black text-white neon-glow-primary' : 'hover:neon-glow-secondary'} transition-all duration-300`}
              >
                <Bell className="w-8 h-8" />
              </Button>
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-6 min-w-6 flex items-center justify-center p-0 text-xs font-bold z-10 badge-premium animate-neon-pulse"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-1 hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:neon-glow-secondary">
                  <div className="avatar-premium">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile?.profile_image_url} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-400 via-purple-500 to-green-400 text-black font-bold text-lg">
                        {profile?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 glass-morphism-strong border-white/20 shadow-2xl">
                <DropdownMenuItem
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="hover:bg-gradient-to-r hover:from-cyan-400/20 hover:to-purple-500/20 transition-all duration-300 rounded-lg mx-1 neon-glow-secondary"
                >
                  <User className="w-5 h-5 mr-3" />
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="hover:bg-gradient-to-r hover:from-red-400/20 hover:to-red-600/20 hover:text-red-400 transition-all duration-300 rounded-lg mx-1"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
