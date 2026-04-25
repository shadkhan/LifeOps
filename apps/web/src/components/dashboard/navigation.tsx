"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  Brain,
  CalendarCheck,
  CheckSquare,
  Compass,
  Flame,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/future-self", label: "Future Self", icon: Compass },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: BookOpenText },
  { href: "/ai-planner", label: "AI Planner", icon: Brain },
  { href: "/weekly-review", label: "Weekly Review", icon: CalendarCheck },
];

type NavigationItem = (typeof navigationItems)[number];

export function AppNavigation({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();

  if (variant === "desktop") {
    return (
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => (
          <NavItem active={isActivePath(pathname, item.href)} key={item.href} {...item} />
        ))}
      </nav>
    );
  }

  return (
      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {navigationItems.map((item) => (
          <MobileNavItem active={isActivePath(pathname, item.href)} key={item.href} {...item} />
        ))}
      </nav>
  );
}

function NavItem({
  active,
  href,
  label,
  icon: Icon,
}: NavigationItem & {
  active: boolean;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground shadow-sm",
      )}
      href={href}
    >
      <span
        className={cn(
          "absolute left-0 top-2 h-6 w-1 rounded-r-full bg-primary opacity-0 transition-opacity duration-200",
          active && "opacity-100",
        )}
      />
      <Icon className={cn("h-4 w-4 transition-transform duration-200 group-hover:scale-105", active && "text-primary")} />
      {label}
    </Link>
  );
}

function MobileNavItem({
  active,
  href,
  label,
  icon: Icon,
}: NavigationItem & {
  active: boolean;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium text-muted-foreground transition-all duration-200",
        active && "border-primary/40 bg-muted text-foreground shadow-sm",
      )}
      href={href}
    >
      <Icon className={cn("h-4 w-4", active && "text-primary")} />
      {label}
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
