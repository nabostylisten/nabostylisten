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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BookingNoteImageUpload } from "./booking-note-image-upload";
import { BookingNoteImageCarousel } from "./booking-note-image-carousel";
import {
  createBookingNote,
  updateBookingNote,
} from "@/server/booking-note.actions";
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
  actual_start_time: z.string(),
  actual_end_time: z.string(),
  next_appointment_suggestion: z.string(),
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

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

// Helper function to parse datetime-local string to date and time
const parseDateTime = (datetimeString: string) => {
  if (!datetimeString) return { date: undefined, time: "" };

  const date = new Date(datetimeString);
  const formattedTime = date.toTimeString().slice(0, 8); // HH:MM:SS format

  return {
    date: date,
    time: formattedTime,
  };
};

// Helper function to combine date and time into datetime-local string
const combineDateTime = (date: Date | undefined, time: string) => {
  if (!date || !time) return "";

  const [hours, minutes, seconds = "00"] = time.split(":");
  const combined = new Date(date);
  combined.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));

  return combined.toISOString().slice(0, 16); // Format for datetime-local input
};

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
  const queryClient = useQueryClient();
  const isEditing = !!editingNote;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      category: "service_notes" as const,
      customer_visible: false,
      actual_start_time: "",
      actual_end_time: "",
      next_appointment_suggestion: "",
      tags: [],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingNote) {
      form.reset({
        content: editingNote.content,
        category: editingNote.category as FormValues["category"],
        customer_visible: editingNote.customer_visible,
        actual_start_time: editingNote.actual_start_time
          ? new Date(editingNote.actual_start_time).toISOString().slice(0, 16)
          : "",
        actual_end_time: editingNote.actual_end_time
          ? new Date(editingNote.actual_end_time).toISOString().slice(0, 16)
          : "",
        next_appointment_suggestion:
          editingNote.next_appointment_suggestion || "",
        tags: editingNote.tags || [],
      });
    }
  }, [editingNote, form]);

  const createMutation = useMutation({
    mutationFn: createBookingNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-notes", bookingId] });
      toast.success("Bookingnotat opprettet!");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Feil ved opprettelse: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: any }) =>
      updateBookingNote(noteId, data),
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
      actual_start_time:
        values.actual_start_time && values.actual_start_time.trim()
          ? new Date(values.actual_start_time).toISOString()
          : null,
      actual_end_time:
        values.actual_end_time && values.actual_end_time.trim()
          ? new Date(values.actual_end_time).toISOString()
          : null,
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Timing */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Tidspunkter</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="actual_start_time"
                  render={({ field }) => {
                    const { date: startDate, time: startTime } = parseDateTime(
                      field.value
                    );

                    return (
                      <FormItem>
                        <FormLabel>Faktisk starttid</FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start font-normal",
                                      !startDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate
                                      ? format(startDate, "dd.MM.yyyy")
                                      : "Velg dato"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={startDate}
                                  onSelect={(date) => {
                                    const combined = combineDateTime(
                                      date,
                                      startTime
                                    );
                                    field.onChange(combined);
                                  }}
                                  autoFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex-1">
                            <div className="relative">
                              <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => {
                                  const combined = combineDateTime(
                                    startDate,
                                    e.target.value
                                  );
                                  field.onChange(combined);
                                }}
                                className="pl-8"
                                step="60"
                              />
                            </div>
                          </div>
                        </div>
                        <FormDescription>
                          Hvis forskjellig fra booket tid
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="actual_end_time"
                  render={({ field }) => {
                    const { date: endDate, time: endTime } = parseDateTime(
                      field.value
                    );

                    return (
                      <FormItem>
                        <FormLabel>Faktisk sluttid</FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start font-normal",
                                      !endDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate
                                      ? format(endDate, "dd.MM.yyyy")
                                      : "Velg dato"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={endDate}
                                  onSelect={(date) => {
                                    const combined = combineDateTime(
                                      date,
                                      endTime
                                    );
                                    field.onChange(combined);
                                  }}
                                  autoFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex-1">
                            <div className="relative">
                              <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => {
                                  const combined = combineDateTime(
                                    endDate,
                                    e.target.value
                                  );
                                  field.onChange(combined);
                                }}
                                className="pl-8"
                                step="60"
                              />
                            </div>
                          </div>
                        </div>
                        <FormDescription>
                          Hvis forskjellig fra booket tid
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>

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
            {isEditing && editingNote && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bilder</h3>
                <BookingNoteImageCarousel noteId={editingNote.id} />
                <BookingNoteImageUpload
                  bookingId={bookingId}
                  noteId={editingNote.id}
                />
              </div>
            )}

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
