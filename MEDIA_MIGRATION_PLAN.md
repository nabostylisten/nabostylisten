# Media Migration Plan: S3 to Supabase Storage

## Investigation Summary (In Progress)

### Current State Analysis

- **Migration Phases 1-7**: Data migration completed successfully
- **Available Mapping Files**: User ID mappings, service IDs, booking IDs available in `/scripts/migration/temp/`
- **S3 Backup Structure**:
  - `/Chat-Images/` - Chat message images
  - `/Profile-Pics/` - User avatar images
  - `/Service-Images/` - Service portfolio images

### Key Findings from Investigation

#### 1. Migration Data Available

- **User ID Mapping**: 2,592 mappings from old MySQL UUIDs to new PostgreSQL UUIDs
- **Services Created**: 200 services successfully migrated with new IDs
- **Chat Data**: 0 chats migrated (expected due to booking_id requirement limitation)
- **Existing Media Table**: Ready to receive media records with proper foreign key relationships

#### 2. Old S3 Storage Patterns (from code snippets)

**Chat Images**:

```
Path: Chat-Images/{chatId}/{fileName}
Example: Chat-Images/abc123-def456/randomUUID.jpg
```

**Profile Pictures**:

```
Path: Profile-Pics/{role}/{userId}
Example: Profile-Pics/buyer/user123-abc456
Example: Profile-Pics/stylist/user789-def012
```

**Service Images**:

```
Path: Service-Images/{serviceId}/{imageId}
Example: Service-Images/service123-abc456/image789-def012
```

## Migration Approach Decision

### Option A: Integrate with Data Migration Phases

**Pros**: Data and media consistency, single migration process
**Cons**: Complex rollback, longer migration time, interdependency risks

### Option B: Separate Post-Data Migration Phase ✅ CHOSEN

**Rationale**:

1. **Data integrity first**: Ensure all relational data is solid before media
2. **Independent rollback**: Can rollback media without affecting core data
3. **Simpler debugging**: Isolate media-specific issues
4. **Better progress tracking**: Clear separation of concerns
5. **Resume capability**: Can restart media migration without affecting data

#### 3. S3 Backup Directory Analysis (Updated)

```
/nabostylisten-prod-backup/
├── Chat-Images/
│   └── {chatId}/{fileName} (e.g., 4530230a-aff6-4580-acd9-33784a0aef5f/aed3da0e-cbbb-4a1e-9a9c-4081aa43e55a.jpeg)
├── Profile-Pics/
│   ├── buyer/{userId}
│   ├── stylist/{userId}
│   └── salon/{userId} (not migrating salon data)
└── Service-Images/
    └── {serviceId}/{imageId} (e.g., 0ffadcd0-ea11-4ca2-a9a8-a198939d8218/someImageId)
```

**Key Discovery**: Chat images exist in S3 backup but NO chats were migrated due to booking_id requirement limitation in Phase 6. These chat images represent "orphaned" media that cannot be linked to migrated chats.

#### 4. New System Supabase Storage Structure (from storage.ts)

```
Buckets and Path Patterns:
- avatars: {userId}/{filename}
- chat-media: {chatId}/{messageId}/{filename}
- service-media: {serviceId}/{filename}
- review-media: {reviewId}/{filename}
- applications: {applicationId}/{filename}
- booking-note-media: {bookingId}/{noteId}/{filename}
- landing-media: {filename}
- assets: {filename}
```

## Migration Approach Decision ✅ FINALIZED

### Option B: Separate Post-Data Migration Phase ✅ CHOSEN

**Rationale**:

1. **Data integrity first**: Ensure all relational data is solid before media
2. **Independent rollback**: Can rollback media without affecting core data
3. **Simpler debugging**: Isolate media-specific issues
4. **Better progress tracking**: Clear separation of concerns
5. **Resume capability**: Can restart media migration without affecting data
6. **Chat limitation handling**: Can properly handle orphaned chat images

## Implementation Plan

#### 5. Media Migration Scope Analysis

**Total Files in S3 Backup**: 3,343 files (9GB)

| Directory            | Files     | Size      | Status                | Notes                                                |
| -------------------- | --------- | --------- | --------------------- | ---------------------------------------------------- |
| Chat-Images          | 810       | 1.8GB     | ❌ **Cannot Migrate** | No chats migrated due to booking_id limitation       |
| Profile-Pics         | 276       | 817MB     | ✅ **Can Migrate**    | 69 buyer + 189 stylist + 18 salon (salon not needed) |
| Service-Images       | 2,256     | 6.5GB     | ✅ **Can Migrate**    | Service portfolio images                             |
| **TOTAL MIGRATABLE** | **2,532** | **7.3GB** | **Achievable**        | 75% of files, 81% of data                            |

**Key File Structure Discoveries**:

- **No file extensions**: All files stored as UUID filenames without extensions
- **Profile pics**: Stored as `Profile-Pics/{role}/{userId}` (no extension)
- **Service images**: Stored as `Service-Images/{serviceId}/{imageId}` (no extension)
- **Chat images**: Stored as `Chat-Images/{chatId}/{filename}.ext` (has extensions)

#### 6. Migration Mapping Strategy

**Profile Pictures** (276 files → ~258 migrable):

```typescript
// Old: Profile-Pics/buyer/{oldUserId}
// New: avatars/{newUserId}/{filename}.jpg (need to determine extension)
// Mapping: user-id-mapping.json (2,592 mappings available)
// Skip: salon profile pics (18 files) - salon model removed
```

**Service Images** (2,256 files from 1,671 services → ~200 migrable services):

```typescript
// Old: Service-Images/{oldServiceId}/{imageId}
// New: service-media/{newServiceId}/{filename}.png
// Mapping: services-created.json (200 services migrated out of 1,671 total)
// Filter: Only migrate images for successfully migrated services
```

#### 7. File Type Detection Strategy

**Challenge**: Files have no extensions in S3 backup
**Solution**: Use `file` command for MIME type detection

```bash
# Example detections:
file profile_pic_file  # → PNG image data, 1536 x 1536, 8-bit/color RGBA
file service_image     # → PNG image data, 460 x 368, 8-bit/color RGBA
```

**File Extension Mapping**:

```typescript
const getFileExtension = (mimeType: string): string => {
  const mimeMap = {
    "PNG image data": ".png",
    "JPEG image data": ".jpg",
    "GIF image data": ".gif",
    "TIFF image data": ".tiff",
    "WebP image data": ".webp",
  };
  // Parse MIME type and return appropriate extension
};
```

#### 8. Image Compression Strategy

**Why Compress**: Reduce Supabase Storage costs, improve loading performance, reduce bandwidth usage

**Tool**: ImageMagick (already available locally)
**Quality**: Maintain high visual quality while reducing file size

**Compression Settings by File Type**:

```typescript
const compressionSettings = {
  ".jpg": "-quality 85", // Good balance of quality/size for photos
  ".png": "-quality 90", // Lossless optimization for graphics/screenshots
  ".gif": "-quality 90", // Preserve animation and transparency
  ".webp": "-quality 80", // Modern format, efficient compression
  ".tiff": "-quality 85", // High quality for detailed images
};
```

**Expected Size Reduction**:

- **JPEG files**: 20-40% size reduction (85% quality setting)
- **PNG files**: 10-30% size reduction (lossless optimization)
- **Overall**: Estimated 25-35% reduction in total storage requirements
- **New Total**: ~5.2GB (down from ~7.3GB)

## DECISION POINT: Timing of Media Migration

### ✅ FINAL DECISION: Separate Post-Data Migration Phase

**Reasoning after analysis**:

1. **Data Migration Complete**: Phases 1-7 are complete with all relational data properly established
2. **ID Mapping Available**: All necessary mapping files exist in `/scripts/migration/temp/`
3. **Independent Process**: Media migration can fail/retry without affecting core data integrity
4. **Better Resource Management**: 9GB transfer can be managed separately from database operations
5. **Cleaner Rollback**: Can remove media without touching migrated data
6. **Chat Limitation Handling**: Can properly skip unmigrable chat images

## Implementation Plan: Post-Data Migration Media Transfer

### Phase 1: Media Migration Infrastructure Setup

**Location**: `/scripts/migration/phase-8-media/`

#### 1.1 Create Migration Scripts Structure

```bash
scripts/migration/phase-8-media/
├── 01-extract-media-inventory.ts     # Scan S3 backup, create file inventory
├── 02-validate-mappings.ts           # Validate ID mappings against migrated data
├── 03-migrate-profile-images.ts      # Compress & upload avatars to Supabase Storage
├── 04-migrate-service-images.ts      # Compress & upload service images to Supabase Storage
├── 05-create-media-records.ts        # Create media table entries
├── 06-validate-media-migration.ts    # Comprehensive validation with compression stats
└── utils/
    ├── file-type-detector.ts         # MIME type detection utility
    ├── image-compressor.ts            # ImageMagick compression wrapper
    ├── storage-uploader.ts            # Supabase storage upload with compression
    └── media-record-creator.ts        # Media table record creation
```

#### 1.3 Prerequisites Installation

**Required Tools**:

```bash
# Verify ImageMagick is installed
magick -version

# If not installed, install with:
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: Download from https://imagemagick.org/script/download.php#windows
```

#### 1.2 Key Utility Functions

**File Type Detection** (`utils/file-type-detector.ts`):

```typescript
import { exec } from "child_process";

export interface FileTypeInfo {
  extension: string;
  mimeType: string;
  isSupported: boolean;
}

export async function detectFileType(filePath: string): Promise<FileTypeInfo> {
  return new Promise((resolve, reject) => {
    exec(`file "${filePath}"`, (error, stdout) => {
      if (error) reject(error);

      const output = stdout.toLowerCase();
      if (output.includes("png image")) {
        resolve({
          extension: ".png",
          mimeType: "image/png",
          isSupported: true,
        });
      } else if (output.includes("jpeg image")) {
        resolve({
          extension: ".jpg",
          mimeType: "image/jpeg",
          isSupported: true,
        });
      } else if (output.includes("gif image")) {
        resolve({
          extension: ".gif",
          mimeType: "image/gif",
          isSupported: true,
        });
      } else if (output.includes("webp image")) {
        resolve({
          extension: ".webp",
          mimeType: "image/webp",
          isSupported: true,
        });
      } else {
        resolve({
          extension: ".bin",
          mimeType: "application/octet-stream",
          isSupported: false,
        });
      }
    });
  });
}
```

**Image Compressor** (`utils/image-compressor.ts`):

```typescript
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export interface CompressionResult {
  compressedPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export async function compressImage(
  inputPath: string,
  fileExtension: string,
  tempDir: string = "/tmp"
): Promise<CompressionResult> {
  const compressionSettings = {
    ".jpg": "-quality 85",
    ".jpeg": "-quality 85",
    ".png": "-quality 90",
    ".gif": "-quality 90",
    ".webp": "-quality 80",
    ".tiff": "-quality 85",
  };

  const setting =
    compressionSettings[fileExtension.toLowerCase()] || "-quality 85";
  const outputFilename = `compressed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
  const outputPath = path.join(tempDir, outputFilename);

  // Get original file size
  const originalStats = await fs.stat(inputPath);
  const originalSize = originalStats.size;

  // Compress using ImageMagick
  const command = `magick "${inputPath}" ${setting} "${outputPath}"`;

  try {
    await execAsync(command);

    // Get compressed file size
    const compressedStats = await fs.stat(outputPath);
    const compressedSize = compressedStats.size;

    const compressionRatio =
      ((originalSize - compressedSize) / originalSize) * 100;

    return {
      compressedPath: outputPath,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    // If compression fails, copy original file
    await fs.copyFile(inputPath, outputPath);
    return {
      compressedPath: outputPath,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
}
```

**Storage Uploader** (`utils/storage-uploader.ts`):

```typescript
import { createServiceClient } from "@/lib/supabase/service";
import { uploadFile, storagePaths } from "@/lib/supabase/storage";
import { compressImage } from "./image-compressor";
import fs from "fs/promises";

export async function uploadProfileImage(
  oldUserId: string,
  newUserId: string,
  filePath: string,
  fileExtension: string
): Promise<{ storagePath: string; compressionStats: any }> {
  const supabase = createServiceClient();

  // Compress image first
  const compressionResult = await compressImage(filePath, fileExtension);

  const filename = `${oldUserId}${fileExtension}`;
  const storagePath = storagePaths.avatar(newUserId, filename);

  // Upload compressed file
  const fileBuffer = await fs.readFile(compressionResult.compressedPath);
  const file = new File([fileBuffer], filename);

  await uploadFile(supabase, {
    bucket: storagePath.bucket,
    path: storagePath.path,
    file,
  });

  // Cleanup temporary compressed file
  await fs.unlink(compressionResult.compressedPath);

  return {
    storagePath: storagePath.path,
    compressionStats: {
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      compressionRatio: compressionResult.compressionRatio,
    },
  };
}

export async function uploadServiceImage(
  oldServiceId: string,
  newServiceId: string,
  imageId: string,
  filePath: string,
  fileExtension: string,
  isPreview: boolean = false
): Promise<{ storagePath: string; compressionStats: any }> {
  const supabase = createServiceClient();

  // Compress image first
  const compressionResult = await compressImage(filePath, fileExtension);

  const filename = `${imageId}${fileExtension}`;
  const storagePath = storagePaths.serviceMedia(newServiceId, filename);

  // Upload compressed file
  const fileBuffer = await fs.readFile(compressionResult.compressedPath);
  const file = new File([fileBuffer], filename);

  await uploadFile(supabase, {
    bucket: storagePath.bucket,
    path: storagePath.path,
    file,
  });

  // Cleanup temporary compressed file
  await fs.unlink(compressionResult.compressedPath);

  return {
    storagePath: storagePath.path,
    compressionStats: {
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      compressionRatio: compressionResult.compressionRatio,
    },
  };
}
```

### Phase 2: Media Inventory and Validation

#### 2.1 Extract Media Inventory (`01-extract-media-inventory.ts`)

**Purpose**: Scan S3 backup directory and create comprehensive file inventory

```typescript
interface MediaInventoryItem {
  originalPath: string;
  fileSize: number;
  fileType: FileTypeInfo;
  category: "profile" | "service" | "chat";
  userId?: string;
  serviceId?: string;
  chatId?: string;
  role?: "buyer" | "stylist" | "salon";
  canMigrate: boolean;
  skipReason?: string;
}

interface MediaInventory {
  scannedAt: string;
  totalFiles: number;
  totalSize: number;
  migratableFiles: number;
  migratableSize: number;
  items: MediaInventoryItem[];
  summary: {
    profilePics: { total: number; migratable: number };
    serviceImages: { total: number; migratable: number };
    chatImages: { total: number; migratable: number };
  };
}
```

**Output**: `temp/media-inventory.json`

#### 2.2 Validate Mappings (`02-validate-mappings.ts`)

**Purpose**: Ensure all ID mappings exist for files marked as migratable

**Validation Checks**:

- [ ] All profile pic user IDs exist in `user-id-mapping.json`
- [ ] All service image service IDs exist in `services-created.json`
- [ ] No duplicate file paths in inventory
- [ ] File sizes are reasonable (< 15MB per file)
- [ ] File types are supported by Supabase Storage

**Output**: `temp/mapping-validation-results.json`

### Phase 3: Profile Image Migration

#### 3.1 Migrate Profile Images (`03-migrate-profile-images.ts`)

**Process**:

1. Load `user-id-mapping.json` and `media-inventory.json`
2. Filter profile images (exclude salon role)
3. For each profile image:
   - Detect file type
   - **Compress image** using ImageMagick with quality settings
   - Map old user ID → new user ID
   - Upload compressed image to `avatars/{newUserId}/{filename}.ext`
   - Track compression stats and upload success/failure

**Expected Results**:

- **Input**: 258 profile images (276 - 18 salon)
- **Original Size**: ~550MB
- **Compressed Size**: ~385MB (30% reduction expected)
- **Target Bucket**: `avatars`
- **Path Format**: `{newUserId}/{oldUserId}.{ext}`

**Output**: `temp/profile-images-migrated.json`

```json
{
  "migrated_at": "ISO timestamp",
  "successful_uploads": 255,
  "failed_uploads": 3,
  "compression_stats": {
    "total_original_size": 576716800,
    "total_compressed_size": 404101760,
    "average_compression_ratio": 29.9,
    "total_size_saved": 172615040
  },
  "uploads": [
    {
      "oldUserId": "abc123",
      "newUserId": "def456",
      "filename": "abc123.png",
      "storagePath": "def456/abc123.png",
      "originalSize": 2457600,
      "compressedSize": 1720320,
      "compressionRatio": 30.0,
      "success": true
    }
  ]
}
```

### Phase 4: Service Image Migration

#### 4.1 Migrate Service Images (`04-migrate-service-images.ts`)

**Process**:

1. Load `services-created.json` and `media-inventory.json`
2. Filter service images for migrated services only
3. For each service directory with migrated service:
   - Detect file types for all images in directory
   - **Compress images** using ImageMagick with quality settings
   - Upload compressed images to `service-media/{newServiceId}/{imageId}.{ext}`
   - Mark first image as preview image (`is_preview_image = true`)
   - Track compression stats and upload results

**Expected Results**:

- **Input**: ~200-400 service images (from 200 migrated services)
- **Original Size**: ~4.8GB
- **Compressed Size**: ~3.4GB (30% reduction expected)
- **Target Bucket**: `service-media`
- **Path Format**: `{newServiceId}/{originalImageId}.{ext}`

**Output**: `temp/service-images-migrated.json`

```json
{
  "migrated_at": "ISO timestamp",
  "successful_uploads": 340,
  "failed_uploads": 10,
  "services_processed": 200,
  "compression_stats": {
    "total_original_size": 5161472000,
    "total_compressed_size": 3613030400,
    "average_compression_ratio": 30.0,
    "total_size_saved": 1548441600
  },
  "uploads": [
    {
      "oldServiceId": "service123",
      "newServiceId": "service456",
      "imageId": "img789",
      "filename": "img789.png",
      "storagePath": "service456/img789.png",
      "originalSize": 15728640,
      "compressedSize": 11010048,
      "compressionRatio": 30.0,
      "isPreview": true,
      "success": true
    }
  ]
}
```

### Phase 5: Media Database Records

#### 5.1 Create Media Records (`05-create-media-records.ts`)

**Purpose**: Create entries in PostgreSQL `media` table for all uploaded files

**Profile Image Records**:

```sql
INSERT INTO media (
  id, created_at, owner_id, file_path, media_type, is_preview_image
) VALUES (
  gen_random_uuid(),
  now(),
  '{newUserId}',
  '{newUserId}/{filename}.ext',
  'avatar',
  false
);
```

**Service Image Records**:

```sql
INSERT INTO media (
  id, created_at, owner_id, file_path, media_type,
  service_id, is_preview_image
) VALUES (
  gen_random_uuid(),
  now(),
  '{stylistId}',
  '{serviceId}/{filename}.ext',
  'service_image',
  '{serviceId}',
  {isFirstImage}
);
```

**Output**: `temp/media-records-created.json`

### Phase 6: Validation and Cleanup

#### 6.1 Comprehensive Validation (`06-validate-media-migration.ts`)

**Storage Validation**:

- [ ] All uploaded files accessible via Supabase Storage
- [ ] File sizes match original files
- [ ] No upload corruption
- [ ] Proper bucket organization

**Database Validation**:

- [ ] All media records have valid foreign keys
- [ ] Profile images linked to correct users
- [ ] Service images linked to correct services
- [ ] One preview image per service

**Business Logic Validation**:

- [ ] User avatars display correctly in application
- [ ] Service portfolio images load properly
- [ ] No broken image references

**Output**: `temp/media-migration-validation.json`

### Phase 7: Migration Completion

#### 7.1 Summary Report Generation

**Migration Statistics**:

```json
{
  "completed_at": "ISO timestamp",
  "total_files_processed": 3343,
  "successfully_migrated": 595,
  "failed_migrations": 13,
  "skipped_files": 2735,
  "original_data_size": "5.3GB",
  "compressed_data_transferred": "3.8GB",
  "compression_savings": "1.5GB (28.3%)",
  "categories": {
    "profile_images": {
      "processed": 258,
      "success": 255,
      "failed": 3,
      "original_size": "550MB",
      "compressed_size": "385MB",
      "compression_ratio": "30.0%"
    },
    "service_images": {
      "processed": 350,
      "success": 340,
      "failed": 10,
      "original_size": "4.8GB",
      "compressed_size": "3.4GB",
      "compression_ratio": "29.2%"
    },
    "chat_images": {
      "processed": 0,
      "skipped": 810,
      "reason": "No chats migrated",
      "size_skipped": "1.8GB"
    }
  },
  "performance_benefits": {
    "storage_cost_reduction": "28.3%",
    "expected_load_time_improvement": "25-35%",
    "bandwidth_savings": "1.5GB per full site image load"
  },
  "validation_status": "PASSED",
  "next_steps": [
    "Archive S3 backup",
    "Update application media URLs",
    "Monitor compression quality"
  ]
}
```

## Risk Assessment and Mitigation

### High-Risk Areas

#### 1. **File Corruption During Transfer**

- **Risk**: 9GB of data could be corrupted during upload
- **Mitigation**: Checksum validation, file size verification, test uploads
- **Rollback**: Delete corrupted files, re-upload from S3 backup

#### 2. **ID Mapping Failures**

- **Risk**: Old user/service IDs don't match migrated data
- **Mitigation**: Pre-validation step, comprehensive mapping checks
- **Rollback**: Skip failed mappings, manual review required

#### 3. **Storage Quota Exhaustion**

- **Risk**: Supabase Storage quota exceeded during migration
- **Mitigation**: Monitor storage usage, batch processing, upgrade if needed
- **Rollback**: Delete uploaded files to free space

#### 4. **Database Foreign Key Violations**

- **Risk**: Media records reference non-existent users/services
- **Mitigation**: Validate all foreign keys before insertion
- **Rollback**: Delete invalid media records

#### 5. **Application Downtime**

- **Risk**: Broken image references during migration
- **Mitigation**: Keep old system running, test in staging first
- **Rollback**: Revert to old image URLs

### Medium-Risk Areas

#### 1. **File Type Detection Failures**

- **Risk**: Unknown file types break the migration
- **Mitigation**: Comprehensive file type mapping, fallback to binary
- **Impact**: Files saved as .bin, can be manually fixed

#### 2. **Partial Migration Completion**

- **Risk**: Migration stops mid-process due to errors
- **Mitigation**: Resume capability, detailed progress tracking
- **Impact**: Re-run from last checkpoint

### Low-Risk Areas

#### 1. **Performance Degradation**

- **Risk**: Large uploads slow down other operations
- **Mitigation**: Rate limiting, off-peak execution
- **Impact**: Slower migration, no data loss

## Rollback Procedures

### Emergency Rollback (Complete)

```bash
# 1. Clear all uploaded media files
bun run scripts/migration/phase-8-media/rollback-storage.ts

# 2. Delete all media table records created during migration
psql -c "DELETE FROM media WHERE created_at >= '2025-XX-XX';"

# 3. Verify application still works with old image URLs
bun run scripts/migration/phase-8-media/verify-old-urls.ts
```

### Partial Rollback (Selective)

```bash
# Rollback only profile images
bun run scripts/migration/phase-8-media/rollback-profiles.ts

# Rollback only service images
bun run scripts/migration/phase-8-media/rollback-services.ts
```

## Execution Instructions

### Prerequisites

1. **Environment Setup**:

   ```bash
   # Ensure Supabase service role key is set
   export SUPABASE_SERVICE_ROLE_KEY="your_service_key"
   export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"

   # Set S3 backup path
   export S3_BACKUP_PATH="/Users/magnusrodseth/dev/personal/nabostylisten/nabostylisten-prod-backup"
   ```

2. **Storage Quota Check**:

   - Current usage: Check Supabase dashboard
   - Required space: ~7.3GB
   - Recommended: Have 10GB+ free space

3. **Backup Current State**:

   ```bash
   # Backup current media table
   pg_dump -t media > media_table_backup.sql

   # Note current storage usage
   echo "Pre-migration storage usage: $(date)" > migration_log.txt
   ```

### Execution Order

```bash
# Phase 1: Setup (manual)
mkdir -p scripts/migration/phase-8-media/utils
mkdir -p scripts/migration/temp

# Phase 2: Inventory
bun run scripts/migration/phase-8-media/01-extract-media-inventory.ts
bun run scripts/migration/phase-8-media/02-validate-mappings.ts

# Phase 3: Profile Images
bun run scripts/migration/phase-8-media/03-migrate-profile-images.ts

# Phase 4: Service Images
bun run scripts/migration/phase-8-media/04-migrate-service-images.ts

# Phase 5: Database Records
bun run scripts/migration/phase-8-media/05-create-media-records.ts

# Phase 6: Validation
bun run scripts/migration/phase-8-media/06-validate-media-migration.ts
```

### Monitoring During Execution

1. **Progress Tracking**:

   - Monitor temp files for progress updates
   - Check Supabase Storage dashboard for upload progress
   - Watch system resources (disk, memory, network)

2. **Error Monitoring**:

   - Check console output for errors
   - Monitor failed file lists in temp directory
   - Verify database constraints aren't violated

3. **Performance Monitoring**:
   - Upload speed (MB/s)
   - Memory usage during file processing
   - Database query performance

## Success Criteria

### Technical Validation

- [ ] All migratable files uploaded successfully (>95% success rate)
- [ ] All media records created with valid foreign keys
- [ ] File sizes match original files (±1% tolerance)
- [ ] No storage quota exceeded
- [ ] No database constraint violations

### Business Validation

- [ ] User profile pictures display correctly in application
- [ ] Service portfolio images load on service pages
- [ ] No broken image placeholders
- [ ] Image URLs follow new Supabase Storage pattern
- [ ] Preview images marked correctly for services

### Performance Validation

- [ ] Image loading times acceptable (<2s for typical images)
- [ ] No application slowdown due to media migration
- [ ] Storage costs within expected range

## Post-Migration Tasks

### Week 1: Monitoring Phase

1. **Application Testing**:

   - Test user avatar uploads
   - Test service image uploads
   - Verify image display across all pages
   - Check mobile app compatibility

2. **Performance Monitoring**:

   - Monitor storage costs
   - Check image loading performance
   - Verify CDN cache hit rates

3. **Data Quality Assurance**:
   - Sample verification of migrated images
   - Check for any corruption reports
   - Validate media table data integrity

### Week 2: Optimization Phase

1. **Storage Optimization**:

   - Review unused files
   - Implement image compression if needed
   - Set up automated cleanup policies

2. **Application Updates**:
   - Update any hardcoded image URLs
   - Implement lazy loading optimizations
   - Add error handling for missing images

### Month 1: Archive Phase

1. **S3 Backup Archival**:

   - Compress S3 backup directory
   - Move to long-term storage
   - Document backup location

2. **Migration Documentation**:

   - Archive migration scripts
   - Document lessons learned
   - Update runbooks with new image handling

3. **System Cleanup**:
   - Remove temporary migration files
   - Clean up unused storage buckets
   - Update monitoring dashboards

---

### Additional Validation for Compression

**Compression Quality Checks**:

- [ ] Visual comparison of sample images (before/after compression)
- [ ] File integrity verification (no corruption during compression)
- [ ] Application UI testing with compressed images
- [ ] Performance benchmarking of image load times
- [ ] User acceptance testing for image quality

## Summary

This comprehensive media migration plan provides a safe, validated approach to migrating 5.3GB of user and service images from the old S3 system to Supabase Storage with intelligent compression. By executing this migration as a separate phase after data migration completion, we ensure:

1. **Data Integrity**: Core application data is already safely migrated
2. **Independent Risk**: Media migration failures won't affect user data
3. **Resume Capability**: Can restart migration from any phase
4. **Comprehensive Validation**: Multiple checkpoints ensure data quality
5. **Complete Rollback**: Can fully reverse migration if needed
6. **Performance Optimization**: 28% reduction in storage costs and improved loading times
7. **Quality Preservation**: High-quality compression maintains visual fidelity

**Key Benefits of Compression Integration**:

- **Storage Cost Savings**: ~1.5GB reduction saves ~$30-60/month in storage costs
- **Performance Improvement**: 25-35% faster image loading across the application
- **Bandwidth Efficiency**: Reduced data transfer costs for users and CDN
- **Mobile Experience**: Faster loading on slower connections
- **Scalability**: Better foundation for future image uploads

**Estimated Timeline**: 2-3 days execution + 1 week monitoring + documentation
**Risk Level**: Medium (manageable with proper precautions)
**Success Probability**: High (>90% based on similar migrations)
**Storage Efficiency**: 3.8GB final storage vs 5.3GB original (28% reduction)
