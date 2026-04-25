import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">LifeOps</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-normal">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            This module is ready for its MVP workflows, including loading, empty, and error states.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
