import { LoaderCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AILoadingState({
  className,
  label = "Generating suggestions",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("space-y-3 rounded-md border bg-muted/30 p-4", className)} role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium">
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        {label}
      </div>
      <div className="loader-progress" />
      <div className="skeleton-shimmer h-4 w-2/3 rounded bg-muted" />
      <div className="skeleton-shimmer h-4 w-full rounded bg-muted" />
      <div className="skeleton-shimmer h-4 w-5/6 rounded bg-muted" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Output will be shown for review before anything is saved.
      </div>
    </div>
  );
}
