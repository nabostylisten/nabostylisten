"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Upload } from "lucide-react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/kibo-ui/dropzone";
import { BookingNoteImageUpload } from "./booking-note-image-upload";
import { BookingNoteImageCarousel } from "./booking-note-image-carousel";
import {
  createBookingNote,
  updateBookingNote,
} from "@/server/booking-note.actions";
import { useUploadBookingNoteImages } from "@/hooks/use-upload-booking-note-images";
import type { Database } from "@/types/database.types";
import { ScrollArea } from "../ui/scroll-area";

type BookingNote = Database["public"]["Tables"]["booking_notes"]["Row"] & {
  stylist: {
    id: string;
    full_name: string | null;
  } | null;
};

const formSchema = z.object({
  content: z.string().min(1, "Innhold er påkrevd"),
  category: z.enum([
    "service_notes",
    "customer_preferences",
    "issues",
    "results",
    "follow_up",
    "other",
  ]),
  customer_visible: z.boolean(),
  duration_minutes: z.number().optional(),
  next_appointment_suggestion: z.string(),
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

type BookingNoteUpdate =
  Database["public"]["Tables"]["booking_notes"]["Update"];

const CATEGORY_OPTIONS = [
  { value: "service_notes", label: "Tjenestenotater" },
  { value: "customer_preferences", label: "Kundepreferanser" },
  { value: "issues", label: "Problemer/bekymringer" },
  { value: "results", label: "Resultater" },
  { value: "follow_up", label: "Oppfølging nødvendig" },
  { value: "other", label: "Annet" },
] as const;

const COMMON_TAGS = [
  "Første gang",
  "Fargekorreksjon",
  "Sensitiv hodebunn",
  "Allergier",
  "Tid overskudd",
  "Utmerkede resultater",
  "Trenger oppfølging",
  "Anbefal produkter",
];

// Helper functions for duration conversion
const minutesToHoursAndMinutes = (totalMinutes: number | undefined) => {
  if (!totalMinutes) return { hours: 0, minutes: 0 };
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
};

const hoursAndMinutesToMinutes = (hours: number, minutes: number) => {
  return hours * 60 + minutes;
};

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "" : "";
};

// Helper function to truncate filename
const truncateFilename = (filename: string, maxLength: number = 25): string => {
  if (filename.length <= maxLength) return filename;

  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
  const maxNameLength = maxLength - extension.length - 1; // -1 for the dot

  if (nameWithoutExt.length <= maxNameLength) {
    return filename;
  }

  return `${nameWithoutExt.substring(0, maxNameLength - 3)}...${extension ? "." + extension.toLowerCase() : ""}`;
};

// Duration Input Component
interface DurationInputProps {
  value?: number;
  onChange: (minutes?: number) => void;
}

function DurationInput({ value, onChange }: DurationInputProps) {
  const [durationUnit, setDurationUnit] = useState<"hours" | "minutes">(
    "hours"
  );
  const [hoursValue, setHoursValue] = useState<string>("");
  const [minutesValue, setMinutesValue] = useState<string>("");

  // Initialize values from prop
  useEffect(() => {
    if (value) {
      const { hours, minutes } = minutesToHoursAndMinutes(value);
      if (hours > 0 && minutes > 0) {
        setDurationUnit("hours");
        setHoursValue(hours.toString());
        setMinutesValue(minutes.toString());
      } else if (hours > 0) {
        setDurationUnit("hours");
        setHoursValue(hours.toString());
        setMinutesValue("");
      } else if (minutes > 0) {
        setDurationUnit("minutes");
        setHoursValue("");
        setMinutesValue(minutes.toString());
      }
    } else {
      setHoursValue("");
      setMinutesValue("");
    }
  }, [value]);

  const updateDuration = (hours: number, minutes: number) => {
    const totalMinutes = hoursAndMinutesToMinutes(hours, minutes);
    onChange(totalMinutes > 0 ? totalMinutes : undefined);
  };

  const handleHoursChange = (value: string) => {
    setHoursValue(value);
    const hours = parseInt(value) || 0;
    const minutes = parseInt(minutesValue) || 0;
    updateDuration(hours, minutes);
  };

  const handleMinutesChange = (value: string) => {
    setMinutesValue(value);
    if (durationUnit === "hours") {
      const hours = parseInt(hoursValue) || 0;
      const minutes = parseInt(value) || 0;
      updateDuration(hours, minutes);
    } else {
      const minutes = parseInt(value) || 0;
      updateDuration(0, minutes);
    }
  };

  const handleUnitChange = (unit: "hours" | "minutes") => {
    setDurationUnit(unit);
    if (unit === "minutes") {
      // Convert current duration to minutes only
      const currentTotal = hoursAndMinutesToMinutes(
        parseInt(hoursValue) || 0,
        parseInt(minutesValue) || 0
      );
      setHoursValue("");
      setMinutesValue(currentTotal > 0 ? currentTotal.toString() : "");
      onChange(currentTotal > 0 ? currentTotal : undefined);
    } else {
      // Convert minutes to hours if needed
      const totalMinutes = parseInt(minutesValue) || 0;
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        setHoursValue(hours.toString());
        setMinutesValue(
          remainingMinutes > 0 ? remainingMinutes.toString() : ""
        );
      } else {
        setHoursValue("");
      }
    }
  };

  return (
    <FormItem>
      <div className="flex items-center justify-between">
        <FormLabel>Varighet av tjeneste</FormLabel>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[120px] justify-between">
                {durationUnit === "hours" ? "Timer" : "Minutter"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleUnitChange("hours")}>
                Timer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUnitChange("minutes")}>
                Minutter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          {durationUnit === "hours" && (
            <>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Timer"
                  value={hoursValue}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  min="0"
                />
                <span className="text-sm text-muted-foreground">timer</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Minutter"
                  value={minutesValue}
                  onChange={(e) => handleMinutesChange(e.target.value)}
                  min="0"
                  max="59"
                />
                <span className="text-sm text-muted-foreground">minutter</span>
              </div>
            </>
          )}

          {durationUnit === "minutes" && (
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Minutter"
                value={minutesValue}
                onChange={(e) => handleMinutesChange(e.target.value)}
                min="0"
              />
            </div>
          )}
        </div>
      </div>
      <FormDescription>Hvor lang tid tok tjenesten?</FormDescription>
    </FormItem>
  );
}

interface BookingNoteFormProps {
  bookingId: string;
  stylistId: string;
  editingNote?: BookingNote;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookingNoteForm({
  bookingId,
  stylistId,
  editingNote,
  onSuccess,
  onCancel,
}: BookingNoteFormProps) {
  const [newTag, setNewTag] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const isEditing = !!editingNote;
  const uploadMutation = useUploadBookingNoteImages();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: editingNote?.content || "",
      category: editingNote?.category || "service_notes",
      customer_visible: editingNote?.customer_visible || false,
      duration_minutes: editingNote?.duration_minutes || undefined,
      next_appointment_suggestion:
        editingNote?.next_appointment_suggestion || "",
      tags: editingNote?.tags || [],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingNote) {
      form.reset({
        content: editingNote.content,
        category: editingNote.category,
        customer_visible: editingNote.customer_visible,
        duration_minutes: editingNote.duration_minutes || undefined,
        next_appointment_suggestion:
          editingNote.next_appointment_suggestion || "",
        tags: editingNote.tags || [],
      });
    }
  }, [editingNote, form]);

  const createMutation = useMutation({
    mutationFn: createBookingNote,
    onSuccess: async (result) => {
      const noteId = result.data?.id;
      // Upload images if any were selected
      if (selectedFiles.length > 0 && noteId) {
        try {
          await uploadMutation.mutateAsync({
            files: selectedFiles,
            bookingId: bookingId,
            noteId: noteId,
          });
          toast.success("Bookingnotat opprettet med bilder!");
        } catch (error) {
          toast.error("Notat opprettet, men feil ved opplasting av bilder");
        }
      } else {
        toast.success("Bookingnotat opprettet!");
      }

      queryClient.invalidateQueries({ queryKey: ["booking-notes", bookingId] });
      form.reset();
      setSelectedFiles([]);
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Feil ved opprettelse: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      noteId,
      data,
    }: {
      noteId: string;
      data: BookingNoteUpdate;
    }) => updateBookingNote(noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-notes", bookingId] });
      toast.success("Bookingnotat oppdatert!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Feil ved oppdatering: " + error.message);
    },
  });

  const onSubmit = (values: FormValues) => {
    const formattedData = {
      booking_id: bookingId,
      content: values.content,
      category: values.category,
      customer_visible: values.customer_visible,
      duration_minutes: values.duration_minutes || null,
      next_appointment_suggestion:
        values.next_appointment_suggestion &&
        values.next_appointment_suggestion.trim()
          ? values.next_appointment_suggestion
          : null,
      tags: values.tags.length > 0 ? values.tags : [],
    };

    if (isEditing && editingNote) {
      updateMutation.mutate({
        noteId: editingNote.id,
        data: formattedData,
      });
    } else {
      createMutation.mutate({
        ...formattedData,
        stylist_id: stylistId,
      });
    }
  };

  const addTag = (tag: string) => {
    const currentTags = form.getValues("tags");
    if (!currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const addNewTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      addTag(newTag.trim());
      setNewTag("");
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    const processedFiles: File[] = [];

    try {
      for (const file of files) {
        // Validate file type immediately
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          toast.error(
            `Filtype ${file.type} er ikke tillatt. Tillatte typer: JPG, PNG, WebP`
          );
          continue;
        }

        // Validate file size
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast.error(
            `Filen "${file.name}" er for stor. Maksimal størrelse er 10MB`
          );
          continue;
        }

        toast.success(`Behandler bilde: ${file.name}`);

        try {
          // Compress the image
          const { default: imageCompression } = await import(
            "browser-image-compression"
          );
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 10,
            maxWidthOrHeight: 2048,
            useWebWorker: true,
            fileType: file.type,
          });

          const compressionRatio = (
            ((file.size - compressedFile.size) / file.size) *
            100
          ).toFixed(1);
          if (compressedFile.size < file.size) {
            toast.success(
              `Bilde komprimert: ${file.name} (${compressionRatio}% mindre)`
            );
          } else {
            toast.success(`Bilde klar: ${file.name}`);
          }

          processedFiles.push(compressedFile);
        } catch (compressionError) {
          console.error("Compression failed:", compressionError);
          toast.warning(`Kunne ikke komprimere ${file.name}, bruker original`);
          processedFiles.push(file);
        }
      }

      if (processedFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...processedFiles]);
        toast.success(`${processedFiles.length} bilde(r) klar for opplasting`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Feil ved behandling av filer";
      toast.error("En feil oppstod ved behandling av filer", {
        description: message,
      });
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ScrollArea className="h-[700px] flex-1">
      <div className="py-2 space-y-6 pr-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notater *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Skriv dine notater her..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Visibility */}
            <FormField
              control={form.control}
              name="customer_visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Synlig for kunde
                    </FormLabel>
                    <FormDescription>
                      La kunden se dette notatet
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

            <Separator />

            {/* Duration */}
            <DurationInput
              value={form.watch("duration_minutes")}
              onChange={(minutes) => form.setValue("duration_minutes", minutes)}
            />

            <Separator />

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Merkelapper</h3>
              <p className="text-xs text-muted-foreground">
                Merkelapper er enkle ord som hjelper deg å organisere notatene
                dine.
              </p>

              {/* Current Tags */}
              <div className="flex flex-wrap gap-2">
                {form.watch("tags").map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="h-7 px-2 text-xs"
                  >
                    {tag} ×
                  </Button>
                ))}
              </div>

              {/* Common Tags */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Vanlige merkelapper:
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map((tag) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => addTag(tag)}
                      className="h-7 px-2 text-xs"
                      disabled={form.watch("tags").includes(tag)}
                    >
                      + {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Add Custom Tag */}
              <div className="flex gap-2">
                <Input
                  placeholder="Legg til ny merkelapp"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addNewTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addNewTag}
                  disabled={!newTag.trim()}
                >
                  Legg til
                </Button>
              </div>
            </div>

            <Separator />

            {/* Next Appointment */}
            <FormField
              control={form.control}
              name="next_appointment_suggestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forslag til neste avtale</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anbefalinger for neste booking..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Forslag til oppfølging eller neste tjeneste
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Images Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Bilder</h3>

              {isEditing && editingNote ? (
                // Edit mode - show existing images and upload
                <>
                  <BookingNoteImageCarousel noteId={editingNote.id} />
                  <BookingNoteImageUpload
                    bookingId={bookingId}
                    noteId={editingNote.id}
                  />
                </>
              ) : (
                // Create mode - show file selection
                <>
                  <Dropzone
                    accept={{ "image/*": [] }}
                    maxFiles={5}
                    maxSize={1024 * 1024 * 10} // 10MB
                    minSize={1024} // 1KB
                    onDrop={handleFilesSelected}
                    onError={(error) => {
                      toast.error(`Feil ved opplasting: ${error.message}`);
                    }}
                    src={selectedFiles}
                    disabled={isPending}
                  >
                    <DropzoneEmptyState>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Upload className="h-4 w-4" />
                        </div>
                        <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                          Dra og slipp bilder her, eller klikk for å velge
                        </p>
                        <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                          PNG, JPG, WEBP opptil 10MB
                        </p>
                      </div>
                    </DropzoneEmptyState>
                    <DropzoneContent />
                  </Dropzone>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">
                        Valgte filer ({selectedFiles.length})
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                        {selectedFiles.map((file, index) => {
                          const truncatedName = truncateFilename(file.name, 20);

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded border p-2 gap-2 min-w-0"
                            >
                              <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                                <div className="h-4 w-4 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                                  <div className="h-2 w-2 bg-muted-foreground rounded" />
                                </div>
                                <span
                                  className="text-sm truncate flex-1 min-w-0"
                                  title={file.name}
                                >
                                  {truncatedName}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                                  {(file.size / 1024 / 1024).toFixed(1)}MB
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  removeSelectedFile(index);
                                  toast.success("Bilde fjernet");
                                }}
                                disabled={isPending}
                                className="flex-shrink-0 h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Oppdaterer..."
                    : "Oppretter..."
                  : isEditing
                    ? "Oppdater notat"
                    : "Opprett notat"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
