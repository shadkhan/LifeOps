import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GoalsLoading() {
  return (
    <div className="animate-page-in space-y-6" role="status" aria-label="Loading goals">
      <div className="space-y-3">
        <div className="loader-progress max-w-md" />
        <div className="skeleton-shimmer h-4 w-24 rounded bg-muted" />
        <div className="skeleton-shimmer h-9 w-40 rounded bg-muted" />
        <div className="skeleton-shimmer h-4 w-full max-w-xl rounded bg-muted" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        {[0, 1].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardHeader>
              <div className="skeleton-shimmer h-5 w-28 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="skeleton-shimmer h-10 rounded bg-muted" />
              <div className="skeleton-shimmer h-24 rounded bg-muted" />
              <div className="skeleton-shimmer h-10 w-32 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        {[0, 1, 2].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardContent className="space-y-4 p-5">
              <div className="skeleton-shimmer h-5 w-2/3 rounded bg-muted" />
              <div className="skeleton-shimmer h-4 w-full rounded bg-muted" />
              <div className="skeleton-shimmer h-2 rounded-full bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
