"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FutureSelfError({ reset }: { reset: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Future Self could not load</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Something went wrong while loading this module. Try again, and check the database connection if it persists.
        </p>
        <Button onClick={reset} type="button" variant="outline">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
