"use client";

import { LoaderCircle, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AIErrorState } from "./ai-error-state";
import { AILoadingState } from "./ai-loading-state";
import { AIProviderStatus } from "./ai-provider-status";

export function AIGenerateCard({
  actions,
  children,
  className,
  description,
  emptyState,
  error,
  isGenerating = false,
  provider,
  title,
}: {
  actions: {
    generateLabel?: string;
    regenerateLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
    onGenerate: () => void;
    showRegenerate?: boolean;
  };
  children?: React.ReactNode;
  className?: string;
  description?: string;
  emptyState?: React.ReactNode;
  error?: string | null;
  isGenerating?: boolean;
  provider?: {
    model?: string | null;
    name?: string | null;
    status?: "ready" | "fallback" | "error";
  };
  title: string;
}) {
  const generateLabel = actions.showRegenerate ? actions.regenerateLabel ?? "Regenerate" : actions.generateLabel ?? "Generate";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{title}</CardTitle>
            {provider ? (
              <AIProviderStatus model={provider.model} provider={provider.name} status={provider.status ?? "ready"} />
            ) : null}
          </div>
          {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {actions.onCancel ? (
            <Button disabled={isGenerating} onClick={actions.onCancel} type="button" variant="outline">
              <X className="h-4 w-4" />
              {actions.cancelLabel ?? "Cancel"}
            </Button>
          ) : null}
          <Button disabled={isGenerating} onClick={actions.onGenerate} type="button">
            {isGenerating ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {actions.showRegenerate ? <RotateCcw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {generateLabel}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGenerating ? <AILoadingState /> : null}
        {!isGenerating && error ? <AIErrorState message={error} /> : null}
        {!isGenerating && !error && children ? children : null}
        {!isGenerating && !error && !children && emptyState ? emptyState : null}
      </CardContent>
    </Card>
  );
}
