import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlarmClock, CalendarDays, Check, Flame, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DoseStatus } from "../backend";
import ReminderCard from "../components/ReminderCard";
import { useAllLogs } from "../hooks/useDoseLog";
import {
  useCurrentStreak,
  useLogDose,
  useReminders,
  useTodayStats,
} from "../hooks/useReminders";

function todayStartNS(): bigint {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return BigInt(start.getTime()) * 1_000_000n;
}

function isOverdue(time: string): boolean {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
}

export default function Dashboard() {
  const { data: reminders, isLoading: remindersLoading } = useReminders();
  const { data: todayStats, isLoading: statsLoading } = useTodayStats();
  const { data: streak } = useCurrentStreak();
  const { data: allLogs } = useAllLogs();
  const logDose = useLogDose();
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const todayDayStart = todayStartNS();

  const todayLogs = useMemo(() => {
    if (!allLogs) return [];
    return allLogs.filter((l) => l.timestamp >= todayDayStart);
  }, [allLogs, todayDayStart]);

  const schedule = useMemo(() => {
    if (!reminders) return [];
    const entries: {
      reminder: (typeof reminders)[0];
      time: string;
      key: string;
    }[] = [];
    for (const r of reminders) {
      if (!r.isActive) continue;
      for (const t of r.times.length ? r.times : ["08:00"]) {
        entries.push({ reminder: r, time: t, key: `${r.id}-${t}` });
      }
    }
    return entries.sort((a, b) => a.time.localeCompare(b.time));
  }, [reminders]);

  const reminderLoggedToday = useMemo(() => {
    const m = new Map<string, DoseStatus>();
    for (const log of todayLogs) {
      if (!m.has(log.reminderId)) m.set(log.reminderId, log.status);
    }
    return m;
  }, [todayLogs]);

  async function handleLog(
    reminderId: string,
    status: DoseStatus,
    snoozeMinutes?: number,
  ) {
    setLoggingId(reminderId);
    try {
      await logDose.mutateAsync({
        reminderId,
        status,
        timestamp: BigInt(Date.now()) * 1_000_000n,
        snoozeMinutes: snoozeMinutes ? BigInt(snoozeMinutes) : undefined,
      });
    } finally {
      setLoggingId(null);
    }
  }

  const taken = Number(todayStats?.takenDoses ?? 0n);
  const missed = Number(todayStats?.missedDoses ?? 0n);
  const snoozed = Number(todayStats?.snoozedDoses ?? 0n);
  const total = Number(todayStats?.totalDoses ?? BigInt(schedule.length));
  const progressPct = total > 0 ? Math.round((taken / total) * 100) : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> {today}
          </p>
          <h2 className="text-xl font-bold text-foreground mt-0.5">
            Today&apos;s Schedule
          </h2>
        </div>
        <div
          data-ocid="dashboard.streak.card"
          className="flex items-center gap-1.5 bg-warning/15 border border-warning/30 rounded-xl px-3 py-2"
        >
          <span className="flame-anim text-lg">🔥</span>
          <div>
            <p className="text-lg font-bold text-warning-foreground leading-none">
              {Number(streak ?? 0n)}
            </p>
            <p className="text-[10px] text-muted-foreground">day streak</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl border border-border p-4 shadow-card"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">
            Daily Progress
          </span>
          <span className="text-sm font-bold text-primary">
            {taken}/{total} doses
          </span>
        </div>
        {statsLoading ? (
          <Skeleton
            data-ocid="dashboard.loading_state"
            className="h-3 w-full rounded-full"
          />
        ) : (
          <Progress value={progressPct} className="h-3" />
        )}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Check className="w-3.5 h-3.5 text-success" />
            <span className="text-muted-foreground">{taken} taken</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <AlarmClock className="w-3.5 h-3.5 text-warning" />
            <span className="text-muted-foreground">{snoozed} snoozed</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <X className="w-3.5 h-3.5 text-destructive" />
            <span className="text-muted-foreground">{missed} missed</span>
          </div>
        </div>
      </motion.div>

      {remindersLoading ? (
        <div data-ocid="dashboard.schedule.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : schedule.length === 0 ? (
        <div
          data-ocid="dashboard.schedule.empty_state"
          className="text-center py-12"
        >
          <Flame className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted-foreground">
            No active reminders for today.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Add reminders in the Reminders tab.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.map((entry, idx) => (
            <ReminderCard
              key={entry.key}
              reminder={entry.reminder}
              time={entry.time}
              index={idx}
              isOverdue={isOverdue(entry.time)}
              loggedStatus={reminderLoggedToday.get(entry.reminder.id)}
              isLogging={loggingId === entry.reminder.id}
              onTaken={() => handleLog(entry.reminder.id, DoseStatus.taken)}
              onSnoozed={(m) =>
                handleLog(entry.reminder.id, DoseStatus.snoozed, m)
              }
              onMissed={() => handleLog(entry.reminder.id, DoseStatus.missed)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
