import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import CreatePost from "./pages/CreatePost";
import Leaderboard from "./pages/Leaderboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      {user && profile && (
        <>
          <Route path="/" element={<Index />} />
          <Route
            path="/profile/:userId"
            element={
              <>
                <Navbar user={user} profile={profile} />
                <main className="max-w-4xl mx-auto px-4 py-8">
                  <Profile currentUserId={user.id} />
                </main>
              </>
            }
          />
          <Route
            path="/search"
            element={
              <>
                <Navbar user={user} profile={profile} />
                <main className="max-w-2xl mx-auto px-4 py-8">
                  <Search />
                </main>
              </>
            }
          />
          <Route
            path="/create"
            element={
              <>
                <Navbar user={user} profile={profile} />
                <main className="max-w-4xl mx-auto px-4 py-8">
                  <CreatePost userId={user.id} />
                </main>
              </>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <>
                <Navbar user={user} profile={profile} />
                <main className="max-w-4xl mx-auto px-4 py-8">
                  <Leaderboard />
                </main>
              </>
            }
          />
          <Route
            path="/notifications"
            element={
              <>
                <Navbar user={user} profile={profile} />
                <main className="max-w-2xl mx-auto px-4 py-8">
                  <Notifications />
                </main>
              </>
            }
          />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
