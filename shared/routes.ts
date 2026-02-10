import { z } from 'zod';

// ── Zod schemas for API validation ──

export const onboardingBaselineSchema = z.object({
  childAgeMonths: z.number().min(0).max(216),
  challenges: z.array(z.string()),
  goals: z.array(z.string()),
  intensity: z.enum(["low", "medium", "high"]).optional(),
  triggers: z.array(z.string()).optional(),
});

export const trackingEntryInputSchema = z.object({
  planId: z.number(),
  tantrumCount: z.number().optional(),
  tantrumIntensity: z.number().min(1).max(5).optional(),
  bedtimeDurationMins: z.number().optional(),
  meltdownDurationMins: z.number().optional(),
  transitionConflicts: z.number().optional(),
  parentConfidence: z.number().min(1).max(5).optional(),
  actionsCompleted: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.number().optional(),
  agentType: z.string(),
  message: z.string().min(1),
  mode: z.enum(["chat", "roleplay-parent", "roleplay-child"]).default("chat"),
});

export const settingsSchema = z.object({
  childAgeMonths: z.number().min(0).max(216).optional(),
  challenges: z.array(z.string()).optional(),
  behavioralContext: z.string().optional(),
  routineNotes: z.string().optional(),
});

// ── API contract ──

export const api = {
  // Session
  session: {
    create: {
      method: 'POST' as const,
      path: '/api/session' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/session' as const,
    },
  },

  // Onboarding
  onboarding: {
    baseline: {
      method: 'POST' as const,
      path: '/api/onboarding/baseline' as const,
      input: onboardingBaselineSchema,
    },
    quickAnswer: {
      method: 'POST' as const,
      path: '/api/onboarding/quick-answer' as const,
      input: sendMessageSchema,
    },
  },

  // Child profiles
  childProfiles: {
    list: {
      method: 'GET' as const,
      path: '/api/child-profiles' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/child-profiles/:id' as const,
      input: settingsSchema,
    },
  },

  // Coaching plans
  plans: {
    active: {
      method: 'GET' as const,
      path: '/api/plans/active' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/plans/:id' as const,
    },
    generate: {
      method: 'POST' as const,
      path: '/api/plans/generate' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/plans/:id' as const,
    },
  },

  // Tracking
  tracking: {
    list: {
      method: 'GET' as const,
      path: '/api/tracking/:planId' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/tracking' as const,
      input: trackingEntryInputSchema,
    },
  },

  // Check-ins
  checkIns: {
    list: {
      method: 'GET' as const,
      path: '/api/check-ins/:planId' as const,
    },
    generate: {
      method: 'POST' as const,
      path: '/api/check-ins/generate' as const,
    },
  },

  // Conversations
  conversations: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/conversations/:id' as const,
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/conversations/message' as const,
      input: sendMessageSchema,
    },
  },

  // Agents
  agents: {
    list: {
      method: 'GET' as const,
      path: '/api/agents' as const,
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
