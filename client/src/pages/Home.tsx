import { motion } from "framer-motion";
import { ArrowRight, Heart, Brain, Moon, TrendingUp, Shield, MessageCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, useCreateSession } from "@/hooks/use-parent-academy";
import { getSessionToken } from "@/lib/queryClient";
import { useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const createSession = useCreateSession();
  const [, setLocation] = useLocation();

  const hasSession = !!getSessionToken();
  const isOnboarded = session?.parent?.onboardingComplete;

  const handleQuickAnswer = async () => {
    if (!hasSession) {
      await createSession.mutateAsync();
    }
    setLocation("/experts");
  };

  const handleStartCoaching = async () => {
    if (!hasSession) {
      await createSession.mutateAsync();
    }
    if (isOnboarded) {
      setLocation("/dashboard");
    } else {
      setLocation("/onboarding");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const experts = [
    { icon: Brain, title: "Behavior Expert", desc: "Tantrums, meltdowns, aggression, defiance", color: "from-violet-500 to-purple-600" },
    { icon: TrendingUp, title: "Development Expert", desc: "Milestones, growth tracking, activities", color: "from-blue-500 to-cyan-600" },
    { icon: Moon, title: "Sleep Expert", desc: "Bedtime, routines, sleep regression", color: "from-indigo-500 to-blue-600" },
    { icon: Heart, title: "Emotions Expert", desc: "Regulation, anxiety, social skills", color: "from-pink-500 to-rose-600" },
    { icon: MessageCircle, title: "Nutrition Expert", desc: "Picky eating, mealtime, feeding", color: "from-green-500 to-emerald-600" },
    { icon: Shield, title: "Safety Advisor", desc: "Crisis support and professional referrals", color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-2 border border-primary/20"
        >
          <Heart className="w-4 h-4" />
          <span>Multi-Agent Parenting Experts</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground text-balance"
        >
          Raise confident kids with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            expert coaching
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          A team of child development specialists ready to help with tantrums, bedtime battles,
          milestones, and everything in between. Get answers now or start a 30-day coaching plan.
        </motion.p>

        {/* Two clear paths - as per spec */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Button
            size="lg"
            onClick={handleQuickAnswer}
            className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1 bg-gradient-to-r from-primary to-primary/80"
          >
            Get a Quick Answer <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleStartCoaching}
            className="rounded-full px-8 h-14 text-base hover:bg-secondary/50 border-2"
          >
            Start Coaching (30-Day Plan)
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-muted-foreground max-w-md mx-auto"
        >
          If you or your child may be in danger or there's an urgent medical concern,
          we'll guide you to immediate help.
        </motion.p>
      </section>

      {/* Expert Agents Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12"
      >
        {experts.map((expert, idx) => (
          <motion.div key={idx} variants={item}>
            <Card className="p-6 h-full border-border/50 hover:border-primary/50 transition-all bg-card/50 backdrop-blur-sm group cursor-pointer hover:-translate-y-1 duration-300"
              onClick={handleQuickAnswer}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${expert.color} flex items-center justify-center mb-4 shadow-lg`}>
                <expert.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{expert.title}</h3>
              <p className="text-muted-foreground text-sm">{expert.desc}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* How It Works */}
      <section className="py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold mb-12"
        >
          How coaching works
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Quick Baseline", desc: "2 questions about your child's age and main challenge" },
            { step: "2", title: "Get Your Plan", desc: "Personalized 30-day plan with daily actions and scripts" },
            { step: "3", title: "Track Progress", desc: "10-second daily check-ins that show what's improving" },
            { step: "4", title: "Weekly Review", desc: "Expert analysis adjusts your plan based on real data" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {s.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Measurable Outcomes */}
      <section className="py-12">
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/20">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 text-center">
            Measurable improvements in 30 days
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
            {[
              { metric: "Fewer tantrums", desc: "per week" },
              { metric: "Lower intensity", desc: "parent-rated" },
              { metric: "Shorter meltdowns", desc: "minutes" },
              { metric: "Smoother transitions", desc: "fewer conflicts" },
              { metric: "Higher confidence", desc: "weekly self-rating" },
              { metric: "Better consistency", desc: "action completion" },
            ].map((m, i) => (
              <div key={i} className="space-y-1">
                <p className="font-bold text-primary text-lg">{m.metric}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
