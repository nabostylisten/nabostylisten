"use server";

import { createClient } from "@/lib/supabase/server";
import {
  bookingNotesInsertSchema,
  bookingNotesUpdateSchema,
} from "@/schemas/database.schema";
import type { Database } from "@/types/database.types";

type BookingNoteInsert =
  Database["public"]["Tables"]["booking_notes"]["Insert"];
type BookingNoteUpdate =
  Database["public"]["Tables"]["booking_notes"]["Update"];

/**
 * Get all booking notes for a specific booking
 */
export async function getBookingNotes(bookingId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("booking_notes")
    .select(`
      *,
      stylist:profiles!booking_notes_stylist_id_fkey (
        id,
        full_name
      )
    `)
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Get a specific booking note by ID
 */
export async function getBookingNote(noteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("booking_notes")
    .select(`
      *,
      stylist:profiles!booking_notes_stylist_id_fkey (
        id,
        full_name
      )
    `)
    .eq("id", noteId)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Create a new booking note
 */
export async function createBookingNote(data: BookingNoteInsert) {
  const supabase = await createClient();

  // Validate the input data
  const validationResult = bookingNotesInsertSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      error: `Invalid data: ${
        validationResult.error.issues.map((e) => e.message).join(", ")
      }`,
      data: null,
    };
  }

  // Verify the current user is the stylist for this booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("stylist_id")
    .eq("id", data.booking_id)
    .single();

  if (bookingError) {
    return { error: "Booking not found", data: null };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== booking.stylist_id) {
    return { error: "Unauthorized", data: null };
  }

  const { data: bookingNote, error } = await supabase
    .from("booking_notes")
    .insert({
      ...validationResult.data,
      stylist_id: user.id,
    })
    .select(`
      *,
      stylist:profiles!booking_notes_stylist_id_fkey (
        id,
        full_name
      )
    `)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: bookingNote, error: null };
}

/**
 * Update a booking note
 */
export async function updateBookingNote(
  noteId: string,
  data: BookingNoteUpdate,
) {
  const supabase = await createClient();

  // Validate the input data
  const validationResult = bookingNotesUpdateSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      error: `Invalid data: ${
        validationResult.error.issues.map((e) => e.message).join(", ")
      }`,
      data: null,
    };
  }

  const { data: bookingNote, error } = await supabase
    .from("booking_notes")
    .update(validationResult.data)
    .eq("id", noteId)
    .select(`
      *,
      stylist:profiles!booking_notes_stylist_id_fkey (
        id,
        full_name
      )
    `)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: bookingNote, error: null };
}

/**
 * Delete a booking note
 */
export async function deleteBookingNote(noteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("booking_notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true, error: null };
}

/**
 * Get all images for a booking note
 */
export async function getBookingNoteImages(noteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("booking_note_id", noteId)
    .eq("media_type", "booking_note_image")
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, data: null };
  }

  // Add public URLs to the images
  const imagesWithUrls = data.map((image) => ({
    ...image,
    publicUrl: supabase.storage
      .from("booking-note-media")
      .getPublicUrl(image.file_path).data.publicUrl,
  }));

  return { data: imagesWithUrls, error: null };
}

/**
 * Delete a booking note image
 */
export async function deleteBookingNoteImage(imageId: string) {
  const supabase = await createClient();

  // First get the image to get the file path
  const { data: image, error: imageError } = await supabase
    .from("media")
    .select("file_path")
    .eq("id", imageId)
    .eq("media_type", "booking_note_image")
    .single();

  if (imageError) {
    return { error: imageError.message, success: false };
  }

  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from("booking-note-media")
    .remove([image.file_path]);

  if (storageError) {
    return { error: storageError.message, success: false };
  }

  // Delete the media record
  const { error } = await supabase
    .from("media")
    .delete()
    .eq("id", imageId);

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true, error: null };
}
