import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingDown, TrendingUp, Minus, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useActivePlan, useTrackingEntries, useCreateTrackingEntry, useGenerateCheckIn, useCheckIns } from "@/hooks/use-parent-academy";
import { useToast } from "@/hooks/use-toast";

export default function Tracking() {
  const { data: plan } = useActivePlan();
  const planId = plan?.id || 0;
  const { data: entries } = useTrackingEntries(planId);
  const { data: checkInsList } = useCheckIns(planId);
  const createEntry = useCreateTrackingEntry();
  const generateCheckIn = useGenerateCheckIn();
  const { toast } = useToast();

  const [tantrumCount, setTantrumCount] = useState(0);
  const [intensity, setIntensity] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(true);

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-display font-bold">No active plan to track</h2>
        <p className="text-muted-foreground">Start a coaching plan first, then track daily progress here.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    try {
      await createEntry.mutateAsync({
        planId: plan.id,
        tantrumCount,
        tantrumIntensity: intensity,
        parentConfidence: confidence,
        notes: notes || undefined,
      });
      setShowForm(false);
      toast({ title: "Tracked!", description: "Today's entry saved. Keep it up!" });
    } catch (err) {
      toast({ title: "Error", description: "Could not save entry", variant: "destructive" });
    }
  };

  const handleCheckIn = async () => {
    try {
      await generateCheckIn.mutateAsync();
      toast({ title: "Check-in complete!", description: "Your plan has been updated." });
    } catch (err) {
      toast({ title: "Error", description: "Could not generate check-in", variant: "destructive" });
    }
  };

  // Calculate trends from entries
  const recentEntries = (entries || []).slice(0, 7);
  const olderEntries = (entries || []).slice(7, 14);

  const avgRecent = (field: string) => {
    const vals = recentEntries.map((e: any) => e[field]).filter(Boolean) as number[];
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  };
  const avgOlder = (field: string) => {
    const vals = olderEntries.map((e: any) => e[field]).filter(Boolean) as number[];
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  };

  const getTrend = (field: string) => {
    const recent = avgRecent(field);
    const older = avgOlder(field);
    if (recent === null || older === null) return "neutral";
    if (recent < older) return "improving";
    if (recent > older) return "worsening";
    return "neutral";
  };

  const TrendIcon = ({ trend, invert }: { trend: string; invert?: boolean }) => {
    const improving = invert ? trend === "worsening" : trend === "improving";
    const worsening = invert ? trend === "improving" : trend === "worsening";
    if (improving) return <TrendingDown className="w-4 h-4 text-green-500" />;
    if (worsening) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Progress Tracking</h1>
          <p className="text-muted-foreground text-sm">Week {plan.currentWeek} of 4</p>
        </div>
        <Button
          onClick={handleCheckIn}
          disabled={generateCheckIn.isPending}
          variant="outline"
          className="rounded-full"
        >
          {generateCheckIn.isPending ? "Analyzing..." : "Weekly Check-in"}
        </Button>
      </div>

      {/* Quick Tracking Form */}
      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 space-y-6 border-primary/20">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Track Today
            </h3>

            <div className="space-y-5">
              {/* Tantrum count */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Tantrums / meltdowns today</label>
                  <span className="text-sm font-bold text-primary">{tantrumCount}</span>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <Button
                      key={n}
                      variant={tantrumCount === n ? "default" : "outline"}
                      size="sm"
                      className="rounded-full w-10 h-10"
                      onClick={() => setTantrumCount(n)}
                    >
                      {n}{n === 5 ? "+" : ""}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Intensity */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Intensity (worst episode)</label>
                  <span className="text-sm font-bold text-primary">{intensity}/5</span>
                </div>
                <Slider
                  value={[intensity]}
                  onValueChange={([v]) => setIntensity(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>

              {/* Parent confidence */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Your confidence today</label>
                  <span className="text-sm font-bold text-primary">{confidence}/5</span>
                </div>
                <Slider
                  value={[confidence]}
                  onValueChange={([v]) => setConfidence(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Struggling</span>
                  <span>Confident</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What happened? Any patterns?"
                  className="w-full min-h-[60px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createEntry.isPending}
              className="w-full rounded-full h-12"
            >
              {createEntry.isPending ? "Saving..." : "Save Today's Entry"}
            </Button>
          </Card>
        </motion.div>
      ) : (
        <Card className="p-6 text-center space-y-3 border-green-200 bg-green-50">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
          <p className="font-medium text-green-700">Today is tracked!</p>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="rounded-full">
            Edit today's entry
          </Button>
        </Card>
      )}

      {/* Trends */}
      {recentEntries.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Trends This Week</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <TrendIcon trend={getTrend("tantrumCount")} />
                <span className="text-2xl font-bold">{avgRecent("tantrumCount")?.toFixed(1) || "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg tantrums/day</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <TrendIcon trend={getTrend("tantrumIntensity")} />
                <span className="text-2xl font-bold">{avgRecent("tantrumIntensity")?.toFixed(1) || "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg intensity</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <TrendIcon trend={getTrend("parentConfidence")} invert />
                <span className="text-2xl font-bold">{avgRecent("parentConfidence")?.toFixed(1) || "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>
        </Card>
      )}

      {/* Check-in History */}
      {(checkInsList || []).length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Check-in History</h3>
          <div className="space-y-4">
            {(checkInsList || []).map((ci: any, i: number) => (
              <div key={i} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Week {ci.week} Check-in</p>
                  <span className="text-xs text-muted-foreground">{new Date(ci.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{ci.summary}</div>
                {(ci.improvements as string[] || []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Improvements:</p>
                    {(ci.improvements as string[]).map((imp, j) => (
                      <p key={j} className="text-xs text-green-700">+ {imp}</p>
                    ))}
                  </div>
                )}
                {ci.nextWeekFocus && (
                  <p className="text-xs text-primary font-medium">Next week: {ci.nextWeekFocus}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Entry History */}
      {recentEntries.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Recent Entries</h3>
          <div className="space-y-2">
            {recentEntries.map((entry: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm">
                <span className="text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                <div className="flex gap-4">
                  <span>Tantrums: <strong>{entry.tantrumCount ?? "—"}</strong></span>
                  <span>Intensity: <strong>{entry.tantrumIntensity ?? "—"}/5</strong></span>
                  <span>Confidence: <strong>{entry.parentConfidence ?? "—"}/5</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
