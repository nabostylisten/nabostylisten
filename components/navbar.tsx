"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthDialog } from "@/components/auth-dialog";
import { UserDropdown } from "@/components/nav/user-dropdown";
import { navigationItems } from "@/lib/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Menu,
  LogOut,
  ShoppingCart,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const { getTotalItems } = useCartStore();
  const { unreadCount } = useUnreadMessages();
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const totalItems = getTotalItems();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setSheetOpen(false);
  };

  const handleLoginClick = () => {
    setAuthMode("login");
    setShowAuthDialog(true);
    setSheetOpen(false);
  };

  const handleLinkClick = () => {
    setSheetOpen(false);
  };

  // Desktop Navbar
  const DesktopNavbar = () => (
    <>
      {/* Logo and Navigation */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <h1 className="font-bold text-xl text-primary">Nabostylisten</h1>
        </Link>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center">
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

        {/* Cart Icon */}
        <CartHoverCard>
          <Button variant="outline" size="sm" className="relative" asChild>
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

        {/* Chat Icon */}
        {user && unreadCount > 0 && (
          <Button variant="outline" size="sm" className="relative" asChild>
            <Link href={`/profiler/${user.id}/chat`}>
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            </Link>
          </Button>
        )}

        <Separator orientation="vertical" className="h-6" />
        <ThemeSwitcher />

        {!loading && (
          <>
            {user ? (
              <UserDropdown
                user={user}
                profile={profile}
                onSignOut={handleSignOut}
              />
            ) : (
              <div className="flex items-center gap-2">
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

        {loading && <Spinner className="w-4 h-4" />}
      </div>
    </>
  );

  // Mobile Navbar
  const MobileNavbar = () => (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <h1 className="font-bold text-lg text-primary">Nabostylisten</h1>
      </Link>

      {/* Right Side - Cart, User, and Sheet */}
      <div className="flex items-center gap-2">
        {/* Cart Icon */}
        <Button variant="outline" size="sm" className="relative" asChild>
          <Link href="/handlekurv">
            <ShoppingCart className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium min-w-4 text-[10px]">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>
        </Button>

        {/* User Dropdown for authenticated users */}
        {!loading && user && (
          <UserDropdown
            user={user}
            profile={profile}
            onSignOut={handleSignOut}
          />
        )}

        {/* Loading State */}
        {loading && <Spinner className="w-4 h-4" />}

        {/* Mobile Sheet Trigger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="w-4 h-4" />
              <span className="sr-only">Åpne meny</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 sm:w-96">
            <SheetHeader className="text-left px-4">
              <div className="flex items-center justify-start gap-2">
                <SheetTitle className="text-primary font-bold font-fraunces text-xl">
                  Nabostylisten
                </SheetTitle>
                <ThemeSwitcher />
              </div>
            </SheetHeader>

            <div className="flex flex-col h-full pt-6 px-4">
              {/* Auth Buttons for Unauthenticated Users - Above Navigation */}
              {!loading && !user && (
                <div className="space-y-2 mb-6">
                  <Button
                    variant="outline"
                    onClick={handleLoginClick}
                    className="w-full"
                  >
                    Logg inn
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/bli-stylist" onClick={handleLinkClick}>
                      Bli stylist
                    </Link>
                  </Button>
                </div>
              )}

              <div className="space-y-6">
                {/* Navigation Links */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Navigasjon
                  </h3>
                  {navigationItems.map((item) => (
                    <Button
                      key={item.title}
                      variant="ghost"
                      className="w-full justify-start text-base"
                      asChild
                    >
                      <Link href={item.href!} onClick={handleLinkClick}>
                        <ChevronRight className="w-4 h-4" /> {item.title}
                      </Link>
                    </Button>
                  ))}
                </div>

                {/* Quick Actions - Only show if there are actions to show */}
                {((user && unreadCount > 0) || 
                  (!loading && user && (profile?.role === "customer" || !profile?.role))) && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Handlinger
                    </h3>

                    {/* Chat Link with Badge */}
                    {user && unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base"
                        asChild
                      >
                        <Link
                          href={`/profiler/${user.id}/chat`}
                          onClick={handleLinkClick}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Meldinger
                          <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        </Link>
                      </Button>
                    )}

                    {/* Bli stylist button */}
                    {!loading &&
                      user &&
                      (profile?.role === "customer" || !profile?.role) && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-base"
                          asChild
                        >
                          <Link href="/bli-stylist" onClick={handleLinkClick}>
                            Bli stylist
                          </Link>
                        </Button>
                      )}
                  </div>
                )}

                {/* User Profile Links */}
                {user && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Min profil
                    </h3>
                    {getSidebarItems(profile?.role).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className="w-full justify-start text-base"
                          asChild
                        >
                          <Link
                            href={`/profiler/${user.id}${item.href}`}
                            onClick={handleLinkClick}
                            className="flex items-center gap-2"
                          >
                            <Icon className="w-4 h-4" />
                            {item.title}
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                )}

                {/* Admin Links */}
                {user && profile && isAdmin(profile.role) && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Admin
                    </h3>
                    {adminSidebarItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className="w-full justify-start text-base"
                          asChild
                        >
                          <Link
                            href={item.href}
                            onClick={handleLinkClick}
                            className="flex items-center gap-2"
                          >
                            <Icon className="w-4 h-4" />
                            {item.title}
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Auth Actions at Bottom - Only for authenticated users */}
              {!loading && user && (
                <div className="mt-auto pt-6 pb-6 border-t space-y-2">
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-base"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logg ut
                  </Button>
                </div>
              )}

              {loading && (
                <div className="mt-auto flex justify-center py-4">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );

  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background border-b">
      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-12 min-h-16 flex items-center justify-between">
        {isMobile ? <MobileNavbar /> : <DesktopNavbar />}
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        initialMode={authMode}
      />
    </header>
  );
};
