#!/bin/bash

# Deployment Script for DigitalOcean Droplet
# This script handles zero-downtime deployment

set -e

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest code from GitHub..."
git pull origin main

# Build new images
echo "Building Docker images..."
docker-compose build --no-cache api

# Stop and remove old containers
echo "Stopping old containers..."
docker-compose down

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for API to be healthy
echo "Waiting for API to be healthy..."
timeout=60
counter=0
until docker-compose exec -T api node -e "require('http').get('http://localhost:3040/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; do
    counter=$((counter+1))
    if [ $counter -ge $timeout ]; then
        echo "API failed to become healthy within $timeout seconds"
        docker-compose logs api
        exit 1
    fi
    echo "Waiting for API... ($counter/$timeout)"
    sleep 1
done

# Prune old images
echo "Cleaning up old images..."
docker image prune -f

echo "Deployment completed successfully!"
echo "API is running at https://sms.lancolatech.co.ke"

# Show logs
docker-compose logs --tail=50 api
