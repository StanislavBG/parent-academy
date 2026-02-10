import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4 border border-primary/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Version 2.0 Available</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground text-balance"
        >
          Manage your tasks with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Style & Speed</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          A premium interface built for modern workflows. Experience the seamless blend of functionality and aesthetics.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link href="/page-2">
            <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1 bg-gradient-to-r from-primary to-primary/80">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base hover:bg-secondary/50 border-2">
            View Documentation
          </Button>
        </motion.div>
      </section>

      {/* Hero Image / Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 aspect-video md:aspect-[2/1]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background z-0" />
        {/* Unsplash image: Minimalist modern architecture abstract */}
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" 
          alt="Modern Dashboard Preview" 
          className="object-cover w-full h-full opacity-90 mix-blend-overlay"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-xl max-w-sm text-center">
             <h3 className="text-2xl font-bold text-white mb-2">Beautiful by Default</h3>
             <p className="text-white/80">Every component crafted with attention to detail.</p>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 py-24"
      >
        {[
          { icon: Zap, title: "Lightning Fast", desc: "Optimized for speed with instant interactions and zero lag." },
          { icon: Shield, title: "Secure by Design", desc: "Enterprise-grade security built into every layer of the application." },
          { icon: Sparkles, title: "Premium UI", desc: "Stunning visual design that delights users at every interaction." }
        ].map((feature, idx) => (
          <motion.div key={idx} variants={item}>
            <Card className="p-6 h-full border-border/50 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
