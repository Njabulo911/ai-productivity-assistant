import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "openai/gpt-5.5";

function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key, undefined, { structuredOutputs: true });
}

// ------- Meeting Notes Summarizer -------
const SummarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string().nullable(),
      deadline: z.string().nullable(),
    }),
  ),
});

export type MeetingSummary = z.infer<typeof SummarySchema>;

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ notes: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<MeetingSummary> => {
    const gateway = getGateway();
    const prompt = `You are an assistant that turns raw meeting notes into a clean structured brief.

Extract:
- summary: 2-4 sentence overview.
- keyPoints: bullet list of the most important discussion points.
- decisions: concrete decisions made (empty array if none).
- actionItems: each with task, owner (null if unassigned), and deadline (null if not stated). Keep deadlines as written (e.g. "Fri", "2025-08-01").

Return concise, professional prose. Do not invent owners or dates.

Meeting notes:
"""
${data.notes}
"""`;

    try {
      const { output } = await generateText({
        model: gateway(MODEL),
        output: Output.object({ schema: SummarySchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          return SummarySchema.parse(JSON.parse(error.text ?? "{}"));
        } catch {
          return { summary: error.text ?? "", keyPoints: [], decisions: [], actionItems: [] };
        }
      }
      throw error;
    }
  });

// ------- AI Task Planner -------
const PlanSchema = z.object({
  overview: z.string(),
  blocks: z.array(
    z.object({
      time: z.string(),
      task: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      notes: z.string().nullable(),
    }),
  ),
});

export type TaskPlan = z.infer<typeof PlanSchema>;

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        tasks: z.string().min(1),
        horizon: z.enum(["day", "week"]).default("day"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<TaskPlan> => {
    const gateway = getGateway();
    const horizonLabel = data.horizon === "week" ? "a full working week" : "a single working day";
    const prompt = `You are a productivity coach for a professional services firm.

Turn the following tasks into a prioritised schedule for ${horizonLabel}. Group deep-focus work in the morning, meetings mid-day, and admin later. Use realistic time blocks (e.g. "09:00 - 10:30" for a day, or "Mon 09:00 - 11:00" for a week). Assign each block a priority of high, medium, or low. Add a short note only when it clarifies scope.

Return a brief overview (1-2 sentences) plus the ordered blocks.

Tasks:
"""
${data.tasks}
"""`;

    try {
      const { output } = await generateText({
        model: gateway(MODEL),
        output: Output.object({ schema: PlanSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          return PlanSchema.parse(JSON.parse(error.text ?? "{}"));
        } catch {
          return { overview: error.text ?? "", blocks: [] };
        }
      }
      throw error;
    }
  });
