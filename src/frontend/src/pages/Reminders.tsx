import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Frequency } from "../backend";
import type { MedicineReminder } from "../backend";
import AddReminderModal from "../components/AddReminderModal";
import {
  useCreateReminder,
  useDeleteReminder,
  useReminders,
  useUpdateReminder,
} from "../hooks/useReminders";

const FREQ_LABELS: Record<Frequency, string> = {
  [Frequency.daily]: "Daily",
  [Frequency.twiceDaily]: "Twice Daily",
  [Frequency.weekly]: "Weekly",
  [Frequency.asNeeded]: "As Needed",
};

export default function Reminders() {
  const { data: reminders, isLoading } = useReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MedicineReminder | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function handleSave(reminder: MedicineReminder) {
    if (editTarget) {
      updateReminder.mutate(reminder, { onSuccess: () => setModalOpen(false) });
    } else {
      createReminder.mutate(reminder, { onSuccess: () => setModalOpen(false) });
    }
  }

  function handleToggleActive(r: MedicineReminder) {
    updateReminder.mutate({ ...r, isActive: !r.isActive });
  }

  function handleDelete() {
    if (deleteTarget) deleteReminder.mutate(deleteTarget);
    setDeleteTarget(null);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Reminders</h2>
          <p className="text-sm text-muted-foreground">
            {reminders?.length ?? 0} medicines
          </p>
        </div>
        <Button
          data-ocid="reminders.add_button"
          size="sm"
          onClick={() => {
            setEditTarget(undefined);
            setModalOpen(true);
          }}
          className="rounded-xl gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div data-ocid="reminders.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : !reminders?.length ? (
        <div data-ocid="reminders.empty_state" className="text-center py-16">
          <Bell className="w-14 h-14 text-muted mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No reminders yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tap Add to create your first medicine reminder.
          </p>
          <Button
            data-ocid="reminders.empty.add_button"
            className="mt-4"
            onClick={() => {
              setEditTarget(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Reminder
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {reminders.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card data-ocid={`reminders.item.${idx + 1}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: r.color || "#14b8a6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {r.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {r.dosage}
                          </p>
                        </div>
                        <Switch
                          data-ocid={`reminders.active.switch.${idx + 1}`}
                          checked={r.isActive}
                          onCheckedChange={() => handleToggleActive(r)}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {FREQ_LABELS[r.frequency]}
                        </Badge>
                        {r.times.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                        {!r.isActive && (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            <BellOff className="w-3 h-3 mr-1" /> Paused
                          </Badge>
                        )}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 truncate">
                          {r.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 justify-end">
                    <Button
                      data-ocid={`reminders.edit_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditTarget(r);
                        setModalOpen(true);
                      }}
                      className="h-7 text-xs px-2.5"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      data-ocid={`reminders.delete_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTarget(r.id)}
                      className="h-7 text-xs px-2.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <AddReminderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={editTarget}
        onSave={handleSave}
        isSaving={createReminder.isPending || updateReminder.isPending}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="reminders.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this reminder and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="reminders.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="reminders.delete.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
