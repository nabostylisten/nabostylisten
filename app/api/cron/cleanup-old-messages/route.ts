import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  // Verify authentication
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Unauthorized cron job attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createServiceClient();
    
    // Calculate cutoff date (5 years ago)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    console.log(`Starting cleanup of chat messages older than ${fiveYearsAgo.toISOString()}`);
    
    // First, get all old messages and their associated media files for storage cleanup
    const { data: oldMessages, error: fetchError } = await supabase
      .from("chat_messages")
      .select(`
        id, 
        chat_id, 
        created_at,
        media!chat_message_id(id, file_path)
      `)
      .lt("created_at", fiveYearsAgo.toISOString());
    
    if (fetchError) {
      throw new Error(`Failed to fetch old messages: ${fetchError.message}`);
    }
    
    const messageCount = oldMessages?.length || 0;
    console.log(`Found ${messageCount} messages to delete`);
    
    if (messageCount > 0) {
      // Collect all media files that need to be removed from storage
      const mediaFilesToDelete: string[] = [];
      let mediaRecordCount = 0;
      
      for (const message of oldMessages!) {
        if (message.media && Array.isArray(message.media)) {
          for (const media of message.media) {
            mediaRecordCount++;
            try {
              // Extract path from file_path (remove bucket URL prefix if present)
              const path = media.file_path.replace(/^.*\/chat-media\//, "");
              mediaFilesToDelete.push(path);
            } catch (error) {
              console.error(`Error processing media file path ${media.file_path}: ${error}`);
            }
          }
        }
      }
      
      // Delete storage files before deleting database records
      if (mediaFilesToDelete.length > 0) {
        console.log(`Removing ${mediaFilesToDelete.length} files from storage`);
        
        const { data: removedFiles, error: storageError } = await supabase.storage
          .from("chat-media")
          .remove(mediaFilesToDelete);
        
        if (storageError) {
          console.error(`Failed to delete some storage files: ${storageError.message}`);
        } else {
          console.log(`Successfully removed ${removedFiles?.length || 0} files from storage`);
        }
      }
      
      // Delete the chat messages (media records will be cascade deleted automatically)
      const { count: deletedCount, error: deleteError } = await supabase
        .from("chat_messages")
        .delete()
        .lt("created_at", fiveYearsAgo.toISOString());
      
      if (deleteError) {
        throw new Error(`Failed to delete messages: ${deleteError.message}`);
      }
      
      console.log(`Database cascade will delete ${mediaRecordCount} media records automatically`);
      
      const duration = Date.now() - startTime;
      
      // Log success for monitoring
      console.log(`Successfully deleted ${deletedCount} chat messages in ${duration}ms`);
      
      // Check if any chats are now empty and can be deleted
      const { data: emptyChatIds } = await supabase
        .from("chats")
        .select("id")
        .not("id", "in", `(SELECT DISTINCT chat_id FROM chat_messages)`);
      
      if (emptyChatIds && emptyChatIds.length > 0) {
        const { count: deletedChatsCount } = await supabase
          .from("chats")
          .delete()
          .in("id", emptyChatIds.map(c => c.id));
        
        console.log(`Cleaned up ${deletedChatsCount} empty chats`);
      }
      
      return Response.json({
        success: true,
        timestamp: new Date().toISOString(),
        cutoffDate: fiveYearsAgo.toISOString(),
        deletedMessages: deletedCount,
        deletedMediaFiles: mediaFilesToDelete.length,
        deletedMediaRecords: mediaRecordCount,
        deletedEmptyChats: emptyChatIds?.length || 0,
        duration: `${duration}ms`,
      });
    } else {
      const duration = Date.now() - startTime;
      
      return Response.json({
        success: true,
        timestamp: new Date().toISOString(),
        cutoffDate: fiveYearsAgo.toISOString(),
        message: "No messages found older than 5 years",
        duration: `${duration}ms`,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error("Cron job failed:", error);
    
    return Response.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}