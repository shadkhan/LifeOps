"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLifeAreaForm } from "./forms";

export function AddLifeAreaCard({ disabled }: { disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Add life area</CardTitle>
        <Button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Collapse add life area form" : "Expand add life area form"}
          onClick={() => setIsOpen((current) => !current)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CardHeader>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <CardContent>
            <AddLifeAreaForm disabled={disabled} />
            {disabled ? (
              <p className="mt-3 text-sm text-muted-foreground">Create the future version first, then add life areas.</p>
            ) : null}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
