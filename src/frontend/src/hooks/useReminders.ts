import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DoseLog, MedicineReminder } from "../backend";
import { useActor } from "./useActor";

function todayStartNS(): bigint {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return BigInt(start.getTime()) * 1_000_000n;
}

export function useReminders() {
  const { actor, isFetching } = useActor();
  return useQuery<MedicineReminder[]>({
    queryKey: ["reminders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: MedicineReminder) => {
      if (!actor) throw new Error("Not connected");
      await actor.createReminder(reminder);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder created");
    },
    onError: () => toast.error("Failed to create reminder"),
  });
}

export function useUpdateReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: MedicineReminder) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateReminder(reminder);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder updated");
    },
    onError: () => toast.error("Failed to update reminder"),
  });
}

export function useDeleteReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteReminder(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder deleted");
    },
    onError: () => toast.error("Failed to delete reminder"),
  });
}

export function useTodayStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["todayStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDayStats(todayStartNS());
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
  });
}

export function useCurrentStreak() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getCurrentStreak();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeekStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["weekStats"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPastNDayStats(7n);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLogDose() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: DoseLog) => {
      if (!actor) throw new Error("Not connected");
      await actor.logDose(log);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todayStats"] });
      qc.invalidateQueries({ queryKey: ["allLogs"] });
      qc.invalidateQueries({ queryKey: ["streak"] });
      qc.invalidateQueries({ queryKey: ["weekStats"] });
    },
    onError: () => toast.error("Failed to log dose"),
  });
}
