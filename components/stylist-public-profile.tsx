"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import {
  MapPin,
  Star,
  Clock,
  CheckCircle,
  Award,
  MessageCircle,
  Camera,
  Users,
  Video,
  Instagram,
  Facebook,
  Youtube,
  Link as LucideLink,
} from "lucide-react";
import { FaTiktok, FaSnapchatGhost } from "react-icons/fa";
import Link from "next/link";
import type { StylistProfileData } from "@/server/profile.actions";
import { BlurFade } from "@/components/magicui/blur-fade";
import {
  getPlatformFromUrl,
  getSocialMediaDisplayName,
} from "@/lib/social-media";

type StylistPublicProfileProps = NonNullable<StylistProfileData>;

export function StylistPublicProfile({
  profile,
  services,
  reviews,
  stats,
}: StylistPublicProfileProps) {
  const stylistDetails = profile.stylist_details;
  const primaryAddress = profile.addresses?.find((addr) => addr.is_primary);

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "time" : "timer"}`;
    }
    return `${hours}t ${remainingMinutes}min`;
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <BlurFade delay={0.1} duration={0.5} inView>
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-32 h-32 mx-auto md:mx-0">
                  <AvatarImage src={profile.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {profile.full_name}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                    {stats.averageRating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {stats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({stats.totalReviews} anmeldelser)
                        </span>
                      </div>
                    )}
                    {primaryAddress && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {primaryAddress.city}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    {stylistDetails?.can_travel && (
                      <Badge variant="secondary">Reiser til deg</Badge>
                    )}
                    {stylistDetails?.has_own_place && (
                      <Badge variant="secondary">Har eget sted</Badge>
                    )}
                  </div>
                  {stylistDetails?.bio && (
                    <p className="text-muted-foreground leading-relaxed">
                      {stylistDetails.bio}
                    </p>
                  )}
                </div>
              </div>
            </BlurFade>

            {/* Services */}
            {services.length > 0 && (
              <BlurFade delay={0.2} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Mine tjenester</CardTitle>
                    <CardDescription>
                      Alle prisene er startpriser og kan variere basert på
                      kompleksitet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {services.map((service, index) => (
                      <BlurFade
                        key={service.id}
                        delay={0.05 + index * 0.05}
                        duration={0.5}
                      >
                        <div>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold">{service.title}</h3>
                              <p className="text-muted-foreground mb-2">
                                {service.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  {formatDuration(service.duration_minutes)}
                                </div>
                                {service.at_customer_place && (
                                  <Badge variant="outline" className="text-xs">
                                    Hjemme
                                  </Badge>
                                )}
                                {service.at_stylist_place && (
                                  <Badge variant="outline" className="text-xs">
                                    Hos stylist
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-semibold text-lg">
                                  Fra {service.price} {service.currency}
                                </div>
                              </div>
                              <AddToCartButton
                                service={service}
                                stylist={profile}
                                size="sm"
                              />
                            </div>
                          </div>
                          {index < services.length - 1 && (
                            <Separator className="mt-6" />
                          )}
                        </div>
                      </BlurFade>
                    ))}
                  </CardContent>
                </Card>
              </BlurFade>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <BlurFade delay={0.25} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Anmeldelser ({stats.totalReviews})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reviews.map((review, index) => (
                      <BlurFade
                        key={review.id}
                        delay={0.05 + index * 0.05}
                        duration={0.5}
                      >
                        <div>
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="text-sm">
                                {review.profiles?.full_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {review.profiles?.full_name || "Anonym"}
                                </span>
                                <div className="flex">
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                    />
                                  ))}
                                </div>
                                {review.bookings?.booking_services?.[0]
                                  ?.services && (
                                  <Badge variant="outline" className="text-xs">
                                    {
                                      review.bookings.booking_services[0]
                                        .services.title
                                    }
                                  </Badge>
                                )}
                              </div>
                              {review.comment && (
                                <p className="text-muted-foreground mb-1">
                                  {review.comment}
                                </p>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString(
                                  "nb-NO"
                                )}
                              </span>
                            </div>
                          </div>
                          {index < reviews.length - 1 && (
                            <Separator className="mt-6" />
                          )}
                        </div>
                      </BlurFade>
                    ))}
                  </CardContent>
                </Card>
              </BlurFade>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <BlurFade delay={0.1} duration={0.5} inView>
              <Card>
                <CardHeader>
                  <CardTitle>Kontakt {profile.full_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" size="lg" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send melding
                  </Button>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Info Card */}
            {stylistDetails && (
              <BlurFade delay={0.15} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle>Informasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stylistDetails.travel_distance_km && (
                      <>
                        <div>
                          <h4 className="font-medium mb-2">Reiseavstand</h4>
                          <p className="text-sm text-muted-foreground">
                            Inntil {stylistDetails.travel_distance_km} km
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Social Media */}
                    {(stylistDetails.instagram_profile ||
                      stylistDetails.facebook_profile ||
                      stylistDetails.youtube_profile ||
                      stylistDetails.tiktok_profile ||
                      stylistDetails.snapchat_profile ||
                      (stylistDetails.other_social_media_urls &&
                        stylistDetails.other_social_media_urls.length > 0)) && (
                      <>
                        <div>
                          <h4 className="font-medium mb-2">Sosiale medier</h4>
                          <div className="flex flex-wrap gap-2">
                            {stylistDetails.instagram_profile && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={stylistDetails.instagram_profile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex gap-2"
                                >
                                  <Instagram className="w-4 h-4" />
                                  <span>
                                    {getSocialMediaDisplayName(
                                      "instagram",
                                      stylistDetails.instagram_profile
                                    )}
                                  </span>
                                </Link>
                              </Button>
                            )}
                            {stylistDetails.facebook_profile && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={stylistDetails.facebook_profile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex gap-2"
                                >
                                  <Facebook className="w-4 h-4" />
                                  <span>
                                    {getSocialMediaDisplayName(
                                      "facebook",
                                      stylistDetails.facebook_profile
                                    )}
                                  </span>
                                </Link>
                              </Button>
                            )}
                            {stylistDetails.youtube_profile && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={stylistDetails.youtube_profile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex gap-2"
                                >
                                  <Youtube className="w-4 h-4" />
                                  <span>
                                    {getSocialMediaDisplayName(
                                      "youtube",
                                      stylistDetails.youtube_profile
                                    )}
                                  </span>
                                </Link>
                              </Button>
                            )}
                            {stylistDetails.tiktok_profile && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={stylistDetails.tiktok_profile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex gap-2"
                                >
                                  <FaTiktok className="w-4 h-4" />
                                  <span>
                                    {getSocialMediaDisplayName(
                                      "tiktok",
                                      stylistDetails.tiktok_profile
                                    )}
                                  </span>
                                </Link>
                              </Button>
                            )}
                            {stylistDetails.snapchat_profile && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={stylistDetails.snapchat_profile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex gap-2"
                                >
                                  <FaSnapchatGhost className="w-4 h-4" />
                                  <span>
                                    {getSocialMediaDisplayName(
                                      "snapchat",
                                      stylistDetails.snapchat_profile
                                    )}
                                  </span>
                                </Link>
                              </Button>
                            )}
                            {stylistDetails.other_social_media_urls &&
                              stylistDetails.other_social_media_urls.length >
                                0 &&
                              stylistDetails.other_social_media_urls.map(
                                (url, index) => {
                                  const platform = getPlatformFromUrl(url);
                                  return (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <Link
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex gap-2"
                                      >
                                        <LucideLink className="w-4 h-4" />
                                        <span>
                                          {getSocialMediaDisplayName(
                                            platform,
                                            url
                                          )}
                                        </span>
                                      </Link>
                                    </Button>
                                  );
                                }
                              )}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Tilgjengelighet</h4>
                      <div className="space-y-2">
                        {stylistDetails.can_travel && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm">Reiser hjem til deg</span>
                          </div>
                        )}
                        {stylistDetails.has_own_place && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm">Har eget sted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>
            )}

            {/* Stats Card */}
            <BlurFade delay={0.2} duration={0.5} inView>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalReviews}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Anmeldelser
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {stats.averageRating?.toFixed(1) || "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Vurdering
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalServices}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tjenester
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
}
