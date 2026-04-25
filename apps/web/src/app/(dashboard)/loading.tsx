import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="animate-page-in space-y-6" role="status" aria-label="Loading page">
      <div className="space-y-3">
        <div className="loader-progress max-w-md" />
        <div className="skeleton-shimmer h-4 w-28 rounded bg-muted" />
        <div className="skeleton-shimmer h-9 w-64 rounded bg-muted" />
        <div className="skeleton-shimmer h-4 w-full max-w-2xl rounded bg-muted" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardHeader>
              <div className="skeleton-shimmer h-4 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="skeleton-shimmer h-8 w-16 rounded bg-muted" />
              <div className="skeleton-shimmer h-3 w-full rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {[0, 1].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardHeader>
              <div className="skeleton-shimmer h-5 w-36 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="skeleton-shimmer h-24 rounded bg-muted" />
              <div className="skeleton-shimmer h-10 w-36 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
