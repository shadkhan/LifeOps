import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { AppNavigation } from "./navigation";

export function AppShell({
  children,
  user,
}: Readonly<{
  children: React.ReactNode;
  user: {
    email: string;
    name: string | null;
  };
}>) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card/95 px-4 py-5 shadow-sm lg:flex lg:flex-col">
        <Link className="flex items-center gap-3 rounded-md px-2 py-2" href="/dashboard">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold">LifeOps</p>
            <p className="text-xs text-muted-foreground">Personal operating system</p>
          </div>
        </Link>

        <AppNavigation variant="desktop" />

        <div className="rounded-md border bg-muted/60 p-3">
          <p className="text-sm font-medium">{user.name ?? "LifeOps User"}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-muted-foreground">LifeOps MVP</p>
              <h1 className="truncate text-xl font-semibold">Dashboard-first workspace</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/ai-planner">
                  Plan my day
                  <Sparkles className="h-4 w-4" />
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button aria-label="Log out" size="icon" type="submit" variant="outline">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <AppNavigation variant="mobile" />
        </header>

        <main className="animate-page-in mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
