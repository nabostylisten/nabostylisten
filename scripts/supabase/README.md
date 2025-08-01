# Supabase Storage Buckets Management

This directory contains scripts and utilities for managing Supabase storage buckets for the Nabostylisten application.

## Bucket Structure

The application uses the following storage buckets:

### Public Buckets (accessible without authentication)

- **`avatars`** - User profile pictures (2MB limit, images only)
- **`landing-media`** - Static assets for landing page (10MB limit)
- **`assets`** - General application assets like logos and icons (5MB limit)
- **`service-media`** - Media files for stylist services (10MB limit)
- **`review-media`** - Media files uploaded with reviews (5MB limit)
- **`portfolio`** - Stylist portfolio and work examples (15MB limit)

### Private Buckets (require authentication)

- **`chat-media`** - Media files shared in chat messages (5MB limit)
- **`applications`** - Files uploaded with stylist applications (10MB limit)

## Usage

### Creating Buckets

To create all configured buckets:

```bash
npm run buckets:create
```

### Listing Buckets

To list all existing buckets:

```bash
npm run buckets:list
```

### Deleting a Bucket

To delete a specific bucket:

```bash
npm run buckets:delete <bucket-name>
```

## File Upload Utilities

The `lib/supabase/storage.ts` file provides utilities for:

- **Path Generation**: Structured paths for different file types
- **File Upload**: Upload files with validation
- **URL Generation**: Get public or signed URLs
- **File Management**: Delete and list files
- **Validation**: File type and size validation

### Example Usage

```typescript
import {
  uploadFile,
  storagePaths,
  generateUniqueFilename,
} from "@/lib/supabase/storage";

// Upload a user avatar
const file = event.target.files[0];
const filename = generateUniqueFilename(file.name);
const { bucket, path } = storagePaths.avatar(userId, filename);

await uploadFile({
  bucket,
  path,
  file,
});

// Get public URL for avatar
const avatarUrl = getPublicUrl(bucket, path);
```

## Environment Variables

Make sure you have the following environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## File Path Structure

The application uses the following path structure:

```
avatars/
├── {userId}/
│   └── {filename}

chat-media/
├── {chatId}/
│   └── {messageId}/
│       └── {filename}

landing-media/
└── {filename}

assets/
└── {filename}

service-media/
├── {serviceId}/
│   └── {filename}

review-media/
├── {reviewId}/
│   └── {filename}

portfolio/
├── {stylistId}/
│   └── {filename}

applications/
├── {applicationId}/
│   └── {filename}
```

## Security Considerations

1. **Public vs Private**: Only use public buckets for content that should be accessible to everyone
2. **File Validation**: Always validate file types and sizes before upload
3. **Path Sanitization**: Use the provided path generators to ensure consistent structure
4. **Access Control**: Use Row Level Security (RLS) policies for private buckets

## Troubleshooting

### Common Issues

1. **Bucket already exists**: The script will skip creation if the bucket already exists
2. **Permission denied**: Ensure you have the correct service role key
3. **File size exceeded**: Check the file size limits in the bucket configuration
4. **Invalid file type**: Verify the file type is in the allowed MIME types list

### Debugging

To debug bucket issues:

1. Check the Supabase dashboard for bucket status
2. Verify environment variables are set correctly
3. Check the console output for detailed error messages
4. Use the list command to verify bucket creation
