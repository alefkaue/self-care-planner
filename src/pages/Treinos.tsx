import { Dumbbell, Plus, Timer, Flame, TrendingUp, Search, Play, Pause, Square, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export default function Treinos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // States
  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Queries
  const { data: categories } = useQuery({
    queryKey: ["sport-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("sport_categories").select("*").order("name");
      return data || [];
    },
  });

  const { data: workouts } = useQuery({
    queryKey: ["workouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("workouts")
        .select("*, sport_categories(name, icon)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Weekly summary
  const completedThisWeek = workouts?.filter((w) => {
    const d = new Date(w.created_at);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart && w.status === "completed";
  }) || [];

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const today = new Date().getDay();
  const weekSummary = weekDays.map((day, i) => ({
    day,
    done: completedThisWeek.some((w) => new Date(w.created_at).getDay() === i),
  }));

  const totalMinutes = completedThisWeek.reduce((s, w) => s + Math.round((w.duration_seconds || 0) / 60), 0);
  const totalCalories = completedThisWeek.reduce((s, w) => s + (w.calories_burned || 0), 0);

  // Filtered categories
  const filteredCategories = categories?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subcategories as string[])?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Create workout
  const createWorkout = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const name = workoutName || `${selectedCategory?.icon || "🏋️"} ${selectedSubcategory || selectedCategory?.name || "Treino"}`;
      const { data, error } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          name,
          category_id: selectedCategory?.id,
          subcategory: selectedSubcategory || null,
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveWorkout(data.id);
      setTimerRunning(true);
      setElapsedSeconds(0);
      setShowNewWorkout(false);
      setSelectedCategory(null);
      setSelectedSubcategory("");
      setWorkoutName("");
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Treino iniciado! 💪");
    },
  });

  // Complete workout
  const completeWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    setTimerRunning(false);
    const calories = Math.round(elapsedSeconds / 60 * 8); // ~8 cal/min estimate
    const xpEarned = Math.round(elapsedSeconds / 60 * 5); // 5 XP per minute

    await supabase
      .from("workouts")
      .update({
        status: "completed",
        duration_seconds: elapsedSeconds,
        calories_burned: calories,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
      })
      .eq("id", activeWorkout);

    // Add XP
    if (user) {
      await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: xpEarned });
    }

    setActiveWorkout(null);
    setElapsedSeconds(0);
    queryClient.invalidateQueries({ queryKey: ["workouts"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(`Treino concluído! +${xpEarned} XP 🎉`);
  }, [activeWorkout, elapsedSeconds, user, queryClient]);

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">

        <div>
          <h1 className="text-2xl font-bold text-foreground">Treinos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Seu progresso semanal</p>
        </div>

        {/* Active Workout Timer */}
        {activeWorkout && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-5 text-center space-y-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Treino em andamento</p>
            <p className="text-5xl font-bold text-foreground font-mono">{formatTime(elapsedSeconds)}</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setTimerRunning(!timerRunning)}
                className="w-12 h-12 rounded-full border-primary/30"
              >
                {timerRunning ? <Pause className="w-5 h-5 text-primary" /> : <Play className="w-5 h-5 text-primary" />}
              </Button>
              <Button
                size="icon"
                onClick={completeWorkout}
                className="w-12 h-12 rounded-full gradient-primary text-primary-foreground"
              >
                <Square className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Week Streak */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Esta semana</p>
            <p className="text-xs text-primary font-semibold">{completedThisWeek.length}/7 dias</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            {weekSummary.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  d.done ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  {d.done ? "✓" : d.day}
                </div>
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Timer, label: "Tempo", value: `${totalMinutes} min`, color: "hsl(165 80% 45%)" },
            { icon: Flame, label: "Calorias", value: totalCalories.toString(), color: "hsl(28 85% 55%)" },
            { icon: TrendingUp, label: "Treinos", value: completedThisWeek.length.toString(), color: "hsl(210 70% 52%)" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass-card p-3 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Workout History */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Histórico</h2>
          {workouts?.filter((w) => w.status === "completed").slice(0, 5).map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <div className="text-2xl">{(w as any).sport_categories?.icon || "🏋️"}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{w.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(w as any).sport_categories?.name || ""} · {Math.round((w.duration_seconds || 0) / 60)} min
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">{w.calories_burned}</p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </div>
            </motion.div>
          ))}

          {(!workouts || workouts.filter((w) => w.status === "completed").length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum treino registrado ainda</p>
          )}

          <button
            onClick={() => setShowNewWorkout(true)}
            disabled={!!activeWorkout}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold text-sm">Novo Treino</span>
          </button>
        </div>
      </div>

      {/* New Workout Dialog */}
      <Dialog open={showNewWorkout} onOpenChange={setShowNewWorkout}>
        <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl max-h-[85vh]">
          <DialogHeader><DialogTitle>Novo Treino</DialogTitle></DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modalidade... (ex: Basquete)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-2">
              {!selectedCategory ? (
                // Category Grid
                <div className="grid grid-cols-2 gap-2">
                  {filteredCategories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className="glass-card p-4 text-center hover:bg-primary/5 transition-colors"
                    >
                      <span className="text-3xl block mb-2">{cat.icon}</span>
                      <p className="font-semibold text-sm text-foreground">{cat.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                // Subcategories
                <div className="space-y-2">
                  <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(""); }} className="text-xs text-primary flex items-center gap-1 mb-2">
                    ← Voltar
                  </button>
                  <p className="text-lg font-bold text-foreground mb-3">{selectedCategory.icon} {selectedCategory.name}</p>
                  {(selectedCategory.subcategories as string[])
                    ?.filter((s: string) => !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((sub: string) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubcategory(sub)}
                        className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-colors ${
                          selectedSubcategory === sub ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {selectedCategory && (
            <div className="space-y-3 pt-2 border-t border-border">
              <Input
                placeholder="Nome do treino (opcional)"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="bg-secondary border-border"
              />
              <Button
                onClick={() => createWorkout.mutate()}
                disabled={createWorkout.isPending}
                className="w-full gradient-primary text-primary-foreground"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Treino
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
