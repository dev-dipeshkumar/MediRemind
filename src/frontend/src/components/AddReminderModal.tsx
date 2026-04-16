import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Frequency } from "../backend";
import type { MedicineReminder } from "../backend";

const PRESET_COLORS = [
  "#14b8a6",
  "#0ea5e9",
  "#8b5cf6",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#6366f1",
];

const FREQ_TIMES: Record<Frequency, number> = {
  [Frequency.daily]: 1,
  [Frequency.twiceDaily]: 2,
  [Frequency.weekly]: 1,
  [Frequency.asNeeded]: 1,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: MedicineReminder;
  onSave: (reminder: MedicineReminder) => void;
  isSaving?: boolean;
}

export default function AddReminderModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  isSaving,
}: Props) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<Frequency>(Frequency.daily);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setName(initialData.name);
      setDosage(initialData.dosage);
      setFrequency(initialData.frequency);
      setTimes(initialData.times.length ? initialData.times : ["08:00"]);
      setColor(initialData.color || PRESET_COLORS[0]);
      setNotes(initialData.notes);
      setIsActive(initialData.isActive);
    } else {
      setName("");
      setDosage("");
      setFrequency(Frequency.daily);
      setTimes(["08:00"]);
      setColor(PRESET_COLORS[0]);
      setNotes("");
      setIsActive(true);
    }
  }, [initialData, open]);

  function handleFrequencyChange(val: Frequency) {
    setFrequency(val);
    const count = FREQ_TIMES[val];
    setTimes((prev) => {
      const next = [...prev];
      while (next.length < count) next.push("12:00");
      return next.slice(0, count);
    });
  }

  function handleSubmit() {
    if (!name.trim() || !dosage.trim()) return;
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      times,
      color,
      notes,
      isActive,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="reminder.dialog"
        className="max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Reminder" : "Add Reminder"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="med-name">Medicine Name *</Label>
            <Input
              id="med-name"
              data-ocid="reminder.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              data-ocid="reminder.dosage.input"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 500mg"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => handleFrequencyChange(v as Frequency)}
            >
              <SelectTrigger data-ocid="reminder.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Frequency.daily}>Daily</SelectItem>
                <SelectItem value={Frequency.twiceDaily}>
                  Twice Daily
                </SelectItem>
                <SelectItem value={Frequency.weekly}>Weekly</SelectItem>
                <SelectItem value={Frequency.asNeeded}>As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Times</Label>
            <div className="space-y-2">
              {times.map((t, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: time list order is stable
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    data-ocid={`reminder.time.input.${i + 1}`}
                    value={t}
                    onChange={(e) =>
                      setTimes((prev) =>
                        prev.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                    className="flex-1"
                  />
                  {times.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setTimes((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {frequency === Frequency.asNeeded && (
                <Button
                  type="button"
                  data-ocid="reminder.add_button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTimes((prev) => [...prev, "12:00"])}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Time
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color Tag</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              data-ocid="reminder.textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take with food..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active-toggle">Active</Label>
            <Switch
              id="active-toggle"
              data-ocid="reminder.switch"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            data-ocid="reminder.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            data-ocid="reminder.submit_button"
            onClick={handleSubmit}
            disabled={isSaving || !name.trim() || !dosage.trim()}
          >
            {isSaving ? "Saving..." : initialData ? "Update" : "Add Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
