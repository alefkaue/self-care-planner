import { Dumbbell, Plus, Timer, Flame, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const workouts = [
  { name: "Corrida Matinal", type: "Cardio", duration: "32 min", calories: 320, icon: "🏃" },
  { name: "Treino de Peito", type: "Musculação", duration: "45 min", calories: 280, icon: "💪" },
  { name: "Yoga", type: "Flexibilidade", duration: "20 min", calories: 120, icon: "🧘" },
];

const weekSummary = [
  { day: "S", done: true }, { day: "T", done: true }, { day: "Q", done: true },
  { day: "Q", done: false }, { day: "S", done: false }, { day: "S", done: false }, { day: "D", done: false },
];

export default function Treinos() {
  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">

        <div>
          <h1 className="text-2xl font-bold text-foreground">Treinos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Seu progresso semanal</p>
        </div>

        {/* Week Streak */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Esta semana</p>
            <p className="text-xs text-primary font-semibold">3/7 dias</p>
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
            { icon: Timer, label: "Tempo", value: "97 min", color: "hsl(165 80% 45%)" },
            { icon: Flame, label: "Calorias", value: "720", color: "hsl(28 85% 55%)" },
            { icon: TrendingUp, label: "Treinos", value: "3", color: "hsl(210 70% 52%)" },
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
          {workouts.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <div className="text-2xl">{w.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.type} · {w.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">{w.calories}</p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </div>
            </motion.div>
          ))}

          <button className="w-full glass-card p-4 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="font-semibold text-sm">Novo Treino</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
