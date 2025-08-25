#!/bin/bash

# Ensure Docker is running first
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please ensure Docker is running and try again."
  exit 1
fi

# Check if Nabostylisten database container is running
echo "Checking if Nabostylisten database container is running..."

# Look for containers with "nabostylisten" in the name and status "Up"
CONTAINER_STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -i nabostylisten | grep -i "up")

if [ -z "$CONTAINER_STATUS" ]; then
  echo "Nabostylisten database container is not running."
  echo "Please start your local Supabase instance with: bun supabase:start"
  exit 1
else
  echo "Nabostylisten database container is running:"
  echo "$CONTAINER_STATUS"
  echo ""
fi