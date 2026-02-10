import { pgTable, text, serial, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Parent profiles (no PII — no names, no birth dates) ──
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  sessionsUsed: integer("sessions_used").default(0).notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false),
});

// ── Child profiles (age in months, no names) ──
export const childProfiles = pgTable("child_profiles", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  ageInMonths: integer("age_in_months").notNull(),
  challenges: jsonb("challenges").$type<string[]>().default([]),
  routineNotes: text("routine_notes"),
  behavioralContext: text("behavioral_context"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Baseline assessments ──
export const baselines = pgTable("baselines", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  childProfileId: integer("child_profile_id").notNull(),
  goals: jsonb("goals").$type<string[]>().default([]),
  challenges: jsonb("challenges").$type<string[]>().default([]),
  triggers: jsonb("triggers").$type<string[]>(),
  intensity: text("intensity"), // low | medium | high
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── 30-day coaching plans ──
export const coachingPlans = pgTable("coaching_plans", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  childProfileId: integer("child_profile_id").notNull(),
  baselineId: integer("baseline_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  weeklyGoals: jsonb("weekly_goals").$type<WeeklyGoal[]>().default([]),
  dailyActions: jsonb("daily_actions").$type<DailyAction[]>().default([]),
  scripts: jsonb("scripts").$type<Script[]>().default([]),
  ifThenGuidance: jsonb("if_then_guidance").$type<IfThenRule[]>().default([]),
  status: text("status").default("active").notNull(), // active | paused | completed
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  currentWeek: integer("current_week").default(1).notNull(),
  // bilko-flow workflow tracking
  workflowId: text("workflow_id"),
  runId: text("run_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Daily tracking entries ──
export const trackingEntries = pgTable("tracking_entries", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  planId: integer("plan_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  tantrumCount: integer("tantrum_count"),
  tantrumIntensity: integer("tantrum_intensity"), // 1-5
  bedtimeDurationMins: integer("bedtime_duration_mins"),
  meltdownDurationMins: integer("meltdown_duration_mins"),
  transitionConflicts: integer("transition_conflicts"),
  parentConfidence: integer("parent_confidence"), // 1-5
  actionsCompleted: jsonb("actions_completed").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Weekly check-ins ──
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  planId: integer("plan_id").notNull(),
  week: integer("week").notNull(),
  type: text("type").notNull(), // weekly | midweek | pulse
  summary: text("summary"),
  improvements: jsonb("improvements").$type<string[]>().default([]),
  struggles: jsonb("struggles").$type<string[]>().default([]),
  planAdjustments: jsonb("plan_adjustments").$type<string[]>().default([]),
  nextWeekFocus: text("next_week_focus"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Conversations with expert agents ──
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  agentType: text("agent_type").notNull(), // behavior | milestones | sleep | nutrition | emotions | safety
  mode: text("mode").default("chat").notNull(), // chat | roleplay-parent | roleplay-child
  title: text("title"),
  // bilko-flow workflow tracking
  workflowId: text("workflow_id"),
  runId: text("run_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Messages within conversations ──
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // parent | agent | system
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  safetyFlag: boolean("safety_flag").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Type definitions for JSON columns ──
export interface WeeklyGoal {
  week: number;
  goal: string;
  metrics: string[];
}

export interface DailyAction {
  day: number;
  action: string;
  category: string;
  completed?: boolean;
}

export interface Script {
  situation: string;
  whatToSay: string;
  whatNotToSay?: string;
}

export interface IfThenRule {
  trigger: string;
  response: string;
  fallback?: string;
}

// ── Zod schemas for validation ──
export const insertParentSchema = createInsertSchema(parents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChildProfileSchema = createInsertSchema(childProfiles).omit({ id: true, createdAt: true });
export const insertBaselineSchema = createInsertSchema(baselines).omit({ id: true, createdAt: true });
export const insertCoachingPlanSchema = createInsertSchema(coachingPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrackingEntrySchema = createInsertSchema(trackingEntries).omit({ id: true, createdAt: true });
export const insertCheckInSchema = createInsertSchema(checkIns).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// ── Inferred types ──
export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;
export type ChildProfile = typeof childProfiles.$inferSelect;
export type InsertChildProfile = z.infer<typeof insertChildProfileSchema>;
export type Baseline = typeof baselines.$inferSelect;
export type InsertBaseline = z.infer<typeof insertBaselineSchema>;
export type CoachingPlan = typeof coachingPlans.$inferSelect;
export type InsertCoachingPlan = z.infer<typeof insertCoachingPlanSchema>;
export type TrackingEntry = typeof trackingEntries.$inferSelect;
export type InsertTrackingEntry = z.infer<typeof insertTrackingEntrySchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Keep legacy items table for compatibility during migration
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  completed: boolean("completed").default(false),
});
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
