import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getFutureSelfForUser } from "@/lib/db/future-self";
import { AddLifeAreaCard } from "./add-life-area-card";
import { EditLifeAreaForm } from "./forms";
import { FutureSelfWorkspace } from "./future-self-workspace";

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

      <FutureSelfWorkspace futureSelf={futureSelf} />

      <section>
        <AddLifeAreaCard disabled={!futureSelf} />
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
