import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Bell, Check, Info, Trophy, Target, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_ICONS: Record<string, any> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  reward: Trophy,
  goal: Target,
};

const TYPE_COLORS: Record<string, string> = {
  info: "hsl(210 70% 52%)",
  success: "hsl(145 60% 42%)",
  warning: "hsl(38 90% 55%)",
  reward: "hsl(28 85% 55%)",
  goal: "hsl(165 80% 45%)",
};

export default function Notificacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Seus alertas e lembretes</p>
        </div>

        {notifications?.map((n, i) => {
          const Icon = TYPE_ICONS[n.type] || Info;
          const color = TYPE_COLORS[n.type] || TYPE_COLORS.info;
          return (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`w-full glass-card p-4 flex items-start gap-3 text-left transition-opacity ${n.is_read ? "opacity-60" : ""}`}
            >
              <div className="metric-icon-box bg-secondary shrink-0 !w-10 !h-10 !rounded-xl">
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </motion.button>
          );
        })}

        {(!notifications || notifications.length === 0) && (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-12 h-12 text-primary/30 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma notificação</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
