import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, onboardingBaselineSchema, trackingEntryInputSchema, sendMessageSchema, settingsSchema } from "@shared/routes";
import { z } from "zod";
import { randomUUID } from "crypto";
import { AGENT_PROFILES, type AgentType } from "./agents/types";
import { initializeAgentEngine, processConversation, generateCoachingPlan, analyzeCheckIn } from "./agents/engine";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize the bilko-flow agent engine
  initializeAgentEngine();

  // ── Session Management ──

  app.post(api.session.create.path, async (req, res) => {
    const token = randomUUID();
    const parent = await storage.createParent({ sessionToken: token });
    res.status(201).json({ token, parent });
  });

  app.get(api.session.get.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });
    const profiles = await storage.getChildProfiles(parent.id);
    const activePlan = await storage.getActivePlan(parent.id);
    res.json({ parent, profiles, activePlan });
  });

  // ── Onboarding ──

  app.post(api.onboarding.baseline.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });

    try {
      const input = onboardingBaselineSchema.parse(req.body);

      // Create child profile
      const childProfile = await storage.createChildProfile({
        parentId: parent.id,
        ageInMonths: input.childAgeMonths,
        challenges: input.challenges,
      });

      // Create baseline
      const baseline = await storage.createBaseline({
        parentId: parent.id,
        childProfileId: childProfile.id,
        goals: input.goals,
        challenges: input.challenges,
        triggers: input.triggers,
        intensity: input.intensity,
      });

      // Mark onboarding complete
      await storage.updateParent(parent.id, { onboardingComplete: true });

      // Generate initial "next best step" response
      const primaryChallenge = input.challenges[0] || "general parenting";
      const nextStep = getNextBestStep(primaryChallenge, input.childAgeMonths);

      res.status(201).json({
        childProfile,
        baseline,
        nextStep,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ── Child Profiles ──

  app.get(api.childProfiles.list.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });
    const profiles = await storage.getChildProfiles(parent.id);
    res.json(profiles);
  });

  app.put("/api/child-profiles/:id", async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });

    try {
      const input = settingsSchema.parse(req.body);
      const id = parseInt(req.params.id);
      const updated = await storage.updateChildProfile(id, {
        ...(input.childAgeMonths !== undefined && { ageInMonths: input.childAgeMonths }),
        ...(input.challenges && { challenges: input.challenges }),
        ...(input.behavioralContext !== undefined && { behavioralContext: input.behavioralContext }),
        ...(input.routineNotes !== undefined && { routineNotes: input.routineNotes }),
      });
      if (!updated) return res.status(404).json({ message: "Profile not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ── Coaching Plans ──

  app.get(api.plans.active.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });
    const plan = await storage.getActivePlan(parent.id);
    res.json(plan || null);
  });

  app.get("/api/plans/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const plan = await storage.getCoachingPlan(id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  });

  app.post(api.plans.generate.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });

    const baseline = await storage.getBaselineByParent(parent.id);
    if (!baseline) return res.status(400).json({ message: "Complete baseline assessment first" });

    const profiles = await storage.getChildProfiles(parent.id);
    const childProfile = profiles[0];
    if (!childProfile) return res.status(400).json({ message: "No child profile found" });

    // Generate plan using bilko-flow workflow
    const planData = await generateCoachingPlan({
      childAgeMonths: childProfile.ageInMonths,
      challenges: (baseline.challenges as string[]) || [],
      goals: (baseline.goals as string[]) || [],
      intensity: (baseline.intensity as "low" | "medium" | "high") || "medium",
      triggers: baseline.triggers as string[] | undefined,
    });

    const plan = await storage.createCoachingPlan({
      parentId: parent.id,
      childProfileId: childProfile.id,
      baselineId: baseline.id,
      title: planData.title,
      description: planData.description,
      weeklyGoals: planData.weeklyGoals,
      dailyActions: planData.dailyActions,
      scripts: planData.scripts,
      ifThenGuidance: planData.ifThenGuidance,
      status: "active",
    });

    res.status(201).json(plan);
  });

  // ── Tracking ──

  app.get("/api/tracking/:planId", async (req, res) => {
    const planId = parseInt(req.params.planId);
    const entries = await storage.getTrackingEntries(planId);
    res.json(entries);
  });

  app.post(api.tracking.create.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });

    try {
      const input = trackingEntryInputSchema.parse(req.body);
      const entry = await storage.createTrackingEntry({
        parentId: parent.id,
        ...input,
      });
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ── Check-ins ──

  app.get("/api/check-ins/:planId", async (req, res) => {
    const planId = parseInt(req.params.planId);
    const checkInsList = await storage.getCheckIns(planId);
    res.json(checkInsList);
  });

  app.post(api.checkIns.generate.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });

    const plan = await storage.getActivePlan(parent.id);
    if (!plan) return res.status(400).json({ message: "No active plan" });

    const entries = await storage.getTrackingEntries(plan.id);
    const weekEntries = entries.slice(0, 7); // Most recent week

    const avgTantrums = average(weekEntries.map(e => e.tantrumCount).filter(Boolean) as number[]);
    const avgIntensity = average(weekEntries.map(e => e.tantrumIntensity).filter(Boolean) as number[]);
    const avgConfidence = average(weekEntries.map(e => e.parentConfidence).filter(Boolean) as number[]);

    const analysis = await analyzeCheckIn({
      planId: plan.id,
      week: plan.currentWeek,
      trackingData: {
        avgTantrums: avgTantrums || undefined,
        avgIntensity: avgIntensity || undefined,
        avgConfidence: avgConfidence || undefined,
        actionsCompletedRate: weekEntries.length > 0
          ? weekEntries.filter(e => (e.actionsCompleted as string[] || []).length > 0).length / weekEntries.length
          : undefined,
      },
    });

    const checkIn = await storage.createCheckIn({
      parentId: parent.id,
      planId: plan.id,
      week: plan.currentWeek,
      type: "weekly",
      summary: analysis.summary,
      improvements: analysis.improvements,
      struggles: analysis.struggles,
      planAdjustments: analysis.planAdjustments,
      nextWeekFocus: analysis.nextWeekFocus,
    });

    // Advance the plan week
    await storage.updateCoachingPlan(plan.id, { currentWeek: plan.currentWeek + 1 });

    res.status(201).json(checkIn);
  });

  // ── Conversations ──

  app.get(api.conversations.list.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });
    const convs = await storage.getConversations(parent.id);
    res.json(convs);
  });

  app.get("/api/conversations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const conv = await storage.getConversation(id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    const msgs = await storage.getMessages(conv.id);
    res.json({ conversation: conv, messages: msgs });
  });

  app.post(api.conversations.sendMessage.path, async (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (!token) return res.status(401).json({ message: "Session token required" });
    const parent = await storage.getParentByToken(token);
    if (!parent) return res.status(404).json({ message: "Session not found" });

    try {
      const input = sendMessageSchema.parse(req.body);
      const agentType = input.agentType as AgentType;

      // Get or create conversation
      let conversationId = input.conversationId;
      if (!conversationId) {
        const conv = await storage.createConversation({
          parentId: parent.id,
          agentType,
          mode: input.mode,
          title: input.message.substring(0, 60),
        });
        conversationId = conv.id;
      }

      // Save parent message
      await storage.createMessage({
        conversationId,
        role: "parent",
        content: input.message,
      });

      // Build agent context
      const profiles = await storage.getChildProfiles(parent.id);
      const childProfile = profiles[0];
      const plan = await storage.getActivePlan(parent.id);
      const existingMessages = await storage.getMessages(conversationId);

      const context = {
        parentId: parent.id,
        childAgeMonths: childProfile?.ageInMonths,
        challenges: childProfile?.challenges as string[] | undefined,
        currentPlan: plan ? {
          id: plan.id,
          week: plan.currentWeek,
          dailyActions: (plan.dailyActions as any[])?.map((a: any) => a.action) || [],
        } : undefined,
        conversationHistory: existingMessages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
        mode: input.mode as "chat" | "roleplay-parent" | "roleplay-child",
      };

      // Process through agent engine (bilko-flow workflow)
      const response = await processConversation(agentType, input.message, context);

      // Save agent response
      const agentMessage = await storage.createMessage({
        conversationId,
        role: "agent",
        content: response.content,
        safetyFlag: response.safetyFlag,
        metadata: {
          agentType,
          suggestedActions: response.suggestedActions,
          followUpQuestion: response.followUpQuestion,
          escalation: response.escalation,
        },
      });

      res.json({
        conversationId,
        message: agentMessage,
        suggestedActions: response.suggestedActions,
        followUpQuestion: response.followUpQuestion,
        escalation: response.escalation,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ── Agents ──

  app.get(api.agents.list.path, async (_req, res) => {
    res.json(Object.values(AGENT_PROFILES));
  });

  return httpServer;
}

// ── Helpers ──

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getNextBestStep(challenge: string, ageMonths: number): { action: string; fallback: string } {
  const steps: Record<string, { action: string; fallback: string }> = {
    tantrums: {
      action: "The next time a tantrum starts, get down to eye level and say calmly: 'I can see you're really upset. I'm right here.' Don't try to reason — just be present.",
      fallback: "If that feels too hard right now, make sure they're safe, step back 3 feet, and take 3 slow breaths yourself. Your calm is the most powerful tool.",
    },
    bedtime: {
      action: "Tonight, try a simple 3-step routine: dim lights → one book → one song. Start 15 minutes earlier than usual and keep it under 30 minutes.",
      fallback: "If bedtime is already a battle tonight, just focus on one thing: dim the lights in the house 30 minutes before you want them in bed.",
    },
    transitions: {
      action: "Before the next transition, give a 5-minute warning, then a 2-minute warning. At transition time, offer a choice: 'Would you like to walk or hop to [next activity]?'",
      fallback: "If warnings aren't working yet, try bringing a piece of the current activity along: 'Bring your truck to the dinner table — it can watch you eat!'",
    },
    hitting: {
      action: "Next time hitting starts, gently catch their hand and say: 'I won't let you hit. Hitting hurts. You can squeeze this pillow or stomp your feet instead.'",
      fallback: "If it happens too fast to catch, address it calmly after: 'That was a hit. Hitting hurts. Let's practice gentle hands right now.'",
    },
    "picky eating": {
      action: "At the next meal, put one food you know they'll eat alongside something new. Don't comment on whether they eat the new food. Just let it be there.",
      fallback: "If meals feel stressful, start with the no-pressure rule: you decide what's on the plate, they decide what (and how much) to eat from it.",
    },
    "sibling conflict": {
      action: "Today, give each child 10 minutes of one-on-one time doing something they choose. This is the single most effective way to reduce sibling conflict.",
      fallback: "If you can't find 10 minutes each, even 5 minutes of focused attention — phone down, just them — makes a real difference.",
    },
    "school refusal": {
      action: "Tomorrow morning, validate first: 'I know mornings are hard. Let's just do the next small step together.' Focus on one micro-step at a time, not the whole morning.",
      fallback: "If the morning is already overwhelming, try preparing everything the night before and creating a visual checklist together tonight.",
    },
  };

  const key = challenge.toLowerCase();
  return steps[key] || {
    action: "Start by observing today: when do the hardest moments happen? What comes right before them? Write down 1-2 patterns you notice.",
    fallback: "If today is too hard for observation, just take 5 minutes for yourself. You can't pour from an empty cup, and seeking help already shows strength.",
  };
}
