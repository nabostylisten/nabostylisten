"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import {
  Edit,
  Save,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

import { updateProfile } from "@/server/profile.actions";
import { sendAccountDeletionConfirmationEmail } from "@/server/auth.actions";
import type { Database } from "@/types/database.types";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { ProfileAddresses } from "@/components/addresses";
import { StylistDetailsForm } from "@/components/stylist-details-form";

// Form schema for profile updates
const profileFormSchema = z.object({
  full_name: z.string().min(2, "Navn må være minst 2 karakterer"),
  phone_number: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  stylistDetails?:
    | Database["public"]["Tables"]["stylist_details"]["Row"]
    | null;
  isOwner: boolean;
}

export function ProfileForm({
  profile,
  stylistDetails,
  isOwner,
}: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      phone_number: profile.phone_number || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProfileFormValues }) =>
      updateProfile(id, data),
    onSuccess: () => {
      // Invalidate all profile-related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil oppdatert!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Feil ved oppdatering av profil: " + error.message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      sendAccountDeletionConfirmationEmail({ userId }),
    onSuccess: () => {
      toast.success(
        "Bekreftelseslenke sendt til din e-post! Sjekk innboksen din."
      );
      setIsDeleteDialogOpen(false);
      setDeleteConfirmationText("");
    },
    onError: (error) => {
      toast.error("Feil ved sending av bekreftelseslenke: " + error.message);
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
  };

  const onSubmit = (values: ProfileFormValues) => {
    if (isOwner) {
      updateProfileMutation.mutate({
        id: profile.id,
        data: values,
      });
    }
  };

  const deleteMyUserText = "slett min bruker";

  const handleDeleteAccount = () => {
    if (deleteConfirmationText !== deleteMyUserText) {
      toast.error(`Du må skrive '${deleteMyUserText}' for å bekrefte sletting`);
      return;
    }

    deleteAccountMutation.mutate({ userId: profile.id });
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setDeleteConfirmationText("");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <CurrentUserAvatar
            className="w-16 h-16"
            isEditing={isOwner && isEditing}
          />
          <div>
            <h1 className="text-3xl font-bold">Min profil</h1>
            <p className="text-muted-foreground mt-1">
              {isOwner
                ? "Administrer din personlige informasjon"
                : "Profilinformasjon"}
            </p>
          </div>
        </div>
        {isOwner && !isEditing ? (
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Endre profil
          </Button>
        ) : isOwner && isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              size="sm"
              disabled={updateProfileMutation.isPending}
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

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personlig informasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isOwner && isEditing ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Name */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Navn
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ditt navn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-post
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {profile.email || "Ikke satt"}
                  </p>
                </div>

                <Separator />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefonnummer
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ditt telefonnummer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : (
            <>
              {/* Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Navn
                </Label>
                <p className="text-sm text-muted-foreground">
                  {profile.full_name || "Ikke satt"}
                </p>
              </div>

              <Separator />

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-post
                </Label>
                <p className="text-sm text-muted-foreground">
                  {profile.email || "Ikke satt"}
                </p>
              </div>

              <Separator />

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefonnummer
                </Label>
                <p className="text-sm text-muted-foreground">
                  {profile.phone_number || "Ikke satt"}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Role */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rolle
            </Label>
            <Badge
              variant={profile.role === "admin" ? "destructive" : "secondary"}
            >
              {profile.role === "customer" && "Kunde"}
              {profile.role === "stylist" && "Stylist"}
              {profile.role === "admin" && "Administrator"}
            </Badge>
          </div>

          <Separator />

          {/* Created Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Medlem siden
            </Label>
            <p className="text-sm text-muted-foreground">
              {new Date(profile.created_at).toLocaleDateString("nb-NO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <Separator />

          {/* BankID Verification */}
          <div className="space-y-2">
            <Label>BankID verifisering</Label>
            <p className="text-sm text-muted-foreground">
              {profile.bankid_verified ? "Verifisert" : "Ikke verifisert"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Address Management Section - only for profile owners */}
      {isOwner && (
        <div className="mt-6">
          <ProfileAddresses />
        </div>
      )}

      {/* Stylist Details Section - only for stylists */}
      {isOwner && profile.role === "stylist" && (
        <div className="mt-6">
          <StylistDetailsForm
            profileId={profile.id}
            stylistDetails={stylistDetails}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Danger Zone - only for profile owners and not during editing */}
      {isOwner && !isEditing && (
        <Card className="mt-6 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Slett konto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Dette vil permanent slette kontoen din, alle dine data,
                bestillinger, og samtaler. Denne handlingen kan ikke angres.
              </p>

              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={handleDeleteDialogClose}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-fit">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett konto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Bekreft sletting av konto
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left">
                      <p className="mb-3 text-sm">
                        Vi vil sende en <strong>bekreftelseslenke til din e-post</strong> som du må klikke på for å fullføre slettingen. 
                        Dette er en ekstra sikkerhet for å sikre at det virkelig er deg som ønsker å slette kontoen.
                      </p>
                      
                      <strong>Dette vil permanent slette:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Din personlige profil og kontoinformasjon</li>
                        <li>Alle dine bestillinger og historikk</li>
                        <li>Samtaler med stylister</li>
                        <li>Anmeldelser og vurderinger du har gitt</li>
                        <li>Lagrede betalingsmetoder og adresser</li>
                      </ul>
                      
                      <p className="mt-3 font-medium text-destructive">
                        Denne handlingen kan ikke angres etter at du har bekreftet via e-post.
                      </p>
                      
                      <p className="mt-3 text-sm">
                        Skriv <strong>"{deleteMyUserText}"</strong> for å sende bekreftelseslenke:
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Input
                      value={deleteConfirmationText}
                      onChange={(e) =>
                        setDeleteConfirmationText(e.target.value)
                      }
                      placeholder="slett min bruker"
                      className="border-destructive/50 focus:border-destructive"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteAccount}
                      disabled={
                        deleteConfirmationText !== deleteMyUserText ||
                        deleteAccountMutation.isPending
                      }
                    >
                      {deleteAccountMutation.isPending
                        ? "Sender bekreftelseslenke..."
                        : "Send bekreftelseslenke"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
