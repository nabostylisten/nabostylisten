if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please ensure Docker is running and try again."
  exit 1
else
  echo "Docker is running. Continuing..."
fi
