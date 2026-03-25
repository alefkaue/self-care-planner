import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressRing } from "@/components/ProgressRing";
import { Target, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const GOAL_TYPES = [
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "custom", label: "Personalizada" },
];

export default function Metas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", target_value: "", unit: "", goal_type: "weekly" });

  const { data: goals } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: form.title,
        target_value: Number(form.target_value),
        unit: form.unit,
        goal_type: form.goal_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowAdd(false);
      setForm({ title: "", target_value: "", unit: "", goal_type: "weekly" });
      toast.success("Meta criada!");
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta removida");
    },
  });

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Metas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Defina e acompanhe seus objetivos</p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Nova
          </Button>
        </div>

        {goals?.map((goal, i) => {
          const progress = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4 flex items-center gap-4">
              <ProgressRing progress={progress} size={56} strokeWidth={6}>
                <p className="text-xs font-bold text-foreground">{Math.round(progress)}%</p>
              </ProgressRing>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{goal.title}</p>
                <p className="text-xs text-muted-foreground">
                  {goal.current_value}/{goal.target_value} {goal.unit} · {GOAL_TYPES.find((t) => t.value === goal.goal_type)?.label}
                </p>
              </div>
              <button onClick={() => deleteGoal.mutate(goal.id)}>
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
            </motion.div>
          );
        })}

        {(!goals || goals.length === 0) && (
          <div className="flex flex-col items-center py-16 text-center">
            <Target className="w-12 h-12 text-primary/30 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma meta definida ainda</p>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl">
          <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Ex: Treinar 5x na semana" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Valor alvo" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} className="bg-secondary border-border" />
              <Input placeholder="Unidade (ex: treinos)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {GOAL_TYPES.map((t) => (
                <button key={t.value} onClick={() => setForm({ ...form, goal_type: t.value })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${form.goal_type === t.value ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <Button onClick={() => addGoal.mutate()} disabled={!form.title || !form.target_value} className="w-full gradient-primary text-primary-foreground">
              Criar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
