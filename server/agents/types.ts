/**
 * Parent Academy agent type definitions.
 *
 * Each agent is a child development specialist. Agents are modeled
 * as bilko-flow workflows with specialized step handlers.
 */

/** Available expert agent types */
export type AgentType =
  | "behavior"       // Tantrums, meltdowns, aggression, defiance
  | "milestones"     // Developmental milestones, growth tracking
  | "sleep"          // Bedtime routines, sleep regression, naps
  | "nutrition"      // Picky eating, mealtime, feeding challenges
  | "emotions"       // Emotional regulation, anxiety, social skills
  | "safety";        // Safety-first escalation agent

/** Agent mode for conversations */
export type AgentMode = "chat" | "roleplay-parent" | "roleplay-child";

/** Agent metadata */
export interface AgentProfile {
  type: AgentType;
  name: string;
  title: string;
  description: string;
  specialties: string[];
  icon: string;
}

/** Context provided to agent during execution */
export interface AgentContext {
  parentId: number;
  childAgeMonths?: number;
  challenges?: string[];
  goals?: string[];
  currentPlan?: {
    id: number;
    week: number;
    dailyActions: string[];
  };
  recentTracking?: {
    tantrumCount?: number;
    intensity?: number;
    confidence?: number;
  };
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
  mode: AgentMode;
}

/** Result from agent processing */
export interface AgentResponse {
  content: string;
  safetyFlag: boolean;
  suggestedActions?: string[];
  followUpQuestion?: string;
  escalation?: {
    type: "crisis" | "professional" | "medical";
    resources: string[];
    message: string;
  };
}

/** Safety signal detection result */
export interface SafetyCheck {
  isHighRisk: boolean;
  signals: string[];
  recommendedAction: "continue" | "escalate" | "crisis";
  crisisResources?: string[];
}

/** 30-day plan generation input */
export interface PlanGenerationInput {
  childAgeMonths: number;
  challenges: string[];
  goals: string[];
  intensity: "low" | "medium" | "high";
  triggers?: string[];
}

/** Weekly check-in analysis input */
export interface CheckInInput {
  planId: number;
  week: number;
  trackingData: {
    avgTantrums?: number;
    avgIntensity?: number;
    avgConfidence?: number;
    actionsCompletedRate?: number;
  };
  parentFeedback?: string;
}

/** All available agent profiles */
export const AGENT_PROFILES: Record<AgentType, AgentProfile> = {
  behavior: {
    type: "behavior",
    name: "Behavior Expert",
    title: "Child Behavior Specialist",
    description: "Specializes in tantrums, meltdowns, aggression, defiance, and behavioral regulation strategies.",
    specialties: ["tantrums", "meltdowns", "aggression", "defiance", "boundaries", "transitions"],
    icon: "Brain",
  },
  milestones: {
    type: "milestones",
    name: "Development Expert",
    title: "Child Development Specialist",
    description: "Tracks developmental milestones, provides age-appropriate activity guidance, and identifies potential delays.",
    specialties: ["motor skills", "language", "cognitive", "social", "play", "learning"],
    icon: "TrendingUp",
  },
  sleep: {
    type: "sleep",
    name: "Sleep Expert",
    title: "Pediatric Sleep Specialist",
    description: "Helps with bedtime routines, sleep regression, night waking, and healthy sleep habits.",
    specialties: ["bedtime", "naps", "sleep regression", "night waking", "routines"],
    icon: "Moon",
  },
  nutrition: {
    type: "nutrition",
    name: "Nutrition Expert",
    title: "Child Nutrition Specialist",
    description: "Addresses picky eating, mealtime battles, feeding challenges, and healthy eating habits.",
    specialties: ["picky eating", "mealtime", "feeding", "food introduction", "nutrition"],
    icon: "Apple",
  },
  emotions: {
    type: "emotions",
    name: "Emotions Expert",
    title: "Child Emotional Development Specialist",
    description: "Supports emotional regulation, anxiety management, social skills, and sibling dynamics.",
    specialties: ["emotions", "anxiety", "social skills", "sibling conflict", "empathy", "self-regulation"],
    icon: "Heart",
  },
  safety: {
    type: "safety",
    name: "Safety Advisor",
    title: "Safety & Escalation Specialist",
    description: "Handles high-risk situations, provides crisis resources, and ensures safety-first guidance.",
    specialties: ["crisis", "abuse", "self-harm", "domestic violence", "medical emergency", "postpartum"],
    icon: "ShieldAlert",
  },
};
