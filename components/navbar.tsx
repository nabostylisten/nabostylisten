"use client";

import { Button } from "@/components/ui/button";
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
import { AuthDialog } from "@/components/auth-dialog";
import { navigationItems } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, LogOut, ShoppingCart, MessageCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/kibo-ui/spinner";
import { getSidebarItems } from "./profile-sidebar";
import { adminSidebarItems } from "./admin-sidebar";
import { isAdmin } from "@/lib/permissions";
import { CartHoverCard } from "@/components/cart/cart-hover-card";
import { useCartStore } from "@/stores/cart.store";
import { useUnreadMessages } from "@/hooks/use-unread-messages";

export const Navbar = () => {
  const [isOpen, setOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const { getTotalItems } = useCartStore();
  const { unreadCount } = useUnreadMessages();

  const totalItems = getTotalItems();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleLoginClick = () => {
    setAuthMode("login");
    setShowAuthDialog(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("signup");
    setShowAuthDialog(true);
  };

  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background border-b">
      <div className="w-full max-w-none mx-auto px-6 lg:px-12 min-h-16 flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="font-bold text-xl text-primary">Nabostylisten</h1>
          </Link>

          {/* Vertical Separator */}
          <Separator orientation="vertical" className="h-6" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            {navigationItems.map((item) => (
              <Button key={item.title} variant="ghost" size="sm" asChild>
                <Link href={item.href!}>{item.title}</Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Bli stylist button for customers */}
          {!loading &&
            user &&
            (profile?.role === "customer" || !profile?.role) && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/bli-stylist">Bli stylist</Link>
              </Button>
            )}

          {/* Cart Icon - always visible */}
          <>
            <CartHoverCard>
              <Button variant="ghost" size="sm" className="relative" asChild>
                <Link href="/handlekurv">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-5">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </Button>
            </CartHoverCard>

            {/* Chat Icon - only for authenticated users with unread messages */}
            {user && unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="relative" asChild>
                <Link href={`/profiler/${user.id}/chat`}>
                  <MessageCircle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </Link>
              </Button>
            )}

            <Separator orientation="vertical" className="h-6" />
          </>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {!loading && (
            <>
              {user ? (
                // Authenticated User Dropdown
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <CurrentUserAvatar />
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
                  <Button variant="outline" size="sm" onClick={handleLoginClick}>
                    Logg inn
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
              <Link
                key={item.title}
                href={item.href!}
                className="flex justify-between items-center py-2"
                onClick={() => setOpen(false)}
              >
                <span className="text-lg">{item.title}</span>
              </Link>
            ))}

            {/* Mobile Auth Buttons */}
            {!loading && !user && (
              <div className="pt-4 border-t space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => {
                    setOpen(false);
                    handleLoginClick();
                  }}
                >
                  Logg inn
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

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        initialMode={authMode}
      />
    </header>
  );
};
