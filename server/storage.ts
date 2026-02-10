import {
  parents, childProfiles, baselines, coachingPlans, trackingEntries,
  checkIns, conversations, messages, items,
  type Parent, type InsertParent,
  type ChildProfile, type InsertChildProfile,
  type Baseline, type InsertBaseline,
  type CoachingPlan, type InsertCoachingPlan,
  type TrackingEntry, type InsertTrackingEntry,
  type CheckIn, type InsertCheckIn,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Item, type InsertItem,
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

  // Legacy
  getItems(): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
}

export class DatabaseStorage implements IStorage {
  // ── Parents ──
  async getParentByToken(token: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.sessionToken, token));
    return parent;
  }

  async createParent(parent: InsertParent): Promise<Parent> {
    const [created] = await db.insert(parents).values(parent).returning();
    return created;
  }

  async updateParent(id: number, updates: Partial<Parent>): Promise<Parent | undefined> {
    const [updated] = await db.update(parents).set({ ...updates, updatedAt: new Date() }).where(eq(parents.id, id)).returning();
    return updated;
  }

  // ── Child Profiles ──
  async getChildProfiles(parentId: number): Promise<ChildProfile[]> {
    return await db.select().from(childProfiles).where(eq(childProfiles.parentId, parentId));
  }

  async getChildProfile(id: number): Promise<ChildProfile | undefined> {
    const [profile] = await db.select().from(childProfiles).where(eq(childProfiles.id, id));
    return profile;
  }

  async createChildProfile(profile: InsertChildProfile): Promise<ChildProfile> {
    const [created] = await db.insert(childProfiles).values(profile as any).returning();
    return created;
  }

  async updateChildProfile(id: number, updates: Partial<ChildProfile>): Promise<ChildProfile | undefined> {
    const [updated] = await db.update(childProfiles).set(updates).where(eq(childProfiles.id, id)).returning();
    return updated;
  }

  // ── Baselines ──
  async getBaseline(id: number): Promise<Baseline | undefined> {
    const [baseline] = await db.select().from(baselines).where(eq(baselines.id, id));
    return baseline;
  }

  async getBaselineByParent(parentId: number): Promise<Baseline | undefined> {
    const [baseline] = await db.select().from(baselines).where(eq(baselines.parentId, parentId)).orderBy(desc(baselines.createdAt)).limit(1);
    return baseline;
  }

  async createBaseline(baseline: InsertBaseline): Promise<Baseline> {
    const [created] = await db.insert(baselines).values(baseline as any).returning();
    return created;
  }

  // ── Coaching Plans ──
  async getCoachingPlan(id: number): Promise<CoachingPlan | undefined> {
    const [plan] = await db.select().from(coachingPlans).where(eq(coachingPlans.id, id));
    return plan;
  }

  async getActivePlan(parentId: number): Promise<CoachingPlan | undefined> {
    const [plan] = await db.select().from(coachingPlans)
      .where(and(eq(coachingPlans.parentId, parentId), eq(coachingPlans.status, "active")))
      .orderBy(desc(coachingPlans.createdAt)).limit(1);
    return plan;
  }

  async createCoachingPlan(plan: InsertCoachingPlan): Promise<CoachingPlan> {
    const [created] = await db.insert(coachingPlans).values(plan as any).returning();
    return created;
  }

  async updateCoachingPlan(id: number, updates: Partial<CoachingPlan>): Promise<CoachingPlan | undefined> {
    const [updated] = await db.update(coachingPlans).set({ ...updates, updatedAt: new Date() }).where(eq(coachingPlans.id, id)).returning();
    return updated;
  }

  // ── Tracking ──
  async getTrackingEntries(planId: number): Promise<TrackingEntry[]> {
    return await db.select().from(trackingEntries).where(eq(trackingEntries.planId, planId)).orderBy(desc(trackingEntries.date));
  }

  async createTrackingEntry(entry: InsertTrackingEntry): Promise<TrackingEntry> {
    const [created] = await db.insert(trackingEntries).values(entry as any).returning();
    return created;
  }

  // ── Check-ins ──
  async getCheckIns(planId: number): Promise<CheckIn[]> {
    return await db.select().from(checkIns).where(eq(checkIns.planId, planId)).orderBy(desc(checkIns.createdAt));
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [created] = await db.insert(checkIns).values(checkIn as any).returning();
    return created;
  }

  // ── Conversations ──
  async getConversations(parentId: number): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.parentId, parentId)).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conv).returning();
    return created;
  }

  // ── Messages ──
  async getMessages(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  // ── Legacy ──
  async getItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }
}

export const storage = new DatabaseStorage();
