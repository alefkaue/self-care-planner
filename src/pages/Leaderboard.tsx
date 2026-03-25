import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Crown, Medal, Gift, Lock, Check, ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [showRewards, setShowRewards] = useState(false);

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, xp, level, streak_days")
        .order("xp", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: rewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data } = await supabase.from("rewards").select("*").order("xp_required");
      return data || [];
    },
  });

  const { data: userRewards } = useQuery({
    queryKey: ["user-rewards", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_rewards").select("reward_id").eq("user_id", user.id);
      return (data || []).map((r) => r.reward_id);
    },
    enabled: !!user,
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_rewards").insert({ user_id: user.id, reward_id: rewardId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-rewards"] });
      toast.success("Recompensa resgatada! 🎉");
    },
    onError: () => toast.error("Erro ao resgatar"),
  });

  const userXp = profile?.xp || 0;
  const userRank = leaderboard?.findIndex((p) => p.user_id === user?.id);

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-5 h-5" style={{ color: "hsl(45 90% 55%)" }} />;
    if (i === 1) return <Medal className="w-5 h-5" style={{ color: "hsl(0 0% 75%)" }} />;
    if (i === 2) return <Medal className="w-5 h-5" style={{ color: "hsl(28 85% 55%)" }} />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {userRank !== undefined && userRank >= 0 ? `Você está em ${userRank + 1}º lugar` : "Compete com amigos"}
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-primary/30 text-primary" onClick={() => setShowRewards(true)}>
            <Gift className="w-4 h-4 mr-1" />
            Recompensas
          </Button>
        </div>

        {/* User Stats */}
        {profile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {profile.display_name?.charAt(0) || "A"}
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">{profile.display_name}</p>
              <p className="text-xs text-muted-foreground">Nível {profile.level}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{profile.xp.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">XP Total</p>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Classificação</h2>
          {leaderboard?.map((p, i) => (
            <motion.div
              key={p.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-card p-3 flex items-center gap-3 ${p.user_id === user?.id ? "ring-1 ring-primary/40" : ""}`}
            >
              {getRankIcon(i)}
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                {p.display_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{p.display_name || "Atleta"}</p>
                <p className="text-xs text-muted-foreground">Lv {p.level} · {p.streak_days}🔥</p>
              </div>
              <p className="text-sm font-bold text-primary">{p.xp.toLocaleString()} XP</p>
            </motion.div>
          ))}
          {(!leaderboard || leaderboard.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum participante ainda. Comece a treinar!</p>
          )}
        </div>
      </div>

      {/* Rewards Dialog */}
      <Dialog open={showRewards} onOpenChange={setShowRewards}>
        <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Recompensas
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-2">
              {rewards?.map((r) => {
                const unlocked = userXp >= r.xp_required;
                const redeemed = userRewards?.includes(r.id);
                return (
                  <div key={r.id} className={`p-4 rounded-xl border ${unlocked ? "bg-secondary/50 border-primary/20" : "bg-secondary/30 border-border opacity-60"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                        <p className="text-xs text-primary mt-1">{r.xp_required.toLocaleString()} XP necessários</p>
                      </div>
                      {redeemed ? (
                        <div className="flex items-center gap-1 text-xs text-success font-semibold">
                          <Check className="w-4 h-4" /> Resgatado
                        </div>
                      ) : unlocked ? (
                        <Button size="sm" onClick={() => redeemMutation.mutate(r.id)} className="gradient-primary text-primary-foreground text-xs">
                          Resgatar
                        </Button>
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
