import { Compass, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getFutureSelfForUser } from "@/lib/db/future-self";
import { AddLifeAreaForm, EditLifeAreaForm, FutureSelfForm } from "./forms";

export default async function FutureSelfPage() {
  const user = await requireCurrentUser();
  const futureSelf = await getFutureSelfForUser(user.id);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">LifeOps</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">Future Self</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Define the identity you are building toward, then map each life area from current reality to vision.
          </p>
        </div>
      </section>

      {!futureSelf ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Create your future self profile</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  Start with a title, description, and identity statement. Life areas become more useful after this exists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Profile</CardTitle>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <FutureSelfForm futureSelf={futureSelf} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Add life area</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AddLifeAreaForm disabled={!futureSelf} />
            {!futureSelf ? (
              <p className="mt-3 text-sm text-muted-foreground">Create the profile first, then add life areas.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Life areas</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add vision, current reality, and gap notes for each area of life.
          </p>
        </div>

        {futureSelf?.lifeAreas.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {futureSelf.lifeAreas.map((lifeArea) => (
              <EditLifeAreaForm key={lifeArea.id} lifeArea={lifeArea} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6">
              <p className="text-sm font-medium">No life areas yet</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add areas like health, career, relationships, learning, or finance to connect your goals to a wider vision.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
