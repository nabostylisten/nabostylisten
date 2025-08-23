import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PUBLIC_DIR = join(process.cwd(), "app", "public");
const BUCKET_NAME = "assets";

async function uploadAssetFiles() {
    console.log("🚀 Starting asset upload...");
    
    try {
        const files = readdirSync(PUBLIC_DIR);
        const assetFiles = files.filter(file => {
            const ext = extname(file).toLowerCase();
            return ext === ".svg" || ext === ".png";
        });
        
        if (assetFiles.length === 0) {
            console.log("📂 No asset files found in public directory");
            return;
        }
        
        console.log(`📄 Found ${assetFiles.length} asset file(s) to upload`);
        
        for (const filename of assetFiles) {
            try {
                const filePath = join(PUBLIC_DIR, filename);
                const fileBuffer = readFileSync(filePath);
                const stats = statSync(filePath);
                const ext = extname(filename).toLowerCase();
                
                console.log(`\n⬆️  Uploading: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
                
                const contentType = ext === ".svg" ? "image/svg+xml" : "image/png";
                
                const { data, error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filename, fileBuffer, {
                        contentType,
                        upsert: true,
                    });
                
                if (error) {
                    console.error(`❌ Error uploading ${filename}:`, error.message);
                } else {
                    console.log(`✅ Successfully uploaded: ${filename}`);
                    console.log(`   - Path: ${data.path}`);
                    
                    const { data: urlData } = supabase.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(filename);
                    
                    console.log(`   - Public URL: ${urlData.publicUrl}`);
                }
            } catch (error) {
                console.error(`❌ Unexpected error uploading ${filename}:`, error);
            }
        }
        
        console.log("\n🎉 Asset upload process completed!");
        
    } catch (error) {
        console.error("❌ Error reading public directory:", error);
    }
}

async function listAssets() {
    console.log("\n📋 Listing assets in bucket:");
    
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list();
        
        if (error) {
            console.error("❌ Error listing assets:", error.message);
            return;
        }
        
        if (data && data.length > 0) {
            data.forEach((file) => {
                console.log(`   - ${file.name} (${(file.metadata?.size / 1024).toFixed(2) || "0"} KB)`);
            });
        } else {
            console.log("   No assets found in bucket");
        }
    } catch (error) {
        console.error("❌ Unexpected error listing assets:", error);
    }
}

async function deleteAsset(filename: string) {
    console.log(`🗑️  Deleting asset: ${filename}`);
    
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filename]);
        
        if (error) {
            console.error(`❌ Error deleting asset '${filename}':`, error.message);
        } else {
            console.log(`✅ Successfully deleted asset '${filename}'`);
        }
    } catch (error) {
        console.error(`❌ Unexpected error deleting asset '${filename}':`, error);
    }
}

async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case "upload":
            await uploadAssetFiles();
            break;
        case "list":
            await listAssets();
            break;
        case "delete":
            const filename = process.argv[3];
            if (!filename) {
                console.error("❌ Please provide a filename to delete");
                process.exit(1);
            }
            await deleteAsset(filename);
            break;
        default:
            console.log("\nAvailable commands:");
            console.log("  upload - Upload all SVG files from app/public to assets bucket");
            console.log("  list   - List existing assets in bucket");
            console.log("  delete <filename> - Delete a specific asset from bucket");
    }
}

main().catch(console.error);