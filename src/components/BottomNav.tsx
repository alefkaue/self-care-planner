import { Home, Heart, Dumbbell, UtensilsCrossed, User, MessageCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/saude", icon: Heart, label: "Saúde" },
  { to: "/chat", icon: MessageCircle, label: "Coach IA" },
  { to: "/treinos", icon: Dumbbell, label: "Treinos" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive && "bg-primary/15",
                  item.to === "/chat" && !isActive && "gradient-primary !p-2 rounded-full"
                )}>
                  <item.icon className={cn("w-5 h-5", item.to === "/chat" && !isActive && "text-primary-foreground")} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
