import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, useChildProfiles, useUpdateChildProfile } from "@/hooks/use-parent-academy";
import { useToast } from "@/hooks/use-toast";

const ALL_CHALLENGES = [
  "Tantrums", "Bedtime", "Transitions", "Hitting", "Picky eating",
  "Sibling conflict", "School refusal", "Anxiety", "Aggression",
];

export default function Settings() {
  const { data: session } = useSession();
  const { data: profiles } = useChildProfiles();
  const updateProfile = useUpdateChildProfile();
  const { toast } = useToast();

  const profile = (profiles as any[])?.[0];

  const [ageMonths, setAgeMonths] = useState(24);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [behavioralContext, setBehavioralContext] = useState("");
  const [routineNotes, setRoutineNotes] = useState("");

  useEffect(() => {
    if (profile) {
      setAgeMonths(profile.ageInMonths || 24);
      setChallenges((profile.challenges as string[]) || []);
      setBehavioralContext(profile.behavioralContext || "");
      setRoutineNotes(profile.routineNotes || "");
    }
  }, [profile]);

  const toggleChallenge = (c: string) => {
    const lower = c.toLowerCase();
    setChallenges(prev => prev.includes(lower) ? prev.filter(v => v !== lower) : [...prev, lower]);
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        childAgeMonths: ageMonths,
        challenges,
        behavioralContext,
        routineNotes,
      });
      toast({ title: "Settings saved", description: "Your profile has been updated." });
    } catch (err) {
      toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your child's profile. No names or PII are stored.
        </p>
      </div>

      {/* Session Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Your Session</p>
            <p className="text-xs text-muted-foreground">
              Sessions used: {session?.parent?.sessionsUsed || 0} / 5 free
            </p>
          </div>
        </div>
      </Card>

      {/* Child Profile */}
      {profile ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-lg">Child Profile</h3>

            {/* Age */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Age in months</label>
                <span className="text-sm font-bold text-primary">
                  {ageMonths}mo{ageMonths >= 12 && ` (${Math.floor(ageMonths / 12)}y ${ageMonths % 12}m)`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={144}
                value={ageMonths}
                onChange={(e) => setAgeMonths(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Challenges */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current challenges</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CHALLENGES.map(c => (
                  <Button
                    key={c}
                    variant={challenges.includes(c.toLowerCase()) ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => toggleChallenge(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            {/* Behavioral context */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Behavioral context <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={behavioralContext}
                onChange={e => setBehavioralContext(e.target.value)}
                placeholder="Any high-level context about your child's behavior or temperament..."
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            {/* Routine notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Routine notes <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={routineNotes}
                onChange={e => setRoutineNotes(e.target.value)}
                placeholder="Daily routine, schedule, or any patterns worth noting..."
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="w-full rounded-full h-12"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfile.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </Card>
        </motion.div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Complete the onboarding process to create a child profile.
          </p>
        </Card>
      )}

      {/* Privacy Notice */}
      <Card className="p-6 bg-secondary/30">
        <h3 className="font-bold text-sm mb-2">Privacy</h3>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>No personally identifiable information (PII) is stored</li>
          <li>No names, birth dates, or location data</li>
          <li>Only age in months is used for developmental guidance</li>
          <li>Your data is used solely to personalize coaching</li>
        </ul>
      </Card>
    </div>
  );
}
