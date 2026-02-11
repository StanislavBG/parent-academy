import {
  parents, childProfiles, baselines, coachingPlans, trackingEntries,
  checkIns, conversations, messages,
  type Parent, type InsertParent,
  type ChildProfile, type InsertChildProfile,
  type Baseline, type InsertBaseline,
  type CoachingPlan, type InsertCoachingPlan,
  type TrackingEntry, type InsertTrackingEntry,
  type CheckIn, type InsertCheckIn,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Parents
  getParentByToken(token: string): Promise<Parent | undefined>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: number, updates: Partial<Parent>): Promise<Parent | undefined>;

  // Child profiles
  getChildProfiles(parentId: number): Promise<ChildProfile[]>;
  getChildProfile(id: number): Promise<ChildProfile | undefined>;
  createChildProfile(profile: InsertChildProfile): Promise<ChildProfile>;
  updateChildProfile(id: number, updates: Partial<ChildProfile>): Promise<ChildProfile | undefined>;

  // Baselines
  getBaseline(id: number): Promise<Baseline | undefined>;
  getBaselineByParent(parentId: number): Promise<Baseline | undefined>;
  createBaseline(baseline: InsertBaseline): Promise<Baseline>;

  // Coaching plans
  getCoachingPlan(id: number): Promise<CoachingPlan | undefined>;
  getActivePlan(parentId: number): Promise<CoachingPlan | undefined>;
  createCoachingPlan(plan: InsertCoachingPlan): Promise<CoachingPlan>;
  updateCoachingPlan(id: number, updates: Partial<CoachingPlan>): Promise<CoachingPlan | undefined>;

  // Tracking
  getTrackingEntries(planId: number): Promise<TrackingEntry[]>;
  createTrackingEntry(entry: InsertTrackingEntry): Promise<TrackingEntry>;

  // Check-ins
  getCheckIns(planId: number): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;

  // Conversations
  getConversations(parentId: number): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conv: InsertConversation): Promise<Conversation>;

  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

// ── PostgreSQL Storage (when DATABASE_URL is available) ──

export class DatabaseStorage implements IStorage {
  async getParentByToken(token: string): Promise<Parent | undefined> {
    const [parent] = await db!.select().from(parents).where(eq(parents.sessionToken, token));
    return parent;
  }

  async createParent(parent: InsertParent): Promise<Parent> {
    const [created] = await db!.insert(parents).values(parent).returning();
    return created;
  }

  async updateParent(id: number, updates: Partial<Parent>): Promise<Parent | undefined> {
    const [updated] = await db!.update(parents).set({ ...updates, updatedAt: new Date() }).where(eq(parents.id, id)).returning();
    return updated;
  }

  async getChildProfiles(parentId: number): Promise<ChildProfile[]> {
    return await db!.select().from(childProfiles).where(eq(childProfiles.parentId, parentId));
  }

  async getChildProfile(id: number): Promise<ChildProfile | undefined> {
    const [profile] = await db!.select().from(childProfiles).where(eq(childProfiles.id, id));
    return profile;
  }

  async createChildProfile(profile: InsertChildProfile): Promise<ChildProfile> {
    const [created] = await db!.insert(childProfiles).values(profile as any).returning();
    return created;
  }

  async updateChildProfile(id: number, updates: Partial<ChildProfile>): Promise<ChildProfile | undefined> {
    const [updated] = await db!.update(childProfiles).set(updates).where(eq(childProfiles.id, id)).returning();
    return updated;
  }

  async getBaseline(id: number): Promise<Baseline | undefined> {
    const [baseline] = await db!.select().from(baselines).where(eq(baselines.id, id));
    return baseline;
  }

  async getBaselineByParent(parentId: number): Promise<Baseline | undefined> {
    const [baseline] = await db!.select().from(baselines).where(eq(baselines.parentId, parentId)).orderBy(desc(baselines.createdAt)).limit(1);
    return baseline;
  }

  async createBaseline(baseline: InsertBaseline): Promise<Baseline> {
    const [created] = await db!.insert(baselines).values(baseline as any).returning();
    return created;
  }

  async getCoachingPlan(id: number): Promise<CoachingPlan | undefined> {
    const [plan] = await db!.select().from(coachingPlans).where(eq(coachingPlans.id, id));
    return plan;
  }

  async getActivePlan(parentId: number): Promise<CoachingPlan | undefined> {
    const [plan] = await db!.select().from(coachingPlans)
      .where(and(eq(coachingPlans.parentId, parentId), eq(coachingPlans.status, "active")))
      .orderBy(desc(coachingPlans.createdAt)).limit(1);
    return plan;
  }

  async createCoachingPlan(plan: InsertCoachingPlan): Promise<CoachingPlan> {
    const [created] = await db!.insert(coachingPlans).values(plan as any).returning();
    return created;
  }

  async updateCoachingPlan(id: number, updates: Partial<CoachingPlan>): Promise<CoachingPlan | undefined> {
    const [updated] = await db!.update(coachingPlans).set({ ...updates, updatedAt: new Date() }).where(eq(coachingPlans.id, id)).returning();
    return updated;
  }

  async getTrackingEntries(planId: number): Promise<TrackingEntry[]> {
    return await db!.select().from(trackingEntries).where(eq(trackingEntries.planId, planId)).orderBy(desc(trackingEntries.date));
  }

  async createTrackingEntry(entry: InsertTrackingEntry): Promise<TrackingEntry> {
    const [created] = await db!.insert(trackingEntries).values(entry as any).returning();
    return created;
  }

  async getCheckIns(planId: number): Promise<CheckIn[]> {
    return await db!.select().from(checkIns).where(eq(checkIns.planId, planId)).orderBy(desc(checkIns.createdAt));
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [created] = await db!.insert(checkIns).values(checkIn as any).returning();
    return created;
  }

  async getConversations(parentId: number): Promise<Conversation[]> {
    return await db!.select().from(conversations).where(eq(conversations.parentId, parentId)).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conv] = await db!.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const [created] = await db!.insert(conversations).values(conv).returning();
    return created;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return await db!.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db!.insert(messages).values(message).returning();
    return created;
  }
}

// ── In-Memory Storage (fallback when no DATABASE_URL) ──

export class MemoryStorage implements IStorage {
  private _parents: Parent[] = [];
  private _childProfiles: ChildProfile[] = [];
  private _baselines: Baseline[] = [];
  private _coachingPlans: CoachingPlan[] = [];
  private _trackingEntries: TrackingEntry[] = [];
  private _checkIns: CheckIn[] = [];
  private _conversations: Conversation[] = [];
  private _messages: Message[] = [];
  private _nextId = 1;

  private id() { return this._nextId++; }
  private now() { return new Date(); }

  async getParentByToken(token: string) {
    return this._parents.find(p => p.sessionToken === token);
  }
  async createParent(p: InsertParent): Promise<Parent> {
    const row: Parent = { id: this.id(), sessionToken: p.sessionToken, createdAt: this.now(), updatedAt: this.now(), sessionsUsed: 0, onboardingComplete: false };
    this._parents.push(row);
    return row;
  }
  async updateParent(id: number, updates: Partial<Parent>) {
    const p = this._parents.find(r => r.id === id);
    if (!p) return undefined;
    Object.assign(p, updates, { updatedAt: this.now() });
    return p;
  }

  async getChildProfiles(parentId: number) { return this._childProfiles.filter(c => c.parentId === parentId); }
  async getChildProfile(id: number) { return this._childProfiles.find(c => c.id === id); }
  async createChildProfile(p: InsertChildProfile): Promise<ChildProfile> {
    const row: ChildProfile = { id: this.id(), parentId: p.parentId, ageInMonths: p.ageInMonths, challenges: (p.challenges as string[]) || [], routineNotes: null, behavioralContext: null, createdAt: this.now() };
    this._childProfiles.push(row);
    return row;
  }
  async updateChildProfile(id: number, updates: Partial<ChildProfile>) {
    const c = this._childProfiles.find(r => r.id === id);
    if (!c) return undefined;
    Object.assign(c, updates);
    return c;
  }

  async getBaseline(id: number) { return this._baselines.find(b => b.id === id); }
  async getBaselineByParent(parentId: number) { return [...this._baselines].reverse().find(b => b.parentId === parentId); }
  async createBaseline(b: InsertBaseline): Promise<Baseline> {
    const row: Baseline = { id: this.id(), parentId: b.parentId, childProfileId: b.childProfileId, goals: (b.goals as string[]) || [], challenges: (b.challenges as string[]) || [], triggers: (b.triggers as string[] | null) || null, intensity: b.intensity || null, createdAt: this.now() };
    this._baselines.push(row);
    return row;
  }

  async getCoachingPlan(id: number) { return this._coachingPlans.find(p => p.id === id); }
  async getActivePlan(parentId: number) { return [...this._coachingPlans].reverse().find(p => p.parentId === parentId && p.status === "active"); }
  async createCoachingPlan(p: InsertCoachingPlan): Promise<CoachingPlan> {
    const row: CoachingPlan = {
      id: this.id(), parentId: p.parentId, childProfileId: p.childProfileId, baselineId: p.baselineId,
      title: p.title, description: p.description || null,
      weeklyGoals: (p.weeklyGoals as any) || [], dailyActions: (p.dailyActions as any) || [],
      scripts: (p.scripts as any) || [], ifThenGuidance: (p.ifThenGuidance as any) || [],
      status: p.status || "active", startDate: this.now(), endDate: null, currentWeek: 1,
      workflowId: null, runId: null, createdAt: this.now(), updatedAt: this.now(),
    };
    this._coachingPlans.push(row);
    return row;
  }
  async updateCoachingPlan(id: number, updates: Partial<CoachingPlan>) {
    const p = this._coachingPlans.find(r => r.id === id);
    if (!p) return undefined;
    Object.assign(p, updates, { updatedAt: this.now() });
    return p;
  }

  async getTrackingEntries(planId: number) { return this._trackingEntries.filter(e => e.planId === planId).reverse(); }
  async createTrackingEntry(e: InsertTrackingEntry): Promise<TrackingEntry> {
    const row: TrackingEntry = {
      id: this.id(), parentId: e.parentId, planId: e.planId, date: this.now(),
      tantrumCount: e.tantrumCount ?? null, tantrumIntensity: e.tantrumIntensity ?? null,
      bedtimeDurationMins: e.bedtimeDurationMins ?? null, meltdownDurationMins: e.meltdownDurationMins ?? null,
      transitionConflicts: e.transitionConflicts ?? null, parentConfidence: e.parentConfidence ?? null,
      actionsCompleted: (e.actionsCompleted as string[]) || [], notes: e.notes || null, createdAt: this.now(),
    };
    this._trackingEntries.push(row);
    return row;
  }

  async getCheckIns(planId: number) { return this._checkIns.filter(c => c.planId === planId).reverse(); }
  async createCheckIn(c: InsertCheckIn): Promise<CheckIn> {
    const row: CheckIn = {
      id: this.id(), parentId: c.parentId, planId: c.planId, week: c.week, type: c.type,
      summary: c.summary || null, improvements: (c.improvements as string[]) || [],
      struggles: (c.struggles as string[]) || [], planAdjustments: (c.planAdjustments as string[]) || [],
      nextWeekFocus: c.nextWeekFocus || null, createdAt: this.now(),
    };
    this._checkIns.push(row);
    return row;
  }

  async getConversations(parentId: number) { return this._conversations.filter(c => c.parentId === parentId).reverse(); }
  async getConversation(id: number) { return this._conversations.find(c => c.id === id); }
  async createConversation(c: InsertConversation): Promise<Conversation> {
    const row: Conversation = {
      id: this.id(), parentId: c.parentId, agentType: c.agentType, mode: c.mode || "chat",
      title: c.title || null, workflowId: null, runId: null, createdAt: this.now(), updatedAt: this.now(),
    };
    this._conversations.push(row);
    return row;
  }

  async getMessages(conversationId: number) { return this._messages.filter(m => m.conversationId === conversationId); }
  async createMessage(m: InsertMessage): Promise<Message> {
    const row: Message = {
      id: this.id(), conversationId: m.conversationId, role: m.role, content: m.content,
      metadata: (m.metadata as Record<string, unknown>) || null, safetyFlag: m.safetyFlag ?? false, createdAt: this.now(),
    };
    this._messages.push(row);
    return row;
  }
}

// ── Export the appropriate storage implementation ──

export const storage: IStorage = db ? new DatabaseStorage() : new MemoryStorage();
