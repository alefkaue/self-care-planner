import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HealthMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  status?: string;
  onClick?: () => void;
}

export function HealthMetricCard({ icon: Icon, label, value, unit, color, status, onClick }: HealthMetricCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="glass-card p-4 text-left w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("metric-icon-box")} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {status && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            {status}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value || "--"}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </motion.button>
  );
}
