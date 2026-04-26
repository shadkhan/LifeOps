"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AISuggestionListItem = {
  id: string;
  title: string;
  description?: string | null;
  meta?: string | null;
};

export function AISuggestionList({
  emptyDescription = "Generate suggestions to review them here.",
  emptyTitle = "No suggestions yet",
  items,
  onSelectionChange,
  selectedIds,
}: {
  emptyDescription?: string;
  emptyTitle?: string;
  items: AISuggestionListItem[];
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedIds?: string[];
}) {
  const controlled = Boolean(onSelectionChange && selectedIds);
  const selected = new Set(selectedIds ?? items.map((item) => item.id));

  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-4">
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const checked = selected.has(item.id);
        return (
          <label
            className={cn(
              "flex cursor-pointer gap-3 rounded-md border bg-background p-3 text-sm transition-colors hover:bg-muted/50",
              checked && "border-primary/40 bg-primary/5",
            )}
            key={item.id}
          >
            {controlled ? (
              <input
                checked={checked}
                className="sr-only"
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, item.id]
                    : Array.from(selected).filter((selectedId) => selectedId !== item.id);
                  onSelectionChange?.(next);
                }}
                type="checkbox"
              />
            ) : null}
            {checked ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-medium leading-5">{item.title}</span>
              {item.meta ? <span className="mt-1 block text-xs text-muted-foreground">{item.meta}</span> : null}
              {item.description ? (
                <span className="mt-1 block leading-6 text-muted-foreground">{item.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
