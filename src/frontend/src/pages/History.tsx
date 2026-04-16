import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Download, TrendingUp, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DoseStatus } from "../backend";
import type { DayStats, DoseLog } from "../backend";
import { useAllLogs } from "../hooks/useDoseLog";
import {
  useCurrentStreak,
  useReminders,
  useWeekStats,
} from "../hooks/useReminders";

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function adherencePct(stats: DayStats): number {
  const total = Number(stats.totalDoses);
  if (total === 0) return 0;
  return Math.round((Number(stats.takenDoses) / total) * 100);
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-label="Insights"
      role="img"
    >
      <title>Insights</title>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function WeekChart({ data }: { data: [bigint, DayStats][] }) {
  const sorted = [...data].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const maxVal = Math.max(...sorted.map(([, s]) => Number(s.totalDoses)), 1);
  const barW = 32;
  const gap = 8;
  const chartH = 100;
  const totalW = sorted.length * (barW + gap) - gap;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW}
        height={chartH + 32}
        className="min-w-full"
        aria-label="Weekly adherence chart"
        role="img"
      >
        <title>Weekly adherence chart</title>
        {sorted.map(([ts, stats], i) => {
          const taken = Number(stats.takenDoses);
          const missed = Number(stats.missedDoses);
          const total = Number(stats.totalDoses);
          const takenH = total > 0 ? (taken / maxVal) * chartH : 0;
          const missedH = total > 0 ? (missed / maxVal) * chartH : 0;
          const x = i * (barW + gap);
          const d = new Date(Number(ts / 1_000_000n));
          const label = days[d.getDay()];
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: chart bar positions are stable
            <g key={i}>
              <rect
                x={x}
                y={0}
                width={barW}
                height={chartH}
                rx={4}
                className="fill-muted"
              />
              {missedH > 0 && (
                <rect
                  x={x}
                  y={chartH - takenH - missedH}
                  width={barW}
                  height={missedH}
                  rx={2}
                  className="fill-destructive/60"
                />
              )}
              {takenH > 0 && (
                <rect
                  x={x}
                  y={chartH - takenH}
                  width={barW}
                  height={takenH}
                  rx={4}
                  className="fill-primary"
                />
              )}
              <text
                x={x + barW / 2}
                y={chartH + 20}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={11}
              >
                {label}
              </text>
              {total > 0 && (
                <text
                  x={x + barW / 2}
                  y={chartH - takenH - missedH - 4}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={9}
                  fontWeight={600}
                >
                  {adherencePct(stats)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function History() {
  const { data: weekStats, isLoading: weekLoading } = useWeekStats();
  const { data: streak } = useCurrentStreak();
  const { data: allLogs, isLoading: logsLoading } = useAllLogs();
  const { data: reminders } = useReminders();
  const [filter, setFilter] = useState<"all" | DoseStatus>("all");

  const reminderMap = useMemo(() => {
    const m = new Map<string, string>();
    if (reminders) for (const r of reminders) m.set(r.id, r.name);
    return m;
  }, [reminders]);

  const filteredLogs: DoseLog[] = useMemo(() => {
    if (!allLogs) return [];
    const logs =
      filter === "all" ? allLogs : allLogs.filter((l) => l.status === filter);
    return [...logs]
      .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
      .slice(0, 100);
  }, [allLogs, filter]);

  const weekAdherence = useMemo(() => {
    if (!weekStats || weekStats.length === 0) return 0;
    const total = weekStats.reduce(
      (sum, [, s]) => sum + Number(s.totalDoses),
      0,
    );
    const taken = weekStats.reduce(
      (sum, [, s]) => sum + Number(s.takenDoses),
      0,
    );
    return total > 0 ? Math.round((taken / total) * 100) : 0;
  }, [weekStats]);

  const bestDay = useMemo(() => {
    if (!weekStats || weekStats.length === 0) return null;
    const withPct = weekStats
      .map(([ts, s]) => ({ ts, pct: adherencePct(s) }))
      .filter(
        (x) => Number(weekStats.find(([t]) => t === x.ts)?.[1]?.totalDoses) > 0,
      );
    if (!withPct.length) return null;
    const best = withPct.reduce((a, b) => (b.pct > a.pct ? b : a));
    const d = new Date(Number(best.ts / 1_000_000n));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "long" }),
      pct: best.pct,
    };
  }, [weekStats]);

  const mostMissed = useMemo(() => {
    if (!allLogs) return null;
    const counts = new Map<string, number>();
    for (const l of allLogs) {
      if (l.status === DoseStatus.missed) {
        counts.set(l.reminderId, (counts.get(l.reminderId) ?? 0) + 1);
      }
    }
    if (counts.size === 0) return null;
    const [topId] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return reminderMap.get(topId) ?? topId;
  }, [allLogs, reminderMap]);

  function exportCSV() {
    if (!allLogs) return;
    const rows = [
      ["Date", "Time", "Medicine", "Status", "Snooze Minutes"],
      ...allLogs.map((l) => [
        formatDate(l.timestamp),
        formatTime(l.timestamp),
        reminderMap.get(l.reminderId) ?? l.reminderId,
        l.status,
        l.snoozeMinutes ? String(l.snoozeMinutes) : "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mediremind-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            History &amp; Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your adherence trends
          </p>
        </div>
        <Button
          data-ocid="history.export.button"
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="gap-1.5 text-xs"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card data-ocid="history.streak.card" className="p-3 text-center">
          <p className="text-2xl">🔥</p>
          <p className="text-xl font-bold text-foreground">
            {Number(streak ?? 0n)}
          </p>
          <p className="text-[11px] text-muted-foreground">Day Streak</p>
        </Card>
        <Card data-ocid="history.adherence.card" className="p-3 text-center">
          <TrendingUp className="w-6 h-6 text-primary mx-auto" />
          <p className="text-xl font-bold text-foreground">{weekAdherence}%</p>
          <p className="text-[11px] text-muted-foreground">7-Day Rate</p>
        </Card>
        <Card data-ocid="history.logs.card" className="p-3 text-center">
          <Trophy className="w-6 h-6 text-warning mx-auto" />
          <p className="text-xl font-bold text-foreground">
            {allLogs?.filter((l) => l.status === DoseStatus.taken).length ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Total Taken</p>
        </Card>
      </motion.div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Weekly Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          {weekLoading ? (
            <Skeleton
              data-ocid="history.chart.loading_state"
              className="h-32 w-full rounded"
            />
          ) : weekStats && weekStats.length > 0 ? (
            <WeekChart data={weekStats} />
          ) : (
            <p
              data-ocid="history.chart.empty_state"
              className="text-sm text-muted-foreground text-center py-6"
            >
              No data yet
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-muted-foreground">Taken</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-destructive/60" />
              <span className="text-muted-foreground">Missed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" /> Medication
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bestDay ? (
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-warning shrink-0" />
              <span className="text-muted-foreground">
                Best day:{" "}
                <span className="font-medium text-foreground">
                  {bestDay.day}
                </span>{" "}
                ({bestDay.pct}%)
              </span>
            </div>
          ) : null}
          {mostMissed ? (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-muted-foreground">
                Most missed:{" "}
                <span className="font-medium text-foreground">
                  {mostMissed}
                </span>
              </span>
            </div>
          ) : null}
          {!bestDay && !mostMissed && (
            <p className="text-sm text-muted-foreground">
              Log some doses to see personalized insights.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Dose Log</h3>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <TabsList className="h-7">
              <TabsTrigger
                data-ocid="history.all.tab"
                value="all"
                className="text-xs px-2 h-5"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                data-ocid="history.taken.tab"
                value={DoseStatus.taken}
                className="text-xs px-2 h-5"
              >
                Taken
              </TabsTrigger>
              <TabsTrigger
                data-ocid="history.missed.tab"
                value={DoseStatus.missed}
                className="text-xs px-2 h-5"
              >
                Missed
              </TabsTrigger>
              <TabsTrigger
                data-ocid="history.snoozed.tab"
                value={DoseStatus.snoozed}
                className="text-xs px-2 h-5"
              >
                Snoozed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {logsLoading ? (
          <div data-ocid="history.logs.loading_state" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div
            data-ocid="history.logs.empty_state"
            className="text-center py-10"
          >
            <p className="text-muted-foreground text-sm">No dose logs found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, idx) => (
              <motion.div
                key={`${log.reminderId}-${log.timestamp}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <Card
                  data-ocid={`history.log.item.${idx + 1}`}
                  className="px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {reminderMap.get(log.reminderId) ?? log.reminderId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.timestamp)} at{" "}
                        {formatTime(log.timestamp)}
                        {log.snoozeMinutes &&
                          ` · Snoozed ${log.snoozeMinutes}min`}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 ${
                        log.status === DoseStatus.taken
                          ? "bg-success/15 text-success border-0"
                          : log.status === DoseStatus.missed
                            ? "bg-destructive/15 text-destructive border-0"
                            : "bg-warning/15 text-warning border-0"
                      }`}
                    >
                      {log.status}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-muted-foreground py-4">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
