import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function FutureSelfLoading() {
  return (
    <div className="animate-page-in space-y-6" role="status" aria-label="Loading future self">
      <div className="space-y-3">
        <div className="loader-progress max-w-md" />
        <div className="skeleton-shimmer h-4 w-24 rounded bg-muted" />
        <div className="skeleton-shimmer h-9 w-56 rounded bg-muted" />
        <div className="skeleton-shimmer h-4 w-full max-w-xl rounded bg-muted" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        {[0, 1].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardHeader>
              <div className="skeleton-shimmer h-5 w-32 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="skeleton-shimmer h-10 rounded bg-muted" />
              <div className="skeleton-shimmer h-24 rounded bg-muted" />
              <div className="skeleton-shimmer h-10 w-32 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
