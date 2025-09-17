#!/bin/bash

# S3 bucket name
BUCKET_NAME="nabostylisten-prod"

# Local directory where you want to download the bucket contents
# Change this to your preferred location
LOCAL_DIR="./nabostylisten-prod-backup"

# Create the local directory if it doesn't exist
mkdir -p "$LOCAL_DIR"

echo "Starting download of S3 bucket: $BUCKET_NAME"
echo "Downloading to: $LOCAL_DIR"
echo "----------------------------------------"

# Use AWS CLI to sync the entire bucket to local directory
# The sync command will:
# - Download all files from the bucket
# - Preserve the directory structure
# - Only download files that don't exist locally or are different
aws s3 sync "s3://$BUCKET_NAME" "$LOCAL_DIR" \
    --no-progress \
    --storage-class STANDARD

# If you want to see progress for each file, remove --no-progress
# and add --progress instead:
# aws s3 sync "s3://$BUCKET_NAME" "$LOCAL_DIR" --progress

# Alternative: Use cp command with recursive flag (downloads everything)
# aws s3 cp "s3://$BUCKET_NAME" "$LOCAL_DIR" --recursive

echo "----------------------------------------"
echo "Download completed!"
echo "Files are saved in: $LOCAL_DIR"

# Optional: Display summary of downloaded content
echo ""
echo "Summary of downloaded content:"
echo "----------------------------------------"
find "$LOCAL_DIR" -type d -maxdepth 1 | while read dir; do
    if [ "$dir" != "$LOCAL_DIR" ]; then
        count=$(find "$dir" -type f | wc -l)
        dirname=$(basename "$dir")
        echo "$dirname/: $count files"
    fi
done

# Count total files
total_files=$(find "$LOCAL_DIR" -type f | wc -l)
echo "----------------------------------------"
echo "Total files downloaded: $total_files"