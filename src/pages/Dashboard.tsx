import { Heart, Dumbbell, UtensilsCrossed, Flame, Footprints, Trophy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ProgressRing } from "@/components/ProgressRing";
import { motion } from "framer-motion";

const quickActions = [
  { to: "/saude", icon: Heart, label: "Saúde", subtitle: "Sinais vitais", color: "hsl(0 75% 55%)" },
  { to: "/nutricao", icon: UtensilsCrossed, label: "Nutrição", subtitle: "Refeições", color: "hsl(28 85% 55%)" },
  { to: "/treinos", icon: Dumbbell, label: "Treinos", subtitle: "Exercícios", color: "hsl(165 80% 45%)" },
];

export default function Dashboard() {
  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Mock data
  const displayName = "Atleta";
  const streak = 7;
  const level = 12;
  const steps = 8400;
  const caloriesBurned = 420;
  const exerciseMin = 32;
  const overallProgress = 68;

  const todayStats = [
    { icon: Footprints, label: "Passos", value: `${(steps / 1000).toFixed(1)}k`, goal: "10k" },
    { icon: Flame, label: "Calorias", value: `${caloriesBurned}`, goal: "600" },
    { icon: Dumbbell, label: "Exercício", value: `${exerciseMin} min`, goal: "52 min" },
  ];

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-6 max-w-lg mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greet()} 👋</p>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 text-accent">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{streak}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold">Lv {level}</span>
            </div>
          </div>
        </motion.div>

        {/* Main Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center py-4"
        >
          <ProgressRing progress={overallProgress} size={160} strokeWidth={12}>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{overallProgress}%</p>
              <p className="text-xs text-muted-foreground">Progresso</p>
            </div>
          </ProgressRing>

          {/* Stats row under ring */}
          <div className="flex items-center gap-6 mt-5">
            {todayStats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">/ {stat.goal}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Acessar</h2>
          {quickActions.map((action, i) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <Link
                to={action.to}
                className="glass-card flex items-center gap-4 p-4 active:scale-[0.98] transition-transform"
              >
                <div className="metric-icon-box" style={{ backgroundColor: `${action.color}20` }}>
                  <action.icon className="w-6 h-6" style={{ color: action.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Coach Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4"
        >
          <p className="text-xs font-semibold text-primary mb-1.5">💡 Insight do Coach</p>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            Faltam {Math.max(52 - exerciseMin, 0)} min de exercício para fechar seu anel. Uma caminhada rápida resolveria!
          </p>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
