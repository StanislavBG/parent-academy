/**
 * Parent Academy Agent Engine.
 *
 * Orchestrates agent workflows using bilko-flow's engine components.
 * Each conversation/plan/check-in is modeled as a workflow run.
 */

import type { AgentType, AgentContext, AgentResponse, PlanGenerationInput, CheckInInput } from "./types";
import { AGENT_PROFILES } from "./types";
import { checkSafety, generateSafetyResponse } from "./safety";
import {
  createConversationWorkflow,
  createPlanGenerationWorkflow,
  createCheckInWorkflow,
} from "./workflows";
import { initBilko, executeWorkflow } from "./bilko-adapter";
import type {
  WeeklyGoal, DailyAction, Script, IfThenRule,
} from "@shared/schema";

// ── Initialize bilko-flow infrastructure ──

export function initializeAgentEngine() {
  initBilko().catch(() => {});
  console.log("[agents] Agent engine initialized");
}

// ── Conversation Agent ──

/** Process a parent message through the appropriate expert agent */
export async function processConversation(
  agentType: AgentType,
  message: string,
  context: AgentContext,
): Promise<AgentResponse> {
  // Step 1: Safety check (always first)
  const safetyResult = checkSafety(message);
  if (safetyResult.isHighRisk) {
    return {
      content: generateSafetyResponse(safetyResult),
      safetyFlag: true,
      escalation: {
        type: safetyResult.recommendedAction === "crisis" ? "crisis" : "professional",
        resources: safetyResult.crisisResources || [],
        message: "High-risk situation detected. Professional help recommended.",
      },
    };
  }

  // Step 2: Create and register the workflow via bilko-flow
  const workflow = createConversationWorkflow(agentType);

  const completedRun = await executeWorkflow(workflow, { message, context, agentType });
  if (completedRun) {
    const responseStep = completedRun.stepResults?.["agent-response"];
    if (responseStep?.status === "succeeded" && responseStep.outputs) {
      return responseStep.outputs as unknown as AgentResponse;
    }
  }

  // Fallback: generate response locally using agent knowledge base
  return generateLocalResponse(agentType, message, context);
}

/** Generate a response using the local agent knowledge base (no external AI) */
function generateLocalResponse(
  agentType: AgentType,
  message: string,
  context: AgentContext,
): AgentResponse {
  const profile = AGENT_PROFILES[agentType];
  const ageContext = context.childAgeMonths
    ? getAgeGroupLabel(context.childAgeMonths)
    : "your child";

  const lowerMsg = message.toLowerCase();

  // Route to specialized response generators
  if (context.mode === "roleplay-parent") {
    return generateRoleplayParentResponse(agentType, message, context);
  }
  if (context.mode === "roleplay-child") {
    return generateRoleplayChildResponse(agentType, message, context);
  }

  // Agent-specific knowledge base responses
  const responses = getAgentResponses(agentType, lowerMsg, ageContext, context);

  return {
    content: responses.content,
    safetyFlag: false,
    suggestedActions: responses.actions,
    followUpQuestion: responses.followUp,
  };
}

function getAgeGroupLabel(months: number): string {
  if (months < 12) return `your baby (${months} months)`;
  if (months < 24) return `your toddler (${months} months)`;
  if (months < 36) return `your 2-year-old`;
  if (months < 48) return `your 3-year-old`;
  if (months < 60) return `your 4-year-old`;
  if (months < 72) return `your 5-year-old`;
  return `your child (${Math.floor(months / 12)} years)`;
}

interface LocalResponse {
  content: string;
  actions?: string[];
  followUp?: string;
}

function getAgentResponses(agentType: AgentType, message: string, ageLabel: string, context: AgentContext): LocalResponse {
  switch (agentType) {
    case "behavior":
      return getBehaviorResponse(message, ageLabel, context);
    case "sleep":
      return getSleepResponse(message, ageLabel, context);
    case "nutrition":
      return getNutritionResponse(message, ageLabel, context);
    case "emotions":
      return getEmotionsResponse(message, ageLabel, context);
    case "milestones":
      return getMilestonesResponse(message, ageLabel, context);
    default:
      return getGeneralResponse(message, ageLabel);
  }
}

function getBehaviorResponse(msg: string, age: string, ctx: AgentContext): LocalResponse {
  if (msg.includes("tantrum") || msg.includes("meltdown")) {
    return {
      content: `Tantrums are a normal part of development for ${age}. Here's what to try right now:\n\n**Your next best step (next 10 minutes):**\nGet down to their eye level, speak in a calm, low voice: "I can see you're really upset. I'm right here." Don't try to reason during the peak — just be present and keep them safe.\n\n**If that feels too hard right now:**\nMake sure they're in a safe spot, then step back 3 feet. Take 3 slow breaths yourself. Your calm is the most powerful tool right now.\n\n**After the storm passes:**\nOnce they're calmer (usually 5–15 minutes), offer a hug and name the feeling: "You were so frustrated when I said no to the cookie. That's a big feeling."`,
      actions: [
        "Get down to eye level and validate the feeling",
        "Use a calm, low voice — don't match their volume",
        "After the meltdown, name the emotion together",
      ],
      followUp: "How often are the tantrums happening right now? (Times per day helps me tailor a plan.)",
    };
  }
  if (msg.includes("hit") || msg.includes("hitting") || msg.includes("aggression") || msg.includes("aggressive")) {
    return {
      content: `Hitting is very common at this age — it doesn't mean ${age} is "bad." It usually means they're overwhelmed and don't yet have the words or regulation skills to express it differently.\n\n**Your next best step:**\nBlock the hit gently and say: "I won't let you hit. Hitting hurts. You can stomp your foot or squeeze this pillow instead."\n\n**Key principle:** Stay calm and firm, not punitive. The goal is to teach an alternative, not shame the behavior.\n\n**If it keeps happening:**\nLook for the pattern — is it when they're hungry, tired, overstimulated, or during transitions? Knowing the trigger lets us prevent rather than react.`,
      actions: [
        "Block the hit and give an alternative action",
        "Stay calm — your regulation teaches theirs",
        "Look for patterns: tired, hungry, overstimulated?",
      ],
      followUp: "When does the hitting tend to happen most — at a certain time of day or during specific activities?",
    };
  }
  if (msg.includes("transition") || msg.includes("won't stop") || msg.includes("refuses to")) {
    return {
      content: `Transition struggles are one of the most common challenges. Children this age often get deeply absorbed and genuinely struggle to shift gears.\n\n**Your next best step:**\nGive a 5-minute warning, then a 2-minute warning. Use a consistent transition phrase: "In 2 minutes, it will be time to [next activity]. Would you like to walk or hop there?"\n\n**If they still resist:**\nOffer a small choice that gives them agency: "Do you want to bring your truck to the table, or park it in the garage first?" Choice reduces power struggles.\n\n**Script to try:**\n"I know it's hard to stop when you're having fun. Let's say bye-bye to the playground — we'll come back tomorrow!"`,
      actions: [
        "Give 5-min and 2-min warnings before transitions",
        "Offer two acceptable choices",
        "Use a consistent transition phrase or song",
      ],
    };
  }
  return getGeneralResponse(msg, age);
}

function getSleepResponse(msg: string, age: string, _ctx: AgentContext): LocalResponse {
  if (msg.includes("bedtime") || msg.includes("won't sleep") || msg.includes("sleep")) {
    return {
      content: `Bedtime resistance is very common for ${age}. The key is a predictable, calming routine that signals "sleep is coming."\n\n**Your next best step:**\nCreate a 3-step bedtime sequence (e.g., bath → book → song). Start at the same time every night. Keep the routine under 30 minutes.\n\n**If bedtime is taking over an hour:**\nMove bedtime 15 minutes later for 3 nights. A child who's actually tired will fall asleep faster. Then gradually shift earlier once the routine is working.\n\n**Environmental tips:**\n- Dim lights 30 min before bed\n- No screens 1 hour before\n- Keep the room cool and dark\n- A consistent white noise or calming music can help`,
      actions: [
        "Establish a 3-step bedtime routine",
        "Start the routine at the same time each night",
        "Dim lights 30 minutes before bed",
      ],
      followUp: "How long is bedtime currently taking from start of routine to asleep?",
    };
  }
  if (msg.includes("nap") || msg.includes("won't nap")) {
    return {
      content: `Nap resistance often means the nap timing needs adjusting for ${age}.\n\n**Quick guide by age:**\n- Under 12 months: 2-3 naps/day\n- 12-18 months: Transitioning to 1 nap\n- 18 months-3 years: 1 afternoon nap (1-2 hours)\n- 3-5 years: Quiet time even if no sleep\n\n**Your next best step:**\nIf they resist, don't force it. Offer "quiet time" in their room with books or soft toys for 30-45 minutes. The rest itself is valuable even without sleep.`,
      actions: [
        "Adjust nap timing to match age needs",
        "Offer quiet time as an alternative to forced naps",
        "Watch for tired cues: rubbing eyes, yawning, fussiness",
      ],
    };
  }
  return getGeneralResponse(msg, age);
}

function getNutritionResponse(msg: string, age: string, _ctx: AgentContext): LocalResponse {
  if (msg.includes("picky") || msg.includes("won't eat") || msg.includes("refuses food")) {
    return {
      content: `Picky eating is extremely normal for ${age} — it's part of how children learn about food and assert independence.\n\n**Your next best step:**\nServe one "safe" food they usually accept alongside the new food. No pressure to eat the new food. Just having it on the plate counts as exposure.\n\n**Key principle: Division of responsibility**\n- You decide WHAT to serve, WHEN, and WHERE\n- They decide WHETHER to eat and HOW MUCH\n\n**What NOT to do:**\n- Don't bribe ("eat your broccoli, then you get dessert")\n- Don't force bites\n- Don't make a separate meal\n\nIt can take 15-20 exposures before a child accepts a new food. Patience is the strategy.`,
      actions: [
        "Always include one accepted food at each meal",
        "No pressure — let them decide how much to eat",
        "Keep offering new foods without force",
      ],
      followUp: "How many foods does your child reliably accept right now?",
    };
  }
  return getGeneralResponse(msg, age);
}

function getEmotionsResponse(msg: string, age: string, _ctx: AgentContext): LocalResponse {
  if (msg.includes("anxious") || msg.includes("anxiety") || msg.includes("worried") || msg.includes("scared")) {
    return {
      content: `Anxiety in ${age} is more common than you might think. The goal isn't to eliminate anxiety — it's to help them build skills to manage it.\n\n**Your next best step:**\nValidate first: "I can see you're feeling worried. That's okay — everyone feels worried sometimes." Then help them name it: "Is it a little worry or a big worry?"\n\n**A tool to teach:**\n"Worry time" — set aside 5 minutes where they can tell you all their worries. Outside that time, gently redirect: "Let's save that for worry time."\n\n**When to seek professional help:**\nIf anxiety prevents daily activities (school refusal, can't sleep, won't eat, constant physical complaints) for more than 2 weeks, a pediatrician or child therapist can help.`,
      actions: [
        "Validate the feeling before trying to fix it",
        "Teach a worry management tool (worry time, deep breaths)",
        "Watch for daily functioning impact",
      ],
    };
  }
  if (msg.includes("sibling") || msg.includes("brother") || msg.includes("sister") || msg.includes("fighting")) {
    return {
      content: `Sibling conflict is one of the trickiest parts of parenting — but it's also where children learn negotiation, sharing, and empathy.\n\n**Your next best step:**\nDon't take sides or play judge. Instead: "I see two kids who both want the same toy. What could we do?" Let them propose solutions.\n\n**If it's physical:**\nSeparate first, talk later. "I'm going to keep you both safe. [Name], go to the couch. [Name], stay here. We'll talk in 2 minutes."\n\n**Prevention tip:**\nMake sure each child gets 10-15 minutes of one-on-one time with you daily. This dramatically reduces attention-seeking conflicts.`,
      actions: [
        "Coach problem-solving instead of refereeing",
        "Give each child daily one-on-one time",
        "Separate first if physical, talk when calm",
      ],
    };
  }
  return getGeneralResponse(msg, age);
}

function getMilestonesResponse(msg: string, age: string, ctx: AgentContext): LocalResponse {
  if (msg.includes("milestone") || msg.includes("delay") || msg.includes("behind") || msg.includes("not yet")) {
    const months = ctx.childAgeMonths || 24;
    return {
      content: `Every child develops at their own pace, and there's a wide range of "normal." That said, here's what's typical around ${months} months:\n\n${getMilestonesByAge(months)}\n\n**Your next best step:**\nPick one area where you'd like to support ${age} and focus on playful practice. Development happens through play, not drills.\n\n**When to talk to your pediatrician:**\nIf you notice your child has lost skills they previously had, or if they're significantly behind in multiple areas, a developmental screening can give you peace of mind and early support if needed.`,
      actions: [
        "Focus on one developmental area at a time",
        "Use play-based activities to support growth",
        "Track progress over weeks, not days",
      ],
      followUp: "Which area of development are you most curious or concerned about?",
    };
  }
  return getGeneralResponse(msg, age);
}

function getMilestonesByAge(months: number): string {
  if (months < 12) {
    return "**6-12 months typical milestones:**\n- Sits without support\n- Babbles with consonants (ba, da, ma)\n- Responds to own name\n- Picks up small objects\n- May start crawling or pulling to stand";
  }
  if (months < 24) {
    return "**12-24 months typical milestones:**\n- Walking independently\n- Using 10-50 words\n- Pointing to show interest\n- Simple pretend play\n- Following simple instructions";
  }
  if (months < 36) {
    return "**2-3 years typical milestones:**\n- Running and climbing\n- Using 2-3 word phrases\n- Parallel play alongside other children\n- Starting to sort shapes and colors\n- Growing independence ('me do it!')";
  }
  if (months < 48) {
    return "**3-4 years typical milestones:**\n- Sentences of 4-5 words\n- Cooperative play with peers\n- Can follow 2-3 step instructions\n- Draws a person with 2-4 body parts\n- Understands taking turns";
  }
  return "**4-6 years typical milestones:**\n- Tells stories and speaks clearly\n- Counts to 10+ and knows some letters\n- Dresses independently\n- Shows empathy for others' feelings\n- Complex imaginative play";
}

function getGeneralResponse(msg: string, age: string): LocalResponse {
  return {
    content: `Thank you for sharing that. As a parenting expert, I want to help you with ${age}.\n\nTo give you the best guidance, could you tell me a bit more about:\n1. What specific situation are you dealing with?\n2. How long has this been going on?\n3. What have you already tried?\n\nRemember: you're doing important work by seeking support. That alone shows how much you care.`,
    actions: [
      "Share more details about the specific challenge",
      "Consider starting a 30-day coaching plan",
      "Track daily patterns to find triggers",
    ],
    followUp: "What's the most challenging part of your day with your child right now?",
  };
}

// ── Role-Play Mode ──

function generateRoleplayParentResponse(agentType: AgentType, message: string, ctx: AgentContext): AgentResponse {
  const age = ctx.childAgeMonths ? getAgeGroupLabel(ctx.childAgeMonths) : "your child";
  return {
    content: `**Role-play mode: Practice your response**\n\n*Scenario: Your child is [acting out the behavior]. Let's practice what you'd say.*\n\nYou said: "${message}"\n\n**Feedback:**\nThat's a good start. Here's how to refine it:\n\n1. **Start with validation:** "I see you're really [feeling]..."\n2. **Set the boundary clearly:** "...and [the boundary]."\n3. **Offer the alternative:** "You can [acceptable alternative] instead."\n\n**Try this script:**\n"I can see you're really frustrated right now. It's not okay to [behavior]. You can [alternative] instead. I'm here to help you."\n\nWant to try again with this framework?`,
    safetyFlag: false,
    suggestedActions: ["Try the revised script", "Switch to a new scenario", "See the child's perspective"],
  };
}

function generateRoleplayChildResponse(agentType: AgentType, message: string, ctx: AgentContext): AgentResponse {
  const months = ctx.childAgeMonths || 30;
  const age = getAgeGroupLabel(months);
  return {
    content: `**Role-play mode: Understanding ${age}'s perspective**\n\n*I'm showing you how ${age} might experience this situation.*\n\n---\n\n*[As your child]:*\n"Everything feels SO BIG right now. I wanted that thing and you said no and my body got really hot and tight and I couldn't think anymore. I don't WANT to hit but my hands just did it before my brain could stop them. I feel bad about it after but I don't know how to say that."\n\n---\n\n**What this tells us:**\n- Children at ${months} months have immature prefrontal cortex — impulse control is still developing\n- The emotion is genuine and overwhelming to them\n- They often feel remorse but lack skills to express it\n- They need your help co-regulating, not punishment\n\n**What helps from their perspective:**\nWhen you stay calm, they feel safe. When you name their feeling, they start learning to name it themselves. When you offer an alternative, they build new pathways.`,
    safetyFlag: false,
    suggestedActions: ["Switch to practice as parent", "Ask about this developmental stage", "Return to normal chat"],
  };
}

// ── Plan Generation ──

/** Generate a 30-day coaching plan based on baseline assessment */
export async function generateCoachingPlan(input: PlanGenerationInput): Promise<{
  title: string;
  description: string;
  weeklyGoals: WeeklyGoal[];
  dailyActions: DailyAction[];
  scripts: Script[];
  ifThenGuidance: IfThenRule[];
}> {
  // Run through bilko-flow workflow (gracefully falls back)
  const workflow = createPlanGenerationWorkflow();
  await executeWorkflow(workflow, { ...input });

  // Generate plan locally based on assessment
  return generateLocalPlan(input);
}

function generateLocalPlan(input: PlanGenerationInput): {
  title: string;
  description: string;
  weeklyGoals: WeeklyGoal[];
  dailyActions: DailyAction[];
  scripts: Script[];
  ifThenGuidance: IfThenRule[];
} {
  const age = getAgeGroupLabel(input.childAgeMonths);
  const primaryChallenge = input.challenges[0] || "general behavior";
  const primaryGoal = input.goals[0] || "calmer days";

  const title = `30-Day ${capitalize(primaryChallenge)} Plan for ${age}`;
  const description = `A personalized coaching plan focused on ${primaryGoal} through daily micro-actions, scripts, and tracking.`;

  // Generate weekly goals
  const weeklyGoals: WeeklyGoal[] = [
    { week: 1, goal: "Establish awareness and baseline routines", metrics: ["Track daily occurrences", "Note triggers and patterns"] },
    { week: 2, goal: "Introduce 1-2 new strategies consistently", metrics: ["Use scripts at least 3x/day", "Rate your confidence daily"] },
    { week: 3, goal: "Refine approach based on what's working", metrics: ["Compare to week 1 baseline", "Adjust strategies as needed"] },
    { week: 4, goal: "Consolidate gains and plan next phase", metrics: ["Measure overall improvement", "Identify remaining challenges"] },
  ];

  // Generate daily actions based on challenges
  const dailyActions: DailyAction[] = generateDailyActionsForChallenges(input.challenges, input.intensity);

  // Generate scripts
  const scripts: Script[] = generateScriptsForChallenges(input.challenges);

  // Generate if-then guidance
  const ifThenGuidance: IfThenRule[] = generateIfThenForChallenges(input.challenges);

  return { title, description, weeklyGoals, dailyActions, scripts, ifThenGuidance };
}

function generateDailyActionsForChallenges(challenges: string[], intensity: string): DailyAction[] {
  const actions: DailyAction[] = [];
  let day = 1;

  const challengeActions: Record<string, string[]> = {
    tantrums: [
      "Practice 3 deep breaths with your child during a calm moment",
      "Give a 5-minute warning before every transition today",
      "Name one emotion you see your child experiencing",
      "Offer 2 choices instead of a direct instruction",
      "Spend 10 minutes of floor play following their lead",
    ],
    bedtime: [
      "Start your bedtime routine 15 minutes earlier today",
      "Do the same 3 steps in the same order tonight",
      "Dim lights 30 minutes before bed",
      "Read one book together as part of the routine",
      "Practice a calming activity before bed (gentle stretching, soft music)",
    ],
    transitions: [
      "Give a 5-minute and 2-minute warning before transitions",
      "Use a visual timer for transitions",
      "Offer a choice during one transition today",
      "Create a transition song or phrase",
      "Let them bring a comfort item between activities",
    ],
    hitting: [
      "Practice 'gentle hands' during a calm moment",
      "When hitting happens, block and redirect: 'You can hit this pillow instead'",
      "Give extra attention to positive physical contact (high fives, hugs)",
      "Identify and address the trigger before it escalates",
      "Role-play an alternative response to frustration",
    ],
    "picky eating": [
      "Include one safe food at every meal",
      "Let your child help with a simple food preparation step",
      "Try one new food alongside favorites — no pressure to eat it",
      "Eat together at the table without distractions",
      "Describe food with fun words (crunchy, squishy) instead of 'healthy'",
    ],
    "sibling conflict": [
      "Give each child 10 minutes of one-on-one time",
      "Coach them through one conflict instead of solving it for them",
      "Notice and praise cooperative moments out loud",
      "Set up one parallel activity they can do side by side",
      "Teach one feeling word to help them express needs",
    ],
    "school refusal": [
      "Validate the feeling: 'I know mornings are hard'",
      "Create a visual morning routine chart together",
      "Provide one small thing to look forward to after school",
      "Practice a goodbye ritual that gives them something to hold onto",
      "Connect with the teacher about what happens after drop-off",
    ],
  };

  // Map each challenge to daily actions
  for (const challenge of challenges) {
    const key = challenge.toLowerCase();
    const found = challengeActions[key] || challengeActions.tantrums;
    for (const action of found) {
      actions.push({ day: day++, action, category: challenge, completed: false });
    }
  }

  // Fill remaining days with general maintenance actions
  while (actions.length < 30) {
    actions.push({
      day: day++,
      action: intensity === "high"
        ? "Take 5 minutes for yourself today — you matter too"
        : "Reflect on one thing that went well today",
      category: "self-care",
      completed: false,
    });
  }

  return actions.slice(0, 30);
}

function generateScriptsForChallenges(challenges: string[]): Script[] {
  const allScripts: Script[] = [];

  const scriptBank: Record<string, Script[]> = {
    tantrums: [
      { situation: "Child starts screaming when told 'no'", whatToSay: "I hear you. You're really upset because you wanted [thing]. It's okay to be mad. I'm right here.", whatNotToSay: "Stop crying! You're fine!" },
      { situation: "Child throws things", whatToSay: "I won't let you throw that. You're frustrated. You can stomp your feet or squeeze this instead.", whatNotToSay: "If you throw one more thing..." },
      { situation: "After the tantrum passes", whatToSay: "That was a big feeling. You felt so angry when [trigger]. I love you even when things are hard.", whatNotToSay: "Are you done? Now say sorry." },
    ],
    bedtime: [
      { situation: "Child says 'I'm not tired'", whatToSay: "Your body needs rest even when your brain feels awake. Let's do our cozy routine and see how your body feels.", whatNotToSay: "You ARE tired, stop arguing!" },
      { situation: "Child keeps getting out of bed", whatToSay: "It's sleep time. I'll walk you back to bed. I love you. See you in the morning.", whatNotToSay: "If you get out of bed one more time..." },
    ],
    hitting: [
      { situation: "Child hits another child", whatToSay: "I'm going to stop you. Hitting hurts. Let's check if [friend] is okay. What were you trying to tell them?", whatNotToSay: "How would you like it if someone hit you?" },
      { situation: "Child hits the parent", whatToSay: "Ouch, that hurt me. I won't let you hit. You can tell me you're angry with your words.", whatNotToSay: "That's it, go to your room!" },
    ],
  };

  for (const challenge of challenges) {
    const key = challenge.toLowerCase();
    const scripts = scriptBank[key] || scriptBank.tantrums;
    allScripts.push(...scripts);
  }

  return allScripts;
}

function generateIfThenForChallenges(challenges: string[]): IfThenRule[] {
  const rules: IfThenRule[] = [];

  const ruleBank: Record<string, IfThenRule[]> = {
    tantrums: [
      { trigger: "Child starts whining or escalating", response: "Get down to their level, make eye contact, validate: 'I can see this is hard.'", fallback: "If you can't get calm, step back 3 feet and take 3 breaths first." },
      { trigger: "Tantrum happens in public", response: "Move to a quieter spot. 'We're going to take a break over here until you feel calmer.'", fallback: "If you need to leave, leave. Your child's regulation matters more than the errand." },
    ],
    bedtime: [
      { trigger: "Child resists starting the routine", response: "Offer a choice: 'Would you like to start with bath or pajamas?'", fallback: "Start with a calm activity they enjoy (reading, puzzles) to transition into bedtime mode." },
    ],
    hitting: [
      { trigger: "You see the arm pull back", response: "Catch the hand gently: 'I'm going to help your hands stay gentle. Tell me with words.'", fallback: "If you miss it, address it calmly after: 'That was a hit. Hitting hurts. Let's practice what to do instead.'" },
    ],
  };

  for (const challenge of challenges) {
    const key = challenge.toLowerCase();
    const found = ruleBank[key] || ruleBank.tantrums;
    rules.push(...found);
  }

  return rules;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Check-in Analysis ──

/** Analyze weekly check-in data and generate recommendations */
export async function analyzeCheckIn(input: CheckInInput): Promise<{
  summary: string;
  improvements: string[];
  struggles: string[];
  planAdjustments: string[];
  nextWeekFocus: string;
}> {
  // Run through bilko-flow workflow (gracefully falls back)
  const workflow = createCheckInWorkflow();
  await executeWorkflow(workflow, { ...input });

  return generateLocalCheckInAnalysis(input);
}

function generateLocalCheckInAnalysis(input: CheckInInput): {
  summary: string;
  improvements: string[];
  struggles: string[];
  planAdjustments: string[];
  nextWeekFocus: string;
} {
  const { trackingData, week } = input;
  const improvements: string[] = [];
  const struggles: string[] = [];
  const adjustments: string[] = [];

  if (trackingData.avgTantrums !== undefined) {
    if (trackingData.avgTantrums < 3) {
      improvements.push("Tantrum frequency is low — great consistency!");
    } else {
      struggles.push("Tantrums still frequent — let's look at triggers");
      adjustments.push("Add an extra 5-minute warning before the most challenging transition");
    }
  }

  if (trackingData.avgIntensity !== undefined) {
    if (trackingData.avgIntensity <= 2) {
      improvements.push("Meltdown intensity is decreasing");
    } else if (trackingData.avgIntensity >= 4) {
      struggles.push("Intensity remains high — consider simplifying the plan");
      adjustments.push("Focus on just one strategy this week instead of multiple");
    }
  }

  if (trackingData.avgConfidence !== undefined) {
    if (trackingData.avgConfidence >= 4) {
      improvements.push("Your confidence is growing — that makes a difference");
    } else if (trackingData.avgConfidence <= 2) {
      struggles.push("Confidence is low — let's make the plan easier to follow");
      adjustments.push("Reduce daily actions to just 1 focus area");
    }
  }

  if (trackingData.actionsCompletedRate !== undefined) {
    if (trackingData.actionsCompletedRate >= 0.7) {
      improvements.push(`Completed ${Math.round(trackingData.actionsCompletedRate * 100)}% of daily actions`);
    } else {
      struggles.push("Completion rate is low — the plan may be too ambitious");
      adjustments.push("Pick the 1-2 most impactful actions and set aside the rest");
    }
  }

  if (improvements.length === 0) {
    improvements.push("You showed up this week — that counts");
  }

  const summary = `**Week ${week} Summary**\n\n${improvements.length} areas of progress, ${struggles.length} areas to adjust. ${adjustments.length > 0 ? "I've suggested some changes to make next week more manageable." : "Keep going with the current plan."}`;

  const nextWeekFocus = struggles.length > 0
    ? `Focus on: ${struggles[0].replace("—", ":").split(":")[0].trim()}`
    : "Continue building on this week's momentum";

  return { summary, improvements, struggles, planAdjustments: adjustments, nextWeekFocus };
}
