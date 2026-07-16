# AI Workplace Productivity Assistant — L&L Services

A clean, modern SaaS dashboard with three AI-powered tools. No auth, no database, no persistence — state lives only in the current browser session.

## Note on "no backend"
Real AI responses require a server call so the API key stays secret. I'll use Lovable AI Gateway through a thin TanStack server function (`openai/gpt-5.5`). There's no database, no auth, no user data stored — the server function only forwards the prompt to the model and returns the text. Functionally this matches "frontend-only" from the user's perspective.

## Layout
- **Header**: "L&L Services" wordmark + small "AI Workplace Assistant" tagline, sidebar toggle on mobile.
- **Sidebar** (shadcn sidebar, collapsible): nav items for Meeting Notes, Task Planner, Chatbot.
- **Main area**: routed page per feature.
- **Footer**: Responsible AI disclaimer (persistent across pages).
- Responsive: sidebar collapses to icon rail on desktop, off-canvas on mobile.
- Design: minimal professional SaaS — neutral surfaces, single accent color, generous spacing, rounded cards, subtle borders. No purple gradients.

## Routes
- `/` → Meeting Notes Summarizer (replaces placeholder index)
- `/planner` → AI Task Planner
- `/chat` → AI Workplace Chatbot

Each page sets its own `head()` title + description.

## Feature 1 — Meeting Notes Summarizer
- Large textarea for pasted notes.
- "Generate Summary" button → calls AI with a structured prompt requesting: Summary, Key Discussion Points, Action Items (with Owner + Deadline), Decisions.
- Output rendered as an **editable** structured card (each section is a contenteditable/textarea block the user can revise).
- Copy-to-clipboard button.

## Feature 2 — AI Task Planner
- Textarea for tasks (one per line or free-form) + toggle Daily/Weekly.
- "Generate Plan" → AI returns a prioritized schedule with time blocks, grouped by priority (High/Medium/Low).
- Editable output: each task row (time, task, priority) can be edited inline; add/remove rows.

## Feature 3 — AI Workplace Chatbot
- Standard chat UI using AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`).
- Streams responses via `useChat` + `/api/chat` server route.
- System prompt tuned for workplace tasks: draft emails, summaries, agendas, general Q&A.
- Assistant messages have no background; user messages use primary bubble.
- Session-only history (in-memory).

## Responsible AI disclaimer
Small muted footer on every page: "AI-generated content may be inaccurate. Review before use. Do not paste confidential or personal data."

## Technical
- **Server**:
  - `src/routes/api/chat.ts` — streaming chat route for the chatbot.
  - `src/lib/ai.functions.ts` — `summarizeMeeting` and `planTasks` server functions (one-shot `generateText` with structured `Output.object` schemas — kept small, no schema bounds).
  - `src/lib/ai-gateway.server.ts` — Lovable AI Gateway provider helper.
- **Client**:
  - `src/components/app-sidebar.tsx`, `src/components/app-header.tsx`, `src/components/ai-disclaimer.tsx`.
  - Root layout in `__root.tsx` wraps `<Outlet />` in `SidebarProvider` + header + footer.
  - Install AI Elements: `bunx ai-elements@latest add conversation message prompt-input shimmer`.
- **Model**: `openai/gpt-5.5` for all three features.
- **Tokens**: light neutral theme in `src/styles.css` (keep existing oklch tokens; adjust primary to a professional deep blue-slate).
- **Real page-route titles/descriptions** per route (no shared root metadata).

## Out of scope
No auth, no Supabase, no database, no file upload, no persistence between reloads.
