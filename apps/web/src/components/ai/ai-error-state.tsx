import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AIErrorState({
  action,
  className,
  message,
  title = "AI could not generate suggestions",
}: {
  action?: {
    label?: string;
    onClick: () => void;
  };
  className?: string;
  message: string;
  title?: string;
}) {
  return (
    <div className={cn("rounded-md border border-red-200 bg-red-50 p-4 text-red-900", className)} role="alert">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-sm leading-6 text-red-800">{message}</p>
          <p className="mt-2 text-sm leading-6 text-red-800">You can continue with the manual workflow.</p>
          {action ? (
            <Button className="mt-3 border-red-200 bg-white hover:bg-red-100" onClick={action.onClick} type="button" variant="outline">
              <RotateCcw className="h-4 w-4" />
              {action.label ?? "Try again"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
