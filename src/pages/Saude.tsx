import { Activity, Heart, Wind, Droplets, Moon, Thermometer, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { HealthMetricCard } from "@/components/HealthMetricCard";
import { MetricDetailDialog } from "@/components/MetricDetailDialog";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const metricTypes = [
  { key: "glucose", label: "Glicose", icon: Activity, unit: "mg/dL", color: "hsl(22 90% 55%)", status: "Normal" },
  { key: "heart_rate", label: "FC Repouso", icon: Heart, unit: "bpm", color: "hsl(0 75% 55%)", status: "Atlético" },
  { key: "spo2", label: "Oxigênio (SpO2)", icon: Wind, unit: "%", color: "hsl(200 80% 55%)", status: "Ótimo" },
  { key: "pressure", label: "Pressão", icon: Thermometer, unit: "mmHg", color: "hsl(280 60% 55%)", status: "Normal" },
  { key: "hydration", label: "Hidratação", icon: Droplets, unit: "L", color: "hsl(195 85% 50%)", status: "" },
  { key: "sleep", label: "Sono", icon: Moon, unit: "horas", color: "hsl(260 50% 60%)", status: "" },
];

// Mock data
const mockHistory: Record<string, { date: string; value: number }[]> = {
  glucose: [
    { date: "18/03", value: 92 }, { date: "19/03", value: 88 }, { date: "20/03", value: 95 },
    { date: "21/03", value: 91 }, { date: "22/03", value: 87 }, { date: "23/03", value: 93 }, { date: "24/03", value: 90 },
  ],
  heart_rate: [
    { date: "18/03", value: 62 }, { date: "19/03", value: 58 }, { date: "20/03", value: 61 },
    { date: "21/03", value: 59 }, { date: "22/03", value: 55 }, { date: "23/03", value: 60 }, { date: "24/03", value: 57 },
  ],
  spo2: [
    { date: "18/03", value: 97 }, { date: "19/03", value: 98 }, { date: "20/03", value: 97 },
    { date: "21/03", value: 99 }, { date: "22/03", value: 98 }, { date: "23/03", value: 97 }, { date: "24/03", value: 98 },
  ],
  pressure: [
    { date: "18/03", value: 120 }, { date: "19/03", value: 118 }, { date: "20/03", value: 122 },
    { date: "21/03", value: 119 }, { date: "22/03", value: 121 }, { date: "23/03", value: 117 }, { date: "24/03", value: 120 },
  ],
  hydration: [
    { date: "18/03", value: 2.1 }, { date: "19/03", value: 1.8 }, { date: "20/03", value: 2.5 },
    { date: "21/03", value: 2.0 }, { date: "22/03", value: 2.3 }, { date: "23/03", value: 1.9 }, { date: "24/03", value: 2.2 },
  ],
  sleep: [
    { date: "18/03", value: 7.2 }, { date: "19/03", value: 6.8 }, { date: "20/03", value: 7.5 },
    { date: "21/03", value: 8.0 }, { date: "22/03", value: 6.5 }, { date: "23/03", value: 7.1 }, { date: "24/03", value: 7.8 },
  ],
};

const mockLatest: Record<string, number> = {
  glucose: 90, heart_rate: 57, spo2: 98, pressure: 120, hydration: 2.2, sleep: 7.8,
};

export default function Saude() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const handleAddValue = useCallback((key: string, value: number) => {
    toast.success(`${metricTypes.find(m => m.key === key)?.label}: ${value} registrado!`);
    setSelectedMetric(null);
  }, []);

  const selected = metricTypes.find(m => m.key === selectedMetric);

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 space-y-5 max-w-lg mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saúde</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Toque em um indicador para ver detalhes</p>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metricTypes.map((mt, i) => (
            <motion.div
              key={mt.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <HealthMetricCard
                icon={mt.icon}
                label={mt.label}
                value={mockLatest[mt.key] ?? "--"}
                unit={mt.unit}
                color={mt.color}
                status={mt.status}
                onClick={() => setSelectedMetric(mt.key)}
              />
            </motion.div>
          ))}
        </div>

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <p className="text-xs font-semibold text-primary mb-1.5">📊 Resumo</p>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            Seus indicadores estão dentro da faixa saudável. Continue monitorando diariamente para melhores resultados.
          </p>
        </motion.div>
      </div>

      {/* Detail Dialog */}
      {selected && (
        <MetricDetailDialog
          open={!!selectedMetric}
          onOpenChange={(open) => !open && setSelectedMetric(null)}
          label={selected.label}
          icon={selected.icon}
          unit={selected.unit}
          color={selected.color}
          history={mockHistory[selectedMetric!] || []}
          onAddValue={(val) => handleAddValue(selectedMetric!, val)}
        />
      )}

      <BottomNav />
    </div>
  );
}
