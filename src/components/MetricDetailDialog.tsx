import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MetricDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  icon: LucideIcon;
  unit: string;
  color: string;
  history: { date: string; value: number }[];
  onAddValue?: (value: number) => void;
}

export function MetricDetailDialog({
  open, onOpenChange, label, icon: Icon, unit, color, history, onAddValue,
}: MetricDetailDialogProps) {
  const [newValue, setNewValue] = useState("");

  const latest = history.length > 0 ? history[history.length - 1].value : null;
  const previous = history.length > 1 ? history[history.length - 2].value : null;
  const trend = latest && previous ? (latest > previous ? "up" : latest < previous ? "down" : "stable") : "stable";
  const avg = history.length > 0 ? Math.round(history.reduce((s, h) => s + h.value, 0) / history.length) : 0;
  const max = history.length > 0 ? Math.max(...history.map(h => h.value)) : 0;
  const min = history.length > 0 ? Math.min(...history.map(h => h.value)) : 0;

  const handleAdd = () => {
    const val = Number(newValue);
    if (val > 0 && onAddValue) {
      onAddValue(val);
      setNewValue("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="metric-icon-box" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{label}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos 7 registros</p>
              </div>
            </div>
          </DialogHeader>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atual</p>
              <p className="text-xl font-bold" style={{ color }}>{latest ?? "--"}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Média</p>
              <p className="text-xl font-bold text-foreground">{avg || "--"}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tendência</p>
              <div className="flex justify-center">
                {trend === "up" ? <TrendingUp className="w-5 h-5 text-success" /> :
                 trend === "down" ? <TrendingDown className="w-5 h-5 text-destructive" /> :
                 <Minus className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="px-2 pb-2">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} axisLine={false} tickLine={false} domain={[min * 0.9, max * 1.1]} />
                <Tooltip
                  contentStyle={{ background: "hsl(220 20% 14%)", border: "1px solid hsl(220 15% 20%)", borderRadius: "0.75rem", fontSize: 12 }}
                  formatter={(value: number) => [`${value} ${unit}`, label]}
                />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#gradient-${label})`} dot={{ r: 3, fill: color, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhum registro ainda
            </div>
          )}
        </div>

        {/* Add new value */}
        <div className="p-4 pt-2 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={`Valor em ${unit}`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button onClick={handleAdd} className="gradient-primary text-primary-foreground px-6 shrink-0">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
