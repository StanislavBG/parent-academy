/**
 * Bilko-flow workflow definitions for Parent Academy agents.
 *
 * Each agent type maps to a workflow definition that orchestrates
 * the agent's reasoning through bilko-flow's deterministic engine.
 */

import { randomUUID } from "crypto";
import type { AgentType } from "./types";

/** Step types used by Parent Academy workflows */
type PAStepType = "transform.map" | "ai.generate" | "transform.reduce";

interface WorkflowStep {
  id: string;
  name: string;
  type: PAStepType;
  inputs: Record<string, unknown>;
  dependsOn: string[];
  policy: {
    timeoutMs: number;
    maxAttempts: number;
    backoffStrategy: "fixed" | "exponential";
    backoffBaseMs: number;
  };
  determinism: {
    pureFunction: boolean;
    usesTime: boolean;
    usesExternalApis: boolean;
  };
  outputSchema?: {
    type: string;
    description: string;
  };
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  accountId: string;
  projectId: string;
  environmentId: string;
  version: number;
  specVersion: string;
  status: "active";
  entryStepId: string;
  steps: WorkflowStep[];
  determinism: {
    targetGrade: "best-effort";
    timeSource: { kind: "wall-clock" };
  };
  secrets: never[];
  createdAt: string;
  updatedAt: string;
}

const ACCOUNT_ID = "parent-academy";
const PROJECT_ID = "coaching-platform";
const ENV_ID = "production";

/** Create a conversation workflow for a given agent type */
export function createConversationWorkflow(agentType: AgentType): WorkflowDefinition {
  const id = `pa-conversation-${agentType}-${randomUUID()}`;

  return {
    id,
    name: `${agentType}-conversation`,
    description: `Conversation workflow for ${agentType} expert agent`,
    accountId: ACCOUNT_ID,
    projectId: PROJECT_ID,
    environmentId: ENV_ID,
    version: 1,
    specVersion: "1.0.0",
    status: "active",
    entryStepId: "safety-check",
    steps: [
      {
        id: "safety-check",
        name: "Safety Signal Detection",
        type: "transform.map",
        inputs: { operation: "safety-check" },
        dependsOn: [],
        policy: { timeoutMs: 5000, maxAttempts: 1, backoffStrategy: "fixed", backoffBaseMs: 1000 },
        determinism: { pureFunction: true, usesTime: false, usesExternalApis: false },
        outputSchema: { type: "object", description: "Safety check result with risk signals" },
      },
      {
        id: "context-assembly",
        name: "Assemble Agent Context",
        type: "transform.map",
        inputs: { operation: "assemble-context", agentType },
        dependsOn: ["safety-check"],
        policy: { timeoutMs: 5000, maxAttempts: 1, backoffStrategy: "fixed", backoffBaseMs: 1000 },
        determinism: { pureFunction: true, usesTime: false, usesExternalApis: false },
        outputSchema: { type: "object", description: "Assembled agent context with history and profile" },
      },
      {
        id: "agent-response",
        name: "Generate Expert Response",
        type: "ai.generate",
        inputs: { operation: "generate-response", agentType },
        dependsOn: ["context-assembly"],
        policy: { timeoutMs: 30000, maxAttempts: 2, backoffStrategy: "exponential", backoffBaseMs: 1000 },
        determinism: { pureFunction: false, usesTime: true, usesExternalApis: true },
        outputSchema: { type: "object", description: "Expert agent response with content and metadata" },
      },
      {
        id: "response-validation",
        name: "Validate & Format Response",
        type: "transform.map",
        inputs: { operation: "validate-response" },
        dependsOn: ["agent-response"],
        policy: { timeoutMs: 5000, maxAttempts: 1, backoffStrategy: "fixed", backoffBaseMs: 1000 },
        determinism: { pureFunction: true, usesTime: false, usesExternalApis: false },
        outputSchema: { type: "object", description: "Validated response ready for delivery" },
      },
    ],
    determinism: { targetGrade: "best-effort", timeSource: { kind: "wall-clock" } },
    secrets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Create a 30-day coaching plan generation workflow */
export function createPlanGenerationWorkflow(): WorkflowDefinition {
  const id = `pa-plan-gen-${randomUUID()}`;

  return {
    id,
    name: "coaching-plan-generation",
    description: "Generates a personalized 30-day coaching plan from baseline assessment",
    accountId: ACCOUNT_ID,
    projectId: PROJECT_ID,
    environmentId: ENV_ID,
    version: 1,
    specVersion: "1.0.0",
    status: "active",
    entryStepId: "analyze-baseline",
    steps: [
      {
        id: "analyze-baseline",
        name: "Analyze Baseline Assessment",
        type: "transform.map",
        inputs: { operation: "analyze-baseline" },
        dependsOn: [],
        policy: { timeoutMs: 5000, maxAttempts: 1, backoffStrategy: "fixed", backoffBaseMs: 1000 },
        determinism: { pureFunction: true, usesTime: false, usesExternalApis: false },
      },
      {
        id: "generate-weekly-goals",
        name: "Generate Weekly Goals",
        type: "ai.generate",
        inputs: { operation: "generate-weekly-goals" },
        dependsOn: ["analyze-baseline"],
        policy: { timeoutMs: 30000, maxAttempts: 2, backoffStrategy: "exponential", backoffBaseMs: 1000 },
        determinism: { pureFunction: false, usesTime: true, usesExternalApis: true },
      },
      {
        id: "generate-daily-actions",
        name: "Generate Daily Actions",
        type: "ai.generate",
        inputs: { operation: "generate-daily-actions" },
        dependsOn: ["generate-weekly-goals"],
        policy: { timeoutMs: 30000, maxAttempts: 2, backoffStrategy: "exponential", backoffBaseMs: 1000 },
        determinism: { pureFunction: false, usesTime: true, usesExternalApis: true },
      },
      {
        id: "generate-scripts",
        name: "Generate Conversation Scripts",
        type: "ai.generate",
        inputs: { operation: "generate-scripts" },
        dependsOn: ["analyze-baseline"],
        policy: { timeoutMs: 30000, maxAttempts: 2, backoffStrategy: "exponential", backoffBaseMs: 1000 },
        determinism: { pureFunction: false, usesTime: true, usesExternalApis: true },
      },
      {
        id: "assemble-plan",
        name: "Assemble Complete Plan",
        type: "transform.reduce",
        inputs: { operation: "assemble-plan" },
        dependsOn: ["generate-weekly-goals", "generate-daily-actions", "generate-scripts"],
        policy: { timeoutMs: 5000, maxAttempts: 1, backoffStrategy: "fixed", backoffBaseMs: 1000 },
        determinism: { pureFunction: true, usesTime: false, usesExternalApis: false },
      },
    ],
    determinism: { targetGrade: "best-effort", timeSource: { kind: "wall-clock" } },
    secrets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Create a weekly check-in analysis workflow */
export function createCheckInWorkflow(): WorkflowDefinition {
  const id = `pa-checkin-${randomUUID()}`;

  return {
    id,
    name: "weekly-checkin-analysis",
    description: "Analyzes weekly tracking data and adjusts the coaching plan",
    accountId: ACCOUNT_ID,
    projectId: PROJECT_ID,
    environmentId: ENV_ID,
    version: 1,
    specVersion: "1.0.0",
    status: "active",
    entryStepId: "aggregate-tracking",
    steps: [
      {
        id: "aggregate-tracking",
        name: "Aggregate Tracking Data",
        type: "transform.reduce",
        inputs: { operation: "aggregate-tracking" },
        dependsOn: [],
        policy: { timeoutMs: 5000, maxAttempts: 1, backoffStrategy: "fixed", backoffBaseMs: 1000 },
        determinism: { pureFunction: true, usesTime: false, usesExternalApis: false },
      },
      {
        id: "analyze-trends",
        name: "Analyze Trends",
        type: "ai.generate",
        inputs: { operation: "analyze-trends" },
        dependsOn: ["aggregate-tracking"],
        policy: { timeoutMs: 30000, maxAttempts: 2, backoffStrategy: "exponential", backoffBaseMs: 1000 },
        determinism: { pureFunction: false, usesTime: true, usesExternalApis: true },
      },
      {
        id: "adjust-plan",
        name: "Generate Plan Adjustments",
        type: "ai.generate",
        inputs: { operation: "adjust-plan" },
        dependsOn: ["analyze-trends"],
        policy: { timeoutMs: 30000, maxAttempts: 2, backoffStrategy: "exponential", backoffBaseMs: 1000 },
        determinism: { pureFunction: false, usesTime: true, usesExternalApis: true },
      },
    ],
    determinism: { targetGrade: "best-effort", timeSource: { kind: "wall-clock" } },
    secrets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
