import { Coffee, Sun, Apple, Moon, Plus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { MealCard } from "@/components/MealCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const mealCategories = [
  { key: "breakfast", label: "Café da Manhã", icon: Coffee, color: "hsl(28 85% 55%)" },
  { key: "lunch", label: "Almoço", icon: Sun, color: "hsl(165 80% 45%)" },
  { key: "snack", label: "Lanche", icon: Apple, color: "hsl(210 70% 52%)" },
  { key: "dinner", label: "Jantar", icon: Moon, color: "hsl(260 50% 60%)" },
];

// Mock data
const initialMeals: Record<string, Meal[]> = {
  breakfast: [
    { name: "Ovos mexidos", calories: 220, protein: 18, carbs: 2, fat: 15 },
    { name: "Aveia com banana", calories: 200, protein: 6, carbs: 35, fat: 4 },
  ],
  lunch: [
    { name: "Frango grelhado", calories: 350, protein: 42, carbs: 0, fat: 8 },
    { name: "Arroz integral", calories: 180, protein: 4, carbs: 38, fat: 1 },
  ],
  snack: [],
  dinner: [],
};

export default function Nutricao() {
  const [meals, setMeals] = useState(initialMeals);
  const [addingType, setAddingType] = useState<string | null>(null);
  const [form, setForm] = useState({ food_name: "", calories: "", protein: "", carbs: "", fat: "" });

  const allMeals = Object.values(meals).flat();
  const totalCals = allMeals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = allMeals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = allMeals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = allMeals.reduce((s, m) => s + m.fat, 0);

  const macroData = [
    { name: "Proteína", value: totalProtein, color: "hsl(165 80% 45%)" },
    { name: "Carbos", value: totalCarbs, color: "hsl(28 85% 55%)" },
    { name: "Gordura", value: totalFat, color: "hsl(210 70% 52%)" },
  ].filter(d => d.value > 0);

  const handleAdd = () => {
    if (!addingType || !form.food_name) return;
    const newMeal: Meal = {
      name: form.food_name,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    };
    setMeals(prev => ({ ...prev, [addingType]: [...(prev[addingType] || []), newMeal] }));
    toast.success("Refeição adicionada!");
    setAddingType(null);
    setForm({ food_name: "", calories: "", protein: "", carbs: "", fat: "" });
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nutrição</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas refeições do dia</p>
        </div>

        {/* Macro Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20">
              {macroData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                      {macroData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full rounded-full border-4 border-border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">0</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{totalCals} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
              <div className="flex items-center gap-3 mt-1.5">
                <div>
                  <p className="text-xs font-bold text-primary">{totalProtein}g</p>
                  <p className="text-[10px] text-muted-foreground">Proteína</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <p className="text-xs font-bold text-accent">{totalCarbs}g</p>
                  <p className="text-[10px] text-muted-foreground">Carbos</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <p className="text-xs font-bold text-info">{totalFat}g</p>
                  <p className="text-[10px] text-muted-foreground">Gordura</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Meal Categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Refeições</h2>
          {mealCategories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              <MealCard
                icon={cat.icon}
                label={cat.label}
                meals={meals[cat.key] || []}
                color={cat.color}
                onAdd={() => setAddingType(cat.key)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={!!addingType} onOpenChange={(open) => !open && setAddingType(null)}>
        <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Ex: Frango grelhado"
              value={form.food_name}
              onChange={(e) => setForm({ ...form, food_name: e.target.value })}
              className="bg-secondary border-border"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Calorias" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="bg-secondary border-border" />
              <Input type="number" placeholder="Proteína (g)" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} className="bg-secondary border-border" />
              <Input type="number" placeholder="Carbos (g)" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} className="bg-secondary border-border" />
              <Input type="number" placeholder="Gordura (g)" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} className="bg-secondary border-border" />
            </div>
            <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground">
              Salvar Refeição
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
