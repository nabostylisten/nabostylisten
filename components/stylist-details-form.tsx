"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  Save,
  X,
  MapPin,
  Car,
  Home,
  Instagram,
  Facebook,
  Youtube,
  Link as LucideLink,
} from "lucide-react";
import { FaTiktok, FaSnapchatGhost } from "react-icons/fa";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  updateStylistDetails,
  createStylistDetails,
} from "@/server/profile.actions";
import type { Database } from "@/types/database.types";

// Form schema for stylist details
const stylistDetailsFormSchema = z.object({
  bio: z.string().optional().nullable(),
  can_travel: z.boolean(),
  has_own_place: z.boolean(),
  travel_distance_km: z.coerce
    .number()
    .min(0, "Avstand må være minst 0")
    .max(100, "Avstand kan ikke være mer enn 100 km")
    .nullable()
    .optional(),
  instagram_profile: z.string().optional().nullable(),
  facebook_profile: z.string().optional().nullable(),
  tiktok_profile: z.string().optional().nullable(),
  youtube_profile: z.string().optional().nullable(),
  snapchat_profile: z.string().optional().nullable(),
  other_social_media_urls: z.array(z.string()).optional().nullable(),
});

type StylistDetailsFormValues = z.infer<typeof stylistDetailsFormSchema>;

interface StylistDetailsFormProps {
  profileId: string;
  stylistDetails?:
    | Database["public"]["Tables"]["stylist_details"]["Row"]
    | null;
  isOwner: boolean;
}

export function StylistDetailsForm({
  profileId,
  stylistDetails,
  isOwner,
}: StylistDetailsFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<StylistDetailsFormValues>({
    resolver: zodResolver(stylistDetailsFormSchema) as any,
    defaultValues: {
      bio: stylistDetails?.bio || "",
      can_travel: stylistDetails?.can_travel ?? true,
      has_own_place: stylistDetails?.has_own_place ?? true,
      travel_distance_km: stylistDetails?.travel_distance_km ?? null,
      instagram_profile: stylistDetails?.instagram_profile || "",
      facebook_profile: stylistDetails?.facebook_profile || "",
      tiktok_profile: stylistDetails?.tiktok_profile || "",
      youtube_profile: stylistDetails?.youtube_profile || "",
      snapchat_profile: stylistDetails?.snapchat_profile || "",
      other_social_media_urls: stylistDetails?.other_social_media_urls || [],
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async (data: StylistDetailsFormValues) => {
      if (stylistDetails) {
        return updateStylistDetails(profileId, data);
      } else {
        return createStylistDetails(profileId, {
          profile_id: profileId,
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["stylist-details"] });
      router.refresh(); // Force server component to re-fetch data
      toast.success(
        stylistDetails
          ? "Stylist detaljer oppdatert!"
          : "Stylist detaljer opprettet!"
      );
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Feil ved oppdatering: " + error.message);
    },
  });

  const handleEdit = () => {
    if (isOwner) {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
    setNewSocialUrl("");
  };

  const onSubmit = (values: StylistDetailsFormValues) => {
    if (isOwner) {
      // Clean up empty social media fields
      const cleanedValues = {
        ...values,
        instagram_profile: values.instagram_profile?.trim() || null,
        facebook_profile: values.facebook_profile?.trim() || null,
        tiktok_profile: values.tiktok_profile?.trim() || null,
        youtube_profile: values.youtube_profile?.trim() || null,
        snapchat_profile: values.snapchat_profile?.trim() || null,
        travel_distance_km: values.can_travel
          ? values.travel_distance_km
          : null,
      };
      updateDetailsMutation.mutate(cleanedValues);
    }
  };

  const addOtherSocialUrl = () => {
    if (newSocialUrl && newSocialUrl.startsWith("http")) {
      const currentUrls = form.getValues("other_social_media_urls") || [];
      form.setValue("other_social_media_urls", [...currentUrls, newSocialUrl]);
      setNewSocialUrl("");
    }
  };

  const removeOtherSocialUrl = (index: number) => {
    const currentUrls = form.getValues("other_social_media_urls") || [];
    form.setValue(
      "other_social_media_urls",
      currentUrls.filter((_, i) => i !== index)
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Informasjon om deg som stylist
          </CardTitle>
          {isOwner && !isEditing ? (
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Endre
            </Button>
          ) : isOwner && isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                size="sm"
                disabled={updateDetailsMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Lagre
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Avbryt
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isOwner && isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Om meg</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Fortell litt om deg selv, din erfaring og hva du spesialiserer deg på..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Dette vises på din offentlige profil
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Service Location Options */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Tjenestelokasjon</h3>

                <FormField
                  control={form.control}
                  name="has_own_place"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Har eget sted
                        </FormLabel>
                        <FormDescription>
                          Kundene kan komme til deg
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="can_travel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Kan reise til kunder
                        </FormLabel>
                        <FormDescription>
                          Du kan reise hjem til kunder
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("can_travel") && (
                  <FormField
                    control={form.control}
                    name="travel_distance_km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Maks reiseavstand (km)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="F.eks. 20"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Sosiale medier</h3>

                <FormField
                  control={form.control}
                  name="instagram_profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="brukernavn (uten @)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook_profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="brukernavn eller side"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tiktok_profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FaTiktok className="w-4 h-4" />
                        TikTok
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="brukernavn (uten @)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtube_profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Youtube className="w-4 h-4" />
                        YouTube
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="kanal navn eller ID"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="snapchat_profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FaSnapchatGhost className="w-4 h-4" />
                        Snapchat
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="brukernavn"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Other social media URLs */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <LucideLink className="w-4 h-4" />
                    Andre lenker
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://..."
                      value={newSocialUrl}
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={addOtherSocialUrl}
                      variant="outline"
                      size="sm"
                    >
                      Legg til
                    </Button>
                  </div>
                  {form.watch("other_social_media_urls")?.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{url}</span>
                      <Button
                        type="button"
                        onClick={() => removeOtherSocialUrl(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </Form>
        ) : (
          <>
            {/* Display Mode */}
            <div className="space-y-2">
              <Label>Om meg</Label>
              <p className="text-sm text-muted-foreground">
                {stylistDetails?.bio || "Ingen beskrivelse lagt til ennå"}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Tjenestelokasjon</Label>
              <div className="space-y-2">
                {stylistDetails?.has_own_place && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Har eget sted
                  </p>
                )}
                {stylistDetails?.can_travel && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Kan reise til kunder
                    {stylistDetails.travel_distance_km &&
                      ` (inntil ${stylistDetails.travel_distance_km} km)`}
                  </p>
                )}
                {!stylistDetails?.has_own_place &&
                  !stylistDetails?.can_travel && (
                    <p className="text-sm text-muted-foreground">
                      Ingen tjenestelokasjon satt
                    </p>
                  )}
              </div>
            </div>

            {(stylistDetails?.instagram_profile ||
              stylistDetails?.facebook_profile ||
              stylistDetails?.tiktok_profile ||
              stylistDetails?.youtube_profile ||
              stylistDetails?.snapchat_profile ||
              (stylistDetails?.other_social_media_urls &&
                stylistDetails.other_social_media_urls.length > 0)) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Sosiale medier</Label>
                  <div className="flex flex-wrap gap-2">
                    {stylistDetails.instagram_profile && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://instagram.com/${stylistDetails.instagram_profile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2"
                        >
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </a>
                      </Button>
                    )}
                    {stylistDetails.facebook_profile && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://facebook.com/${stylistDetails.facebook_profile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2"
                        >
                          <Facebook className="w-4 h-4" />
                          Facebook
                        </a>
                      </Button>
                    )}
                    {stylistDetails.tiktok_profile && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://tiktok.com/@${stylistDetails.tiktok_profile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2"
                        >
                          <FaTiktok className="w-4 h-4" />
                          TikTok
                        </a>
                      </Button>
                    )}
                    {stylistDetails.youtube_profile && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://youtube.com/${stylistDetails.youtube_profile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2"
                        >
                          <Youtube className="w-4 h-4" />
                          YouTube
                        </a>
                      </Button>
                    )}
                    {stylistDetails.snapchat_profile && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://snapchat.com/add/${stylistDetails.snapchat_profile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2"
                        >
                          <FaSnapchatGhost className="w-4 h-4" />
                          Snapchat
                        </a>
                      </Button>
                    )}
                    {stylistDetails.other_social_media_urls?.map(
                      (url, index) => (
                        <Button key={index} variant="outline" size="sm" asChild>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-2"
                          >
                            <LucideLink className="w-4 h-4" />
                            Annet
                          </a>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
