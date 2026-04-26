import { CheckCircle2, CloudOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIProviderStatus({
  className,
  model,
  provider,
  status = "ready",
}: {
  className?: string;
  model?: string | null;
  provider?: string | null;
  status?: "ready" | "fallback" | "error";
}) {
  const Icon = status === "error" ? CloudOff : status === "fallback" ? Sparkles : CheckCircle2;

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground",
        status === "fallback" && "border-amber-200 bg-amber-50 text-amber-900",
        status === "error" && "border-red-200 bg-red-50 text-red-800",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        {status === "fallback" ? "Fallback" : provider ?? "AI provider"}
        {model ? ` · ${model}` : ""}
      </span>
    </div>
  );
}
