import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <div className="animate-page-in space-y-6" role="status" aria-label="Loading admin settings">
      <div className="space-y-3">
        <div className="loader-progress max-w-md" />
        <div className="skeleton-shimmer h-4 w-24 rounded bg-muted" />
        <div className="skeleton-shimmer h-9 w-36 rounded bg-muted" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        {[0, 1].map((item) => (
          <Card className="overflow-hidden" key={item}>
            <CardHeader>
              <div className="skeleton-shimmer h-5 w-36 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="skeleton-shimmer h-10 rounded bg-muted" />
              <div className="skeleton-shimmer h-10 rounded bg-muted" />
              <div className="skeleton-shimmer h-10 w-36 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
