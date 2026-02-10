#!/bin/bash

# Quick Deployment Script
# Use this for regular deployments after initial setup

set -e

echo "=========================================="
echo "  Quick Deploy - Unified API"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo -e "${YELLOW}→ Pulling latest changes from GitHub...${NC}"
git pull origin main

echo ""
echo -e "${YELLOW}→ Rebuilding API container...${NC}"
docker-compose build --no-cache api

echo ""
echo -e "${YELLOW}→ Restarting services...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}→ Waiting for API to be ready...${NC}"
sleep 5

# Health check
timeout=30
counter=0
until docker-compose exec -T api node -e "require('http').get('http://localhost:3040/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; do
    counter=$((counter+1))
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}✗ API health check failed${NC}"
        echo "Showing recent logs:"
        docker-compose logs --tail=50 api
        exit 1
    fi
    echo "Health check... ($counter/$timeout)"
    sleep 2
done

echo ""
echo -e "${YELLOW}→ Cleaning up old Docker images...${NC}"
docker image prune -f

echo ""
echo "=========================================="
echo -e "${GREEN}  Deployment Successful!${NC}"
echo "=========================================="
echo ""
echo "API URL: https://sms.lancolatech.co.ke"
echo ""
echo "Recent logs:"
docker-compose logs --tail=20 api
echo ""
