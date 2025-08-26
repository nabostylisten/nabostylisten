"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Scissors, CreditCard } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";

interface AdminSidebarProps {
  className?: string;
}

const adminSidebarItems = [
  {
    title: "Oversikt",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Dashboard og statistikk",
  },
  {
    title: "Søknader",
    href: "/admin/soknader",
    icon: FileText,
    description: "Håndter stylist-søknader",
  },
  {
    title: "Tjenester",
    href: "/admin/tjenester",
    icon: Scissors,
    description: "Administrer kategorier",
  },
  {
    title: "Betalinger",
    href: "/admin/betalinger",
    icon: CreditCard,
    description: "Administrer betalinger og refusjon",
  },
];

export const AdminSidebar = ({ className }: AdminSidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className={cn("w-64 bg-background p-2", className)}>
      <div className="flex flex-col gap-4">
        <nav className="flex flex-col gap-2">
          {adminSidebarItems.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <BlurFade key={item.href} delay={index * 0.05} duration={0.5}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </Link>
              </BlurFade>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

// Export the sidebar items for use in mobile navigation
export { adminSidebarItems };
