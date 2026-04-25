import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NotesLoading() {
  return (
    <div className="animate-page-in space-y-6" role="status" aria-label="Loading notes">
      <div className="space-y-3">
        <div className="loader-progress max-w-md" />
        <div className="skeleton-shimmer h-4 w-24 rounded bg-muted" />
        <div className="skeleton-shimmer h-9 w-36 rounded bg-muted" />
        <div className="skeleton-shimmer h-4 w-full max-w-2xl rounded bg-muted" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {[0, 1].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardHeader>
              <div className="skeleton-shimmer h-5 w-28 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="skeleton-shimmer h-10 rounded bg-muted" />
              <div className="skeleton-shimmer h-40 rounded bg-muted" />
              <div className="skeleton-shimmer h-10 w-32 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardContent className="space-y-4 p-5">
              <div className="skeleton-shimmer h-5 w-2/3 rounded bg-muted" />
              <div className="skeleton-shimmer h-24 rounded bg-muted" />
              <div className="flex gap-2">
                <div className="skeleton-shimmer h-7 w-16 rounded bg-muted" />
                <div className="skeleton-shimmer h-7 w-20 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
