"use client";

import { Compass, Pencil, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIFutureSelfGenerator } from "./ai-future-self-generator";
import { FutureSelfForm, type FutureSelfProfileDraft } from "./forms";

type FutureSelfWorkspaceProps = {
  futureSelf?: {
    title: string;
    description: string | null;
    identityStatement: string;
  } | null;
};

export function FutureSelfWorkspace({ futureSelf }: FutureSelfWorkspaceProps) {
  const [draft, setDraft] = useState<FutureSelfProfileDraft | null>(null);
  const [openPanel, setOpenPanel] = useState<"ai" | "profile" | null>(futureSelf ? null : "profile");

  const stageProfileDraft = useCallback((nextDraft: FutureSelfProfileDraft) => {
    setDraft(nextDraft);
    setOpenPanel("profile");
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Future Self Profile</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your identity anchor for deciding which goals, habits, tasks, and reviews matter most.
            </p>
          </div>
          <Compass className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {futureSelf ? (
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="text-sm font-semibold">{futureSelf.title}</p>
              <p className="mt-2 text-base font-medium leading-7">{futureSelf.identityStatement}</p>
              {futureSelf.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{futureSelf.description}</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-dashed bg-muted/30 p-4">
              <p className="text-sm font-medium">No Future Self profile yet</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Create a profile first, then connect life areas, goals, habits, and tasks to it.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOpenPanel(openPanel === "profile" ? null : "profile")} type="button">
              {openPanel === "profile" ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {openPanel === "profile" ? "Close profile form" : futureSelf ? "Edit profile" : "Create profile"}
            </Button>
            <Button onClick={() => setOpenPanel(openPanel === "ai" ? null : "ai")} type="button" variant="outline">
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {openPanel === "ai" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>AI future self draft</CardTitle>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Describe the version of yourself you want to become. Review the draft before saving anything.
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AIFutureSelfGenerator onProfileDraft={stageProfileDraft} />
          </CardContent>
        </Card>
      ) : null}

      {openPanel === "profile" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{futureSelf ? "Edit Future Self Profile" : "Create Future Self Profile"}</CardTitle>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <FutureSelfForm draft={draft} futureSelf={futureSelf} onRevertDraft={() => setDraft(null)} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
