"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart.store";
import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function CartPage() {
  const router = useRouter();
  const { 
    items, 
    removeFromCart, 
    clearCart, 
    getTotalItems, 
    getTotalPrice,
    getCurrentStylist,
    updateQuantity
  } = useCartStore();
  
  const [removeServiceId, setRemoveServiceId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const currentStylist = getCurrentStylist();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsCheckingAuth(false);
    };

    checkAuth();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        setShowAuthDialog(false);
        router.push('/bestilling');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (totalItems === 0) {
    return (
      <div className="min-h-screen pt-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <BlurFade duration={0.5} inView>
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake
              </Button>
            </div>
          </BlurFade>

          <BlurFade delay={0.1} duration={0.5} inView>
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">Handlekurven er tom</h2>
                <p className="text-muted-foreground mb-6">
                  Du har ingen tjenester i handlekurven din for øyeblikket.
                </p>
                <Button asChild>
                  <Link href="/tjenester">
                    Utforsk tjenester
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    );
  }

  const handleRemoveFromCart = (serviceId: string) => {
    removeFromCart(serviceId);
    setRemoveServiceId(null);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleProceedToBooking = () => {
    if (user) {
      router.push('/bestilling');
    } else {
      setShowAuthDialog(true);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <BlurFade duration={0.5} inView>
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            <h1 className="text-3xl font-bold">Handlekurv</h1>
          </div>
        </BlurFade>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Tjenester ({totalItems})
                  </CardTitle>
                  {totalItems > 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Tøm handlekurv
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tøm handlekurv</AlertDialogTitle>
                          <AlertDialogDescription>
                            Er du sikker på at du vil fjerne alle tjenester fra handlekurven?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearCart}>
                            Tøm handlekurv
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStylist && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">
                      Stylist
                    </h3>
                    <p className="font-semibold">{currentStylist.full_name}</p>
                  </div>
                )}

                {items.map((item) => (
                  <div key={item.service.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.service.title}</h3>
                      {item.service.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.service.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          {item.service.price} {item.service.currency}
                        </span>
                        <span className="text-muted-foreground">
                          {item.service.duration_minutes} min
                        </span>
                      </div>
                      
                      {item.quantity > 1 && (
                        <div className="mt-2">
                          <span className="text-sm bg-muted px-2 py-1 rounded">
                            Antall: {item.quantity}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end justify-between">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setRemoveServiceId(item.service.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fjern tjeneste</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil fjerne "{item.service.title}" fra handlekurven?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveFromCart(item.service.id)}>
                              Fjern
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      {item.quantity > 1 && (
                        <span className="text-lg font-semibold">
                          {(item.service.price * item.quantity).toFixed(2)} {item.service.currency}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
              </Card>
            </BlurFade>
          </div>

          {/* Order Summary */}
          <div>
            <BlurFade delay={0.15} duration={0.5} inView>
              <Card>
              <CardHeader>
                <CardTitle>Sammendrag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.service.id} className="flex justify-between text-sm">
                      <span>
                        {item.service.title}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                      <span>
                        {(item.service.price * item.quantity).toFixed(2)} {item.service.currency}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{totalPrice.toFixed(2)} NOK</span>
                </div>
                
                <div className="space-y-2 pt-4">
                  <Button 
                    className="w-full" 
                    disabled={isCheckingAuth}
                    onClick={handleProceedToBooking}
                  >
                    {isCheckingAuth ? "Laster..." : "Fortsett til booking"}
                  </Button>
                </div>
              </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>

        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog}
          redirectTo="/bestilling"
          labels={{
            loginDescription: "Logg inn for å fortsette til booking",
            signupDescription: "Opprett en konto for å fortsette til booking",
          }}
        />
      </div>
    </div>
  );
}