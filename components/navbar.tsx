"use client";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { navigationItems } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Menu, MoveRight, X, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/kibo-ui/spinner";
import { getSidebarItems } from "./profile-sidebar";
import { adminSidebarItems } from "./admin-sidebar";
import { isAdmin } from "@/lib/permissions";

export const Navbar = () => {
  const [isOpen, setOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background border-b">
      <div className="w-full max-w-none mx-auto px-6 lg:px-12 min-h-16 flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-bold text-xl text-primary">
              Nabostylisten
            </span>
          </Link>

          {/* Vertical Separator */}
          <Separator orientation="vertical" className="h-6" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            <NavigationMenu className="flex justify-start items-start">
              <NavigationMenuList className="flex justify-start gap-1 flex-row">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.title}>
                    {item.href ? (
                      <NavigationMenuLink asChild>
                        <Link href={item.href}>
                          <Button variant="ghost" size="sm">
                            {item.title}
                          </Button>
                        </Link>
                      </NavigationMenuLink>
                    ) : (
                      <>
                        <NavigationMenuTrigger className="font-medium text-sm">
                          {item.title}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="!w-[400px] p-4">
                          <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                            <div className="flex flex-col h-full justify-between">
                              <div className="flex flex-col">
                                <p className="text-base font-medium">
                                  {item.title}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {item.description}
                                </p>
                              </div>
                              <Button size="sm" className="mt-4" asChild>
                                <Link href="/services">Se alle tjenester</Link>
                              </Button>
                            </div>
                            <div className="flex flex-col text-sm h-full justify-end">
                              {item.items?.map((subItem) => (
                                <NavigationMenuLink
                                  key={subItem.title}
                                  asChild
                                  className="flex flex-row justify-between items-center hover:bg-muted py-2 px-4 rounded"
                                >
                                  <Link href={subItem.href}>
                                    <span>{subItem.title}</span>
                                    <MoveRight className="w-4 h-4 text-muted-foreground" />
                                  </Link>
                                </NavigationMenuLink>
                              ))}
                            </div>
                          </div>
                        </NavigationMenuContent>
                      </>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <ThemeSwitcher />

          {!loading && (
            <>
              {user ? (
                // Authenticated User Dropdown
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      <CurrentUserAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div>
                      {getSidebarItems(profile?.role).map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link
                              href={`/profiler/${user.id}${item.href}`}
                              className="flex items-center gap-2"
                            >
                              <Icon className="w-4 h-4" />
                              {item.title}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                    </div>

                    {/* Admin navigation - only show on mobile for admins */}
                    {profile && isAdmin(profile.role) && (
                      <div>
                        {adminSidebarItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <DropdownMenuItem key={item.href} asChild>
                              <Link
                                href={item.href}
                                className="flex items-center gap-2"
                              >
                                <Icon className="w-4 h-4" />
                                {item.title}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuSeparator />
                      </div>
                    )}
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logg ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Unauthenticated User Buttons
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/login">Logg inn</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/bli-stylist">Bli stylist</Link>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {loading && <Spinner className="w-4 h-4" />}

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setOpen(!isOpen)}>
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 border-t bg-background shadow-lg">
          <div className="px-6 py-4 space-y-4">
            {/* Mobile Navigation Items */}
            {navigationItems.map((item) => (
              <div key={item.title} className="space-y-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex justify-between items-center py-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-lg">{item.title}</span>
                    <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                  </Link>
                ) : (
                  <>
                    <p className="text-lg font-medium">{item.title}</p>
                    {item.items && (
                      <div className="pl-4 space-y-1">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.title}
                            href={subItem.href}
                            className="flex justify-between items-center py-1"
                            onClick={() => setOpen(false)}
                          >
                            <span className="text-muted-foreground">
                              {subItem.title}
                            </span>
                            <MoveRight className="w-4 h-4 stroke-1" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Mobile Auth Buttons */}
            {!loading && !user && (
              <div className="pt-4 border-t space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/auth/login" onClick={() => setOpen(false)}>
                    Logg inn
                  </Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/bli-stylist" onClick={() => setOpen(false)}>
                    Bli stylist
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Loading State */}
            {loading && <Spinner className="w-4 h-4" />}
          </div>
        </div>
      )}
    </header>
  );
};
