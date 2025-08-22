import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BucketConfig {
    name: string;
    public: boolean;
    allowedMimeTypes?: string[];
    fileSizeLimit?: string;
    description?: string;
}

const bucketConfigs: BucketConfig[] = [
    // User avatars - public for easy access
    {
        name: "avatars",
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: "2MB",
        description: "User profile avatars",
    },

    // Chat message media - private for security
    {
        name: "chat-media",
        public: false,
        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ],
        fileSizeLimit: "5MB",
        description: "Media files shared in chat messages",
    },

    // Landing page media - public
    {
        name: "landing-media",
        public: true,
        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        ],
        fileSizeLimit: "10MB",
        description: "Static assets for landing page",
    },

    // General assets (logos, icons) - public
    {
        name: "assets",
        public: true,
        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        ],
        fileSizeLimit: "5MB",
        description: "General application assets like logos and icons",
    },

    // Service media - public for easy viewing
    {
        name: "service-media",
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: "10MB",
        description: "Media files for stylist services",
    },

    // Review media - public for transparency
    {
        name: "review-media",
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: "5MB",
        description: "Media files uploaded with reviews",
    },

    // Application attachments - public for easy viewing
    {
        name: "applications",
        public: true,
        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
        ],
        fileSizeLimit: "10MB",
        description: "Files uploaded with stylist applications",
    },
];

async function createBuckets() {
    console.log("🚀 Starting bucket creation...");

    for (const config of bucketConfigs) {
        try {
            console.log(`\n📦 Creating bucket: ${config.name}`);

            const { error } = await supabase.storage.createBucket(config.name, {
                public: config.public,
                allowedMimeTypes: config.allowedMimeTypes,
                fileSizeLimit: config.fileSizeLimit,
            });

            if (error) {
                if (error.message.includes("already exists")) {
                    console.log(`✅ Bucket '${config.name}' already exists`);
                } else {
                    console.error(
                        `❌ Error creating bucket '${config.name}':`,
                        error.message,
                    );
                }
            } else {
                console.log(`✅ Successfully created bucket '${config.name}'`);
                console.log(`   - Public: ${config.public}`);
                console.log(
                    `   - Allowed types: ${
                        config.allowedMimeTypes?.join(", ") || "All"
                    }`,
                );
                console.log(
                    `   - Size limit: ${config.fileSizeLimit || "No limit"}`,
                );
            }
        } catch (error) {
            console.error(
                `❌ Unexpected error creating bucket '${config.name}':`,
                error,
            );
        }
    }

    console.log("\n🎉 Bucket creation process completed!");
}

async function listBuckets() {
    console.log("\n📋 Listing all buckets:");

    try {
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error("❌ Error listing buckets:", error.message);
            return;
        }

        if (data && data.length > 0) {
            data.forEach((bucket) => {
                console.log(`   - ${bucket.name} (public: ${bucket.public})`);
            });
        } else {
            console.log("   No buckets found");
        }
    } catch (error) {
        console.error("❌ Unexpected error listing buckets:", error);
    }
}

async function deleteBucket(bucketName: string) {
    console.log(`🗑️  Deleting bucket: ${bucketName}`);

    try {
        const { error } = await supabase.storage.deleteBucket(bucketName);

        if (error) {
            console.error(
                `❌ Error deleting bucket '${bucketName}':`,
                error.message,
            );
        } else {
            console.log(`✅ Successfully deleted bucket '${bucketName}'`);
        }
    } catch (error) {
        console.error(
            `❌ Unexpected error deleting bucket '${bucketName}':`,
            error,
        );
    }
}

// Main execution
async function main() {
    const command = process.argv[2];

    switch (command) {
        case "create":
            await createBuckets();
            break;
        case "list":
            await listBuckets();
            break;
        case "delete":
            const bucketName = process.argv[3];
            if (!bucketName) {
                console.error("❌ Please provide a bucket name to delete");
                process.exit(1);
            }
            await deleteBucket(bucketName);
            break;
        default:
            console.log("\nAvailable commands:");
            console.log("  create - Create all configured buckets");
            console.log("  list   - List existing buckets");
            console.log("  delete <bucket-name> - Delete a specific bucket");
    }
}

// Run the script
main().catch(console.error);
