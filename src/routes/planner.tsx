import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { planTasks, type TaskPlan } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — L&L Services" },
      {
        name: "description",
        content:
          "Turn a list of tasks into a prioritised schedule with realistic time blocks.",
      },
      { property: "og:title", content: "AI Task Planner — L&L Services" },
      {
        property: "og:description",
        content: "Plan your day or week with AI-suggested time blocks and priorities.",
      },
    ],
  }),
  component: PlannerPage,
});

type Priority = "high" | "medium" | "low";
const priorityStyles: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
};

function PlannerPage() {
  const [tasks, setTasks] = useState("");
  const [horizon, setHorizon] = useState<"day" | "week">("day");
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const planFn = useServerFn(planTasks);

  const mutation = useMutation({
    mutationFn: async () => planFn({ data: { tasks, horizon } }),
    onSuccess: (data) => setPlan(data),
    onError: (err: Error) => toast.error(err.message || "Failed to generate plan"),
  });

  const updateBlock = (i: number, patch: Partial<TaskPlan["blocks"][number]>) => {
    if (!plan) return;
    const blocks = [...plan.blocks];
    blocks[i] = { ...blocks[i], ...patch };
    setPlan({ ...plan, blocks });
  };
  const removeBlock = (i: number) => {
    if (!plan) return;
    setPlan({ ...plan, blocks: plan.blocks.filter((_, idx) => idx !== i) });
  };
  const addBlock = () => {
    if (!plan) return;
    setPlan({
      ...plan,
      blocks: [...plan.blocks, { time: "", task: "", priority: "medium", notes: "" }],
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <ListChecks className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Task Planner</h1>
          <p className="text-sm text-muted-foreground">
            Drop in tasks and get a prioritised, time-blocked schedule.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="One task per line, or a paragraph describing your workload..."
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            className="min-h-[180px] resize-y"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Horizon</Label>
              <Select value={horizon} onValueChange={(v) => setHorizon(v as "day" | "week")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!tasks.trim() || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate plan
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setTasks("");
                setPlan(null);
              }}
              type="button"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Prioritised schedule (editable)</CardTitle>
            <Button size="sm" variant="ghost" onClick={addBlock}>
              <Plus className="h-4 w-4" /> Add block
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={plan.overview}
              onChange={(e) => setPlan({ ...plan, overview: e.target.value })}
              className="min-h-[60px]"
            />
            <div className="space-y-2">
              {plan.blocks.map((b, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-md border bg-card p-3 md:grid-cols-[180px_1fr_140px_auto]"
                >
                  <Input
                    value={b.time}
                    placeholder="09:00 - 10:30"
                    onChange={(e) => updateBlock(i, { time: e.target.value })}
                  />
                  <div className="space-y-1">
                    <Input
                      value={b.task}
                      placeholder="Task"
                      onChange={(e) => updateBlock(i, { task: e.target.value })}
                    />
                    {b.notes !== null && b.notes !== "" && (
                      <Input
                        value={b.notes ?? ""}
                        placeholder="Notes"
                        className="h-8 text-xs"
                        onChange={(e) => updateBlock(i, { notes: e.target.value })}
                      />
                    )}
                  </div>
                  <Select
                    value={b.priority}
                    onValueChange={(v) => updateBlock(i, { priority: v as Priority })}
                  >
                    <SelectTrigger
                      className={cn("border", priorityStyles[b.priority])}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeBlock(i)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {plan.blocks.length === 0 && (
                <p className="text-sm text-muted-foreground">No blocks yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
