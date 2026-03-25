import { LucideIcon, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealCardProps {
  icon: LucideIcon;
  label: string;
  meals: Meal[];
  color: string;
  onAdd: () => void;
}

export function MealCard({ icon: Icon, label, meals, color, onAdd }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const totalCals = meals.reduce((s, m) => s + m.calories, 0);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="metric-icon-box shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {meals.length > 0 ? `${meals.length} item${meals.length > 1 ? "s" : ""} · ${totalCals} kcal` : "Nenhum item"}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {meals.map((meal, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">{meal.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      P: {meal.protein}g · C: {meal.carbs}g · G: {meal.fat}g
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{meal.calories} kcal</span>
                </div>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
