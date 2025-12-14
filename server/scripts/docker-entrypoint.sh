#!/bin/sh
set -e

echo "Starting the application..."
pnpm start & 

# Wait for app to start
echo "Waiting for application to be ready..."
count=0
while [ $count -lt 30 ]; do
    if curl -f http://localhost:3000/api/health; then
        echo "Application is ready!"
        break
    fi
    echo "Application not ready. Retrying in 2 seconds..."
    sleep 2
    count=$((count + 1))
done

if [ $count -eq 30 ]; then
    echo "Application failed to start after 60 seconds."
    exit 1
fi

# Keep container running and check health periodically
while true; do
    if ! curl -f http://localhost:3000/api/health; then
        echo "Health check failed!"
        exit 1
    fi
    sleep 30
done
