import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlarmClock, Check, Clock, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { DoseStatus } from "../backend";
import type { MedicineReminder } from "../backend";

interface Props {
  reminder: MedicineReminder;
  time: string;
  index: number;
  isOverdue?: boolean;
  onTaken: () => void;
  onSnoozed: (minutes: number) => void;
  onMissed: () => void;
  loggedStatus?: DoseStatus;
  isLogging?: boolean;
}

export default function ReminderCard({
  reminder,
  time,
  index,
  isOverdue,
  onTaken,
  onSnoozed,
  onMissed,
  loggedStatus,
  isLogging,
}: Props) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  const statusColor = {
    [DoseStatus.taken]: "bg-success/15 border-success/30",
    [DoseStatus.missed]: "bg-destructive/10 border-destructive/30",
    [DoseStatus.snoozed]: "bg-warning/15 border-warning/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        data-ocid={`schedule.item.${index + 1}`}
        className={`p-4 border transition-all ${
          isOverdue && !loggedStatus
            ? "border-destructive/40 bg-destructive/5"
            : ""
        } ${loggedStatus ? statusColor[loggedStatus] : ""}`}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: reminder.color || "#14b8a6" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {reminder.name}
              </h3>
              <span className="text-sm font-medium text-muted-foreground flex-shrink-0 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {time}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{reminder.dosage}</p>
            {reminder.notes && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {reminder.notes}
              </p>
            )}
            {isOverdue && !loggedStatus && (
              <Badge variant="destructive" className="mt-1 text-xs">
                Overdue
              </Badge>
            )}
            {loggedStatus && (
              <Badge
                className={`mt-1 text-xs ${
                  loggedStatus === DoseStatus.taken
                    ? "bg-success/20 text-success-foreground"
                    : loggedStatus === DoseStatus.missed
                      ? "bg-destructive/20"
                      : "bg-warning/20 text-warning-foreground"
                }`}
              >
                {loggedStatus}
              </Badge>
            )}
          </div>
        </div>

        {!loggedStatus && (
          <div className="flex gap-2 mt-3">
            <Button
              data-ocid={`schedule.taken.button.${index + 1}`}
              size="sm"
              className="flex-1 bg-success/90 hover:bg-success text-success-foreground h-8"
              onClick={onTaken}
              disabled={isLogging}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Taken
            </Button>

            <DropdownMenu open={snoozeOpen} onOpenChange={setSnoozeOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  data-ocid={`schedule.snooze.button.${index + 1}`}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8"
                  disabled={isLogging}
                >
                  <AlarmClock className="w-3.5 h-3.5 mr-1" /> Snooze
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-ocid="schedule.snooze.dropdown_menu">
                {[15, 30, 60].map((m) => (
                  <DropdownMenuItem
                    key={m}
                    onClick={() => {
                      onSnoozed(m);
                      setSnoozeOpen(false);
                    }}
                  >
                    {m} minutes
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              data-ocid={`schedule.missed.button.${index + 1}`}
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={onMissed}
              disabled={isLogging}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Miss
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
