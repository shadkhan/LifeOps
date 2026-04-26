"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AISuggestionList, type AISuggestionListItem } from "./ai-suggestion-list";

export function AIReviewSavePanel({
  cancelLabel = "Cancel",
  children,
  className,
  emptyDescription,
  emptyTitle,
  isSaving = false,
  items,
  onCancel,
  onSaveSelected,
  onSelectionChange,
  saveLabel = "Save selected",
  selectedIds,
  title = "Review suggestions",
}: {
  cancelLabel?: string;
  children?: React.ReactNode;
  className?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  isSaving?: boolean;
  items?: AISuggestionListItem[];
  onCancel?: () => void;
  onSaveSelected?: () => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  saveLabel?: string;
  selectedIds?: string[];
  title?: string;
}) {
  const selectedCount = selectedIds?.length ?? items?.length ?? 0;

  return (
    <section className={cn("space-y-4 rounded-md border bg-card p-4", className)} aria-label={title}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Review AI output before saving. Nothing is saved until you confirm.
          </p>
        </div>
        {onCancel ? (
          <Button aria-label={cancelLabel} onClick={onCancel} size="icon" type="button" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {items ? (
        <AISuggestionList
          emptyDescription={emptyDescription}
          emptyTitle={emptyTitle}
          items={items}
          onSelectionChange={onSelectionChange}
          selectedIds={selectedIds}
        />
      ) : null}

      {children}

      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </p>
        <div className="flex flex-wrap gap-2">
          {onCancel ? (
            <Button disabled={isSaving} onClick={onCancel} type="button" variant="outline">
              {cancelLabel}
            </Button>
          ) : null}
          {onSaveSelected ? (
            <Button disabled={isSaving || selectedCount === 0} onClick={onSaveSelected} type="button">
              {isSaving ? "Saving..." : saveLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
