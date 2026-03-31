import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  LeadCreate,
  LeadId,
  MessageTemplateCreate,
  SentMessageCreate,
  TemplateId,
} from "../backend";
import type { WhatsAppResult } from "../backend.d";
import { useActor } from "./useActor";

export function useLeads() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTemplates() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMessageTemplates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSentMessages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sentMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSentMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadCreate) => actor!.createLead(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: LeadId; data: LeadCreate }) =>
      actor!.updateLead(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: LeadId) => actor!.deleteLead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useBulkImportLeads() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadCreate[]) => actor!.bulkImportLeads(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useCreateTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MessageTemplateCreate) =>
      actor!.createMessageTemplate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useUpdateTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: { id: TemplateId; data: MessageTemplateCreate }) =>
      actor!.updateMessageTemplate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useDeleteTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: TemplateId) => actor!.deleteMessageTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useRecordSentMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SentMessageCreate) => actor!.recordSentMessage(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sentMessages"] }),
  });
}

export function useSendWhatsApp() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      leadIds,
      body,
    }: { leadIds: LeadId[]; body: string }): Promise<WhatsAppResult> => {
      // Cast to any: sendWhatsAppMessages is added via http-outcalls backend
      // and may not yet appear in the auto-generated type declarations
      return (actor as any).sendWhatsAppMessages(
        leadIds,
        body,
      ) as Promise<WhatsAppResult>;
    },
  });
}
