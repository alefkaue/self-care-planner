import { User, Settings, ChevronRight, Trophy, Flame, Target, Bell } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ProgressRing } from "@/components/ProgressRing";
import { motion } from "framer-motion";

const menuItems = [
  { icon: Target, label: "Metas", subtitle: "Defina seus objetivos" },
  { icon: Bell, label: "Notificações", subtitle: "Lembretes e alertas" },
  { icon: Settings, label: "Configurações", subtitle: "Preferências do app" },
];

export default function Perfil() {
  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-6 max-w-lg mx-auto">

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Atleta</h1>
          <p className="text-sm text-muted-foreground">Nível 12 · Guerreiro</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Streak", value: "7 dias", color: "hsl(28 85% 55%)" },
            { icon: Trophy, label: "XP Total", value: "2.450", color: "hsl(165 80% 45%)" },
            { icon: Target, label: "Metas", value: "68%", color: "hsl(210 70% 52%)" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass-card p-3 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="w-full glass-card p-4 flex items-center gap-3 text-left"
            >
              <div className="metric-icon-box bg-secondary">
                <item.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
