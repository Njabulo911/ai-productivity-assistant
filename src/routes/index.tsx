import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting, type MeetingSummary } from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — L&L Services" },
      {
        name: "description",
        content:
          "Paste raw meeting notes and get a concise summary with key points, decisions, and action items.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — L&L Services" },
      {
        property: "og:description",
        content: "Paste raw meeting notes and get a concise summary with key points, decisions, and action items.",
      },
    ],
  }),
  component: MeetingNotesPage,
});

const EXAMPLE = `Weekly sync — Product & Ops
- Alice walked through Q3 roadmap; delivery on track for Aug 15.
- Discussed customer complaint about onboarding email delay.
  Decision: Ops to move email trigger to sign-up event (owner: Ravi, by Fri).
- Marketing launch pushed to Sept 1 to align with the trade show.
- Open question: who handles social? Priya to confirm next week.`;

function MeetingNotesPage() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<MeetingSummary | null>(null);
  const summarize = useServerFn(summarizeMeeting);

  const mutation = useMutation({
    mutationFn: async (input: string) => summarize({ data: { notes: input } }),
    onSuccess: (data) => setResult(data),
    onError: (err: Error) => toast.error(err.message || "Failed to summarise notes"),
  });

  const updateAction = (idx: number, patch: Partial<MeetingSummary["actionItems"][number]>) => {
    if (!result) return;
    const next = { ...result, actionItems: [...result.actionItems] };
    next.actionItems[idx] = { ...next.actionItems[idx], ...patch };
    setResult(next);
  };

  const addAction = () => {
    if (!result) return;
    setResult({
      ...result,
      actionItems: [...result.actionItems, { task: "", owner: "", deadline: "" }],
    });
  };

  const removeAction = (idx: number) => {
    if (!result) return;
    setResult({ ...result, actionItems: result.actionItems.filter((_, i) => i !== idx) });
  };

  const copyAll = async () => {
    if (!result) return;
    const md =
      `# Summary\n${result.summary}\n\n` +
      `## Key Points\n${result.keyPoints.map((p) => `- ${p}`).join("\n")}\n\n` +
      `## Decisions\n${result.decisions.map((d) => `- ${d}`).join("\n")}\n\n` +
      `## Action Items\n${result.actionItems
        .map((a) => `- ${a.task}${a.owner ? ` — ${a.owner}` : ""}${a.deadline ? ` (${a.deadline})` : ""}`)
        .join("\n")}`;
    await navigator.clipboard.writeText(md);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meeting Notes Summarizer</h1>
          <p className="text-sm text-muted-foreground">
            Paste your notes and get a clean summary with owners and deadlines.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste your meeting notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px] resize-y"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => mutation.mutate(notes)}
              disabled={!notes.trim() || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate summary
            </Button>
            <Button variant="outline" onClick={() => setNotes(EXAMPLE)} type="button">
              Load example
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setNotes("");
                setResult(null);
              }}
              type="button"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Generated brief (editable)</CardTitle>
            <Button size="sm" variant="outline" onClick={copyAll}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                value={result.summary}
                onChange={(e) => setResult({ ...result, summary: e.target.value })}
                className="min-h-[90px]"
              />
            </section>

            <section className="space-y-2">
              <Label>Key discussion points</Label>
              <Textarea
                value={result.keyPoints.join("\n")}
                onChange={(e) =>
                  setResult({ ...result, keyPoints: e.target.value.split("\n") })
                }
                className="min-h-[110px] font-mono text-sm"
              />
            </section>

            <section className="space-y-2">
              <Label>Decisions</Label>
              <Textarea
                value={result.decisions.join("\n")}
                onChange={(e) =>
                  setResult({ ...result, decisions: e.target.value.split("\n") })
                }
                className="min-h-[80px] font-mono text-sm"
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Action items</Label>
                <Button size="sm" variant="ghost" onClick={addAction}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {result.actionItems.map((a, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-[1fr_180px_140px_auto]"
                  >
                    <Input
                      placeholder="Task"
                      value={a.task}
                      onChange={(e) => updateAction(i, { task: e.target.value })}
                    />
                    <Input
                      placeholder="Owner"
                      value={a.owner ?? ""}
                      onChange={(e) => updateAction(i, { owner: e.target.value })}
                    />
                    <Input
                      placeholder="Deadline"
                      value={a.deadline ?? ""}
                      onChange={(e) => updateAction(i, { deadline: e.target.value })}
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeAction(i)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {result.actionItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">No action items.</p>
                )}
              </div>
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
