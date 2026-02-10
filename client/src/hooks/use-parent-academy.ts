import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, setSessionToken, getSessionToken } from "@/lib/queryClient";
import { api } from "@shared/routes";

// ── Session ──

export function useSession() {
  return useQuery<any>({
    queryKey: [api.session.get.path],
    enabled: !!getSessionToken(),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.session.create.path);
      const data = await res.json();
      setSessionToken(data.token);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.session.get.path] });
    },
  });
}

// ── Onboarding ──

export function useSubmitBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      childAgeMonths: number;
      challenges: string[];
      goals: string[];
      intensity?: "low" | "medium" | "high";
      triggers?: string[];
    }) => {
      const res = await apiRequest("POST", api.onboarding.baseline.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.session.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.childProfiles.list.path] });
    },
  });
}

// ── Child Profiles ──

export function useChildProfiles() {
  return useQuery<any[]>({
    queryKey: [api.childProfiles.list.path],
    enabled: !!getSessionToken(),
  });
}

export function useUpdateChildProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; childAgeMonths?: number; challenges?: string[]; behavioralContext?: string; routineNotes?: string }) => {
      const res = await apiRequest("PUT", `/api/child-profiles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.childProfiles.list.path] });
    },
  });
}

// ── Coaching Plans ──

export function useActivePlan() {
  return useQuery<any>({
    queryKey: [api.plans.active.path],
    enabled: !!getSessionToken(),
  });
}

export function usePlan(id: number) {
  return useQuery<any>({
    queryKey: [`/api/plans/${id}`],
    enabled: !!getSessionToken() && id > 0,
  });
}

export function useGeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.plans.generate.path);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.plans.active.path] });
      queryClient.invalidateQueries({ queryKey: [api.session.get.path] });
    },
  });
}

// ── Tracking ──

export function useTrackingEntries(planId: number) {
  return useQuery<any[]>({
    queryKey: [`/api/tracking/${planId}`],
    enabled: !!getSessionToken() && planId > 0,
  });
}

export function useCreateTrackingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      planId: number;
      tantrumCount?: number;
      tantrumIntensity?: number;
      bedtimeDurationMins?: number;
      meltdownDurationMins?: number;
      transitionConflicts?: number;
      parentConfidence?: number;
      actionsCompleted?: string[];
      notes?: string;
    }) => {
      const res = await apiRequest("POST", api.tracking.create.path, data);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tracking/${vars.planId}`] });
    },
  });
}

// ── Check-ins ──

export function useCheckIns(planId: number) {
  return useQuery<any[]>({
    queryKey: [`/api/check-ins/${planId}`],
    enabled: !!getSessionToken() && planId > 0,
  });
}

export function useGenerateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.checkIns.generate.path);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

// ── Conversations ──

export function useConversations() {
  return useQuery<any[]>({
    queryKey: [api.conversations.list.path],
    enabled: !!getSessionToken(),
  });
}

export function useConversation(id: number) {
  return useQuery<any>({
    queryKey: [`/api/conversations/${id}`],
    enabled: !!getSessionToken() && id > 0,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      conversationId?: number;
      agentType: string;
      message: string;
      mode?: "chat" | "roleplay-parent" | "roleplay-child";
    }) => {
      const res = await apiRequest("POST", api.conversations.sendMessage.path, data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      if (data.conversationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${data.conversationId}`] });
      }
    },
  });
}

// ── Agents ──

export function useAgents() {
  return useQuery<any[]>({
    queryKey: [api.agents.list.path],
  });
}
