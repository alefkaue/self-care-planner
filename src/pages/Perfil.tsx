import { User, Settings, ChevronRight, Trophy, Flame, Target, Bell, Camera, Edit3 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ProgressRing } from "@/components/ProgressRing";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const menuItems = [
  { icon: Target, label: "Metas", subtitle: "Defina seus objetivos", to: "/metas" },
  { icon: Bell, label: "Notificações", subtitle: "Lembretes e alertas", to: "/notificacoes" },
  { icon: Settings, label: "Configurações", subtitle: "Preferências do app", to: "/configuracoes" },
];

const GOALS = [
  { value: "lose_weight", label: "Perder peso" },
  { value: "gain_muscle", label: "Ganhar massa" },
  { value: "maintain", label: "Manutenção" },
  { value: "general_health", label: "Saúde geral" },
];

const LEVELS = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];

export default function Perfil() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    weight_kg: "",
    height_cm: "",
    age: "",
    fitness_goal: "",
    experience_level: "",
    dietary_restrictions: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEdit = () => {
    setForm({
      display_name: profile?.display_name || "",
      weight_kg: profile?.weight_kg?.toString() || "",
      height_cm: profile?.height_cm?.toString() || "",
      age: profile?.age?.toString() || "",
      fitness_goal: profile?.fitness_goal || "",
      experience_level: profile?.experience_level || "",
      dietary_restrictions: (profile?.dietary_restrictions || []).join(", "),
    });
    setShowEdit(true);
  };

  const handleSave = () => {
    updateProfile.mutate(
      {
        display_name: form.display_name || undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        height_cm: form.height_cm ? Number(form.height_cm) : undefined,
        age: form.age ? Number(form.age) : undefined,
        fitness_goal: form.fitness_goal || undefined,
        experience_level: form.experience_level || undefined,
        dietary_restrictions: form.dietary_restrictions
          ? form.dietary_restrictions.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      },
      {
        onSuccess: () => {
          setShowEdit(false);
          toast.success("Perfil atualizado!");
        },
      }
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Erro ao enviar foto");
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    updateProfile.mutate({ avatar_url: urlData.publicUrl }, { onSuccess: () => toast.success("Foto atualizada!") });
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-6 max-w-lg mx-auto">

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center"
            >
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-3">{profile?.display_name || "Atleta"}</h1>
          <p className="text-sm text-muted-foreground">Nível {profile?.level || 1} · {profile?.xp?.toLocaleString() || 0} XP</p>
          <Button variant="ghost" size="sm" onClick={openEdit} className="mt-2 text-primary">
            <Edit3 className="w-4 h-4 mr-1" /> Editar Perfil
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Streak", value: `${profile?.streak_days || 0} dias`, color: "hsl(28 85% 55%)" },
            { icon: Trophy, label: "XP Total", value: (profile?.xp || 0).toLocaleString(), color: "hsl(165 80% 45%)" },
            { icon: Target, label: "Nível", value: profile?.level?.toString() || "1", color: "hsl(210 70% 52%)" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass-card p-3 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Info Cards */}
        {profile?.weight_kg && (
          <div className="grid grid-cols-3 gap-3">
            {profile.weight_kg && (
              <div className="glass-card p-3 text-center">
                <p className="text-sm font-bold text-foreground">{profile.weight_kg} kg</p>
                <p className="text-[10px] text-muted-foreground">Peso</p>
              </div>
            )}
            {profile.height_cm && (
              <div className="glass-card p-3 text-center">
                <p className="text-sm font-bold text-foreground">{profile.height_cm} cm</p>
                <p className="text-[10px] text-muted-foreground">Altura</p>
              </div>
            )}
            {profile.age && (
              <div className="glass-card p-3 text-center">
                <p className="text-sm font-bold text-foreground">{profile.age}</p>
                <p className="text-[10px] text-muted-foreground">Idade</p>
              </div>
            )}
          </div>
        )}

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
              <Link to={item.to} className="w-full glass-card p-4 flex items-center gap-3 text-left block">
                <div className="metric-icon-box bg-secondary !w-10 !h-10 !rounded-xl">
                  <item.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Nome" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="bg-secondary border-border" />
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" placeholder="Peso (kg)" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="bg-secondary border-border" />
              <Input type="number" placeholder="Altura (cm)" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="bg-secondary border-border" />
              <Input type="number" placeholder="Idade" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="bg-secondary border-border" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Objetivo</p>
              <div className="flex gap-2 flex-wrap">
                {GOALS.map((g) => (
                  <button key={g.value} onClick={() => setForm({ ...form, fitness_goal: g.value })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${form.fitness_goal === g.value ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Nível de experiência</p>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map((l) => (
                  <button key={l.value} onClick={() => setForm({ ...form, experience_level: l.value })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${form.experience_level === l.value ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <Input placeholder="Restrições alimentares (ex: vegano, sem glúten)" value={form.dietary_restrictions} onChange={(e) => setForm({ ...form, dietary_restrictions: e.target.value })} className="bg-secondary border-border" />

            <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full gradient-primary text-primary-foreground">
              {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
