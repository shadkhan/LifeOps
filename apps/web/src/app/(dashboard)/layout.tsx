import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/dashboard/app-shell";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        email: session.user.email,
        name: session.user.name ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
