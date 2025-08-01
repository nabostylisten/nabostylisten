"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  DollarSign,
  BookOpen,
  Settings,
  Calendar,
  MessageCircle,
} from "lucide-react";

interface ProfileSidebarProps {
  profileId: string;
  className?: string;
}

const sidebarItems = [
  {
    title: "Min side",
    href: "/profil",
    icon: User,
    description: "Rediger profilinformasjon",
  },
  {
    title: "Mine bookinger",
    href: "/mine-bookinger",
    icon: BookOpen,
    description: "Oversikt over bookinger",
  },
  {
    title: "Tilgjengelighet",
    href: "/tilgjengelighet",
    icon: Calendar,
    description: "Administrer kalender",
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageCircle,
    description: "Meldinger og samtaler",
  },
  {
    title: "Inntjening",
    href: "/inntjening",
    icon: DollarSign,
    description: "Inntekter og utbetalinger",
  },
  {
    title: "Preferanser",
    href: "/preferanser",
    icon: Settings,
    description: "Innstillinger og preferanser",
  },
];

export const ProfileSidebar = ({
  profileId,
  className,
}: ProfileSidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className={cn("w-64 border-r bg-background p-2", className)}>
      <div className="space-y-2">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const href = `/profiler/${profileId}${item.href}`;
            const isActive = pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={href}
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
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

// Export the sidebar items for use in mobile navigation
export { sidebarItems };
