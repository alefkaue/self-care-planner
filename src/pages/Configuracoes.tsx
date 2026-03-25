import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Moon, Bell, Shield, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const settingsItems = [
  { icon: Moon, label: "Aparência", subtitle: "Tema escuro ativado" },
  { icon: Bell, label: "Notificações", subtitle: "Gerenciar alertas" },
  { icon: Shield, label: "Privacidade", subtitle: "Dados e segurança" },
  { icon: HelpCircle, label: "Ajuda", subtitle: "Suporte e FAQ" },
];

export default function Configuracoes() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast.success("Até logo!");
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Preferências do app</p>
        </div>

        <div className="space-y-2">
          {settingsItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="w-full glass-card p-4 flex items-center gap-3 text-left"
            >
              <div className="metric-icon-box bg-secondary !w-10 !h-10 !rounded-xl">
                <item.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <Button variant="outline" onClick={handleSignOut} className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
