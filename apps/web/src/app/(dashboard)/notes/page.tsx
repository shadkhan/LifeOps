import { BookOpenText, Link2, Search } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getNoteLinkOptions, getNotesForUser, type NotesView } from "@/lib/db/notes";
import { cn } from "@/lib/utils";
import { CreateNoteForm, DeleteNoteButton, EditNoteForm } from "./forms";

const noteViews: Array<{ value: NotesView; label: string }> = [
  { value: "all", label: "All notes" },
  { value: "recent", label: "Recent notes" },
  { value: "linked", label: "Linked notes" },
];

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const view = parseView(params.view);
  const query = String(params.q ?? "").trim();
  const [links, notes] = await Promise.all([
    getNoteLinkOptions(user.id),
    getNotesForUser(user.id, {
      query,
      view,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">LifeOps</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">Notes</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Capture markdown-friendly notes and connect them to goals, habits, or tasks.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create note</CardTitle>
            <BookOpenText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CreateNoteForm links={links} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Find notes</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-2">
              <input name="view" type="hidden" value={view} />
              <label className="block space-y-2 text-sm font-medium">
                <span>Search</span>
                <input
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
                  defaultValue={query}
                  name="q"
                  placeholder="Search title, body, or exact tag"
                  type="search"
                />
              </label>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
                Search notes
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-sm font-medium">View</p>
              <div className="flex flex-wrap gap-2">
                {noteViews.map((item) => (
                  <FilterLink
                    active={view === item.value}
                    href={buildNotesHref({ view: item.value, query })}
                    key={item.value}
                    label={item.label}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">{noteViews.find((item) => item.value === view)?.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? "note" : "notes"} shown
          </p>
        </div>

        {notes.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {notes.map((note) => (
              <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" key={note.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="leading-6">{note.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(note.updatedAt)}</p>
                  </div>
                  <DeleteNoteButton noteId={note.id} />
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
                    {truncate(note.body, 420)}
                  </p>

                  {note.tags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground" key={tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {note.goal ? <LinkBadge label={`Goal: ${note.goal.title}`} /> : null}
                    {note.habit ? <LinkBadge label={`Habit: ${note.habit.name}`} /> : null}
                    {note.task ? <LinkBadge label={`Task: ${note.task.title}`} /> : null}
                    {!note.goal && !note.habit && !note.task ? (
                      <span className="text-sm text-muted-foreground">No linked item</span>
                    ) : null}
                  </div>

                  {note.aiSummary ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-medium uppercase text-emerald-800">AI summary</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-900">{note.aiSummary}</p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
                      AI summary placeholder
                    </div>
                  )}

                  <div className="border-t pt-5">
                    <p className="mb-3 text-sm font-medium">Edit note</p>
                    <EditNoteForm links={links} note={note} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted">
                <BookOpenText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">No notes found</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  Create a note for reflections, decisions, observations, or next actions. Link it when it belongs to a
                  goal, habit, or task.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function FilterLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={cn(
        "rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "border-primary/40 bg-muted text-foreground",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

function LinkBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs text-primary">
      <Link2 className="h-3 w-3" />
      {label}
    </span>
  );
}

function parseView(value: string | undefined): NotesView {
  if (value === "recent" || value === "linked") {
    return value;
  }

  return "all";
}

function buildNotesHref({ view, query }: { view: NotesView; query: string }) {
  const params = new URLSearchParams();

  if (view !== "all") {
    params.set("view", view);
  }

  if (query) {
    params.set("q", query);
  }

  const paramString = params.toString();
  return paramString ? `/notes?${paramString}` : "/notes";
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
