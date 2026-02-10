import { motion } from "framer-motion";
import { Brain, TrendingUp, Moon, Heart, Apple, ShieldAlert, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAgents } from "@/hooks/use-parent-academy";

const ICON_MAP: Record<string, React.ElementType> = {
  Brain, TrendingUp, Moon, Heart, Apple, ShieldAlert,
};

export default function Experts() {
  const { data: agents } = useAgents();
  const [, setLocation] = useLocation();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const colorMap: Record<string, string> = {
    behavior: "from-violet-500 to-purple-600",
    milestones: "from-blue-500 to-cyan-600",
    sleep: "from-indigo-500 to-blue-600",
    nutrition: "from-green-500 to-emerald-600",
    emotions: "from-pink-500 to-rose-600",
    safety: "from-amber-500 to-orange-600",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Talk to an Expert</h1>
        <p className="text-muted-foreground mt-2">
          Choose a specialist for your question. Each expert has deep knowledge in their area.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {(agents || []).map((agent: any) => {
          const Icon = ICON_MAP[agent.icon] || Brain;
          const color = colorMap[agent.type] || "from-gray-500 to-gray-600";
          return (
            <motion.div key={agent.type} variants={item}>
              <Card
                className="p-6 hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-1 duration-300 group"
                onClick={() => setLocation(`/chat/${agent.type}`)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{agent.name}</h3>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {agent.specialties?.slice(0, 4).map((s: string) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
