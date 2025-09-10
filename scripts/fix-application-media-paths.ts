#!/usr/bin/env bun
/**
 * Script to fix media table records for application images
 * that are missing the bucket prefix in their file_path
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixApplicationMediaPaths() {
    console.log("Starting to fix application media paths...");

    try {
        // Get all media records for application images
        const { data: mediaRecords, error: fetchError } = await supabase
            .from("media")
            .select("*")
            .eq("media_type", "application_image");

        if (fetchError) {
            console.error("Error fetching media records:", fetchError);
            return;
        }

        if (!mediaRecords || mediaRecords.length === 0) {
            console.log("No application media records found");
            return;
        }

        console.log(`Found ${mediaRecords.length} application media records`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const record of mediaRecords) {
            // Check if the file_path already includes the bucket prefix
            if (record.file_path && !record.file_path.startsWith("applications/")) {
                // Fix the path by adding the bucket prefix
                const fixedPath = `applications/${record.file_path}`;
                
                console.log(`Fixing media record ${record.id}:`);
                console.log(`  Old path: ${record.file_path}`);
                console.log(`  New path: ${fixedPath}`);

                const { error: updateError } = await supabase
                    .from("media")
                    .update({ file_path: fixedPath })
                    .eq("id", record.id);

                if (updateError) {
                    console.error(`  Error updating record ${record.id}:`, updateError);
                    errorCount++;
                } else {
                    console.log(`  ✓ Successfully updated`);
                    fixedCount++;
                }
            }
        }

        console.log("\n=== Summary ===");
        console.log(`Total records processed: ${mediaRecords.length}`);
        console.log(`Records fixed: ${fixedCount}`);
        console.log(`Records with errors: ${errorCount}`);
        console.log(`Records already correct: ${mediaRecords.length - fixedCount - errorCount}`);

    } catch (error) {
        console.error("Unexpected error:", error);
    }
}

// Run the fix
fixApplicationMediaPaths()
    .then(() => {
        console.log("\nScript completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });