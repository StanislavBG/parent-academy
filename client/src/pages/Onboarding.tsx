import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubmitBaseline, useGeneratePlan } from "@/hooks/use-parent-academy";

const CHALLENGES = [
  "Tantrums", "Bedtime", "Transitions", "Hitting", "Picky eating",
  "Sibling conflict", "School refusal", "Something else",
];

const GOALS = [
  "Fewer meltdowns", "Shorter bedtime", "Calmer mornings",
  "Less hitting", "Better eating", "Smoother transitions",
  "More cooperation", "Higher confidence",
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [ageMonths, setAgeMonths] = useState<number>(24);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [nextStep, setNextStep] = useState<{ action: string; fallback: string } | null>(null);

  const submitBaseline = useSubmitBaseline();
  const generatePlan = useGeneratePlan();
  const [, setLocation] = useLocation();

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const handleSubmitBaseline = async () => {
    const result = await submitBaseline.mutateAsync({
      childAgeMonths: ageMonths,
      challenges,
      goals,
      intensity,
    });
    setNextStep(result.nextStep);
    setStep(3);
  };

  const handleGeneratePlan = async () => {
    await generatePlan.mutateAsync();
    setLocation("/dashboard");
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <AnimatePresence mode="wait">
        {/* Step 0: Child Age */}
        {step === 0 && (
          <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Step 1 of 3</p>
                <h2 className="text-2xl font-display font-bold">How old is your child?</h2>
                <p className="text-sm text-muted-foreground">So we can tailor guidance. Age in months helps us be precise.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={144}
                    value={ageMonths}
                    onChange={(e) => setAgeMonths(parseInt(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <div className="text-center min-w-[80px]">
                    <p className="text-2xl font-bold text-primary">{ageMonths}</p>
                    <p className="text-xs text-muted-foreground">months</p>
                    {ageMonths >= 12 && (
                      <p className="text-xs text-muted-foreground">
                        ({Math.floor(ageMonths / 12)}y {ageMonths % 12}m)
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick select buttons */}
                <div className="flex flex-wrap gap-2">
                  {[6, 12, 18, 24, 36, 48, 60, 72].map(m => (
                    <Button
                      key={m}
                      variant={ageMonths === m ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAgeMonths(m)}
                      className="rounded-full"
                    >
                      {m < 24 ? `${m}mo` : `${Math.floor(m / 12)}yr`}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(1)} className="w-full rounded-full h-12">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 1: Challenges */}
        {step === 1 && (
          <motion.div key="challenges" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Step 2 of 3</p>
                <h2 className="text-2xl font-display font-bold">What's the main challenge today?</h2>
                <p className="text-sm text-muted-foreground">Select all that apply.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {CHALLENGES.map(c => (
                  <Button
                    key={c}
                    variant={challenges.includes(c.toLowerCase()) ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => toggleChip(c.toLowerCase(), challenges, setChallenges)}
                  >
                    {c}
                  </Button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="rounded-full">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={challenges.length === 0}
                  className="flex-1 rounded-full h-12"
                >
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Goals + Intensity */}
        {step === 2 && (
          <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Step 3 of 3</p>
                <h2 className="text-2xl font-display font-bold">What would "better" look like?</h2>
                <p className="text-sm text-muted-foreground">Pick your goals for this week.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <Button
                    key={g}
                    variant={goals.includes(g.toLowerCase()) ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => toggleChip(g.toLowerCase(), goals, setGoals)}
                  >
                    {g}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">How hard is it today? <span className="text-muted-foreground">(optional)</span></p>
                <div className="flex gap-3">
                  {(["low", "medium", "high"] as const).map(level => (
                    <Button
                      key={level}
                      variant={intensity === level ? "default" : "outline"}
                      className="flex-1 rounded-full capitalize"
                      onClick={() => setIntensity(level)}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSubmitBaseline}
                  disabled={goals.length === 0 || submitBaseline.isPending}
                  className="flex-1 rounded-full h-12"
                >
                  {submitBaseline.isPending ? "Saving..." : "Get My Next Step"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Immediate Output */}
        {step === 3 && nextStep && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 space-y-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">Your next best step</p>
              </div>

              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <p className="font-medium text-sm text-primary mb-1">Try this now:</p>
                  <p className="text-foreground leading-relaxed">{nextStep.action}</p>
                </div>

                <div className="bg-secondary/50 rounded-xl p-5">
                  <p className="font-medium text-sm text-muted-foreground mb-1">If that's too hard right now:</p>
                  <p className="text-foreground leading-relaxed">{nextStep.fallback}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleGeneratePlan}
                  disabled={generatePlan.isPending}
                  className="w-full rounded-full h-12 bg-gradient-to-r from-primary to-primary/80"
                >
                  {generatePlan.isPending ? "Building your plan..." : "Build My 30-Day Plan"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/experts")}
                  className="w-full rounded-full h-12"
                >
                  Ask a Question Instead
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
