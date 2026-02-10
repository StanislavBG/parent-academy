import { motion } from "framer-motion";
import { Calendar, CheckCircle, Target, TrendingUp, AlertCircle, ArrowRight, ClipboardList } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useActivePlan, useSession, useGeneratePlan } from "@/hooks/use-parent-academy";
import type { WeeklyGoal, DailyAction, Script, IfThenRule } from "@shared/schema";

export default function Dashboard() {
  const { data: session } = useSession();
  const { data: plan, isLoading } = useActivePlan();
  const generatePlan = useGeneratePlan();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <ClipboardList className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold">No active coaching plan</h2>
        <p className="text-muted-foreground">
          {session?.parent?.onboardingComplete
            ? "Generate your personalized 30-day plan to get started."
            : "Complete the baseline assessment to get your personalized plan."}
        </p>
        {session?.parent?.onboardingComplete ? (
          <Button
            onClick={() => generatePlan.mutateAsync()}
            disabled={generatePlan.isPending}
            className="rounded-full px-8 h-12"
          >
            {generatePlan.isPending ? "Building..." : "Generate My Plan"}
          </Button>
        ) : (
          <Button onClick={() => setLocation("/onboarding")} className="rounded-full px-8 h-12">
            Start Baseline Assessment
          </Button>
        )}
      </div>
    );
  }

  const weeklyGoals = (plan.weeklyGoals as WeeklyGoal[]) || [];
  const dailyActions = (plan.dailyActions as DailyAction[]) || [];
  const scripts = (plan.scripts as Script[]) || [];
  const ifThenRules = (plan.ifThenGuidance as IfThenRule[]) || [];
  const currentWeek = plan.currentWeek;
  const currentWeekGoal = weeklyGoals.find(g => g.week === currentWeek);

  // Get this week's daily actions
  const startDay = (currentWeek - 1) * 7 + 1;
  const endDay = currentWeek * 7;
  const weekActions = dailyActions.filter(a => a.day >= startDay && a.day <= endDay);
  const completedActions = weekActions.filter(a => a.completed).length;
  const completionRate = weekActions.length > 0 ? (completedActions / weekActions.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">{plan.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Week {currentWeek} of 4</p>
          <Progress value={(currentWeek / 4) * 100} className="w-32 mt-1" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start gap-2 rounded-xl"
          onClick={() => setLocation("/tracking")}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium">Track Today</span>
          </div>
          <span className="text-xs text-muted-foreground">10 seconds</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start gap-2 rounded-xl"
          onClick={() => setLocation("/experts")}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-medium">Ask an Expert</span>
          </div>
          <span className="text-xs text-muted-foreground">Quick answer</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start gap-2 rounded-xl"
          onClick={() => setLocation("/tracking")}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="font-medium">View Progress</span>
          </div>
          <span className="text-xs text-muted-foreground">Weekly trends</span>
        </Button>
      </div>

      {/* Current Week Goal */}
      {currentWeekGoal && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-bold">This Week's Goal</h3>
              <p className="text-sm mt-1">{currentWeekGoal.goal}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {currentWeekGoal.metrics.map((m, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Actions */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          This Week's Actions
        </h3>
        <div className="space-y-3">
          {weekActions.length > 0 ? weekActions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                action.completed ? "bg-green-500 border-green-500" : "border-muted-foreground/30"
              }`}>
                {action.completed && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className={`text-sm ${action.completed ? "line-through text-muted-foreground" : ""}`}>
                  {action.action}
                </p>
                <span className="text-xs text-muted-foreground capitalize">{action.category}</span>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Actions will appear as you progress through the plan.</p>
          )}
        </div>
        {weekActions.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Progress value={completionRate} className="flex-1" />
            <span className="text-xs text-muted-foreground">{completedActions}/{weekActions.length}</span>
          </div>
        )}
      </Card>

      {/* Scripts */}
      {scripts.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Scripts for Common Moments</h3>
          <div className="space-y-4">
            {scripts.slice(0, 3).map((script, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">When: {script.situation}</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-700 mb-1">Say this:</p>
                  <p className="text-sm text-green-800">"{script.whatToSay}"</p>
                </div>
                {script.whatNotToSay && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Avoid:</p>
                    <p className="text-sm text-red-800">"{script.whatNotToSay}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* If-Then Guidance */}
      {ifThenRules.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">If-Then Guidance</h3>
          <div className="space-y-3">
            {ifThenRules.map((rule, i) => (
              <div key={i} className="border rounded-xl p-4">
                <p className="text-sm">
                  <span className="font-medium text-amber-600">IF</span> {rule.trigger}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium text-green-600">THEN</span> {rule.response}
                </p>
                {rule.fallback && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    <span className="font-medium">Fallback:</span> {rule.fallback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
