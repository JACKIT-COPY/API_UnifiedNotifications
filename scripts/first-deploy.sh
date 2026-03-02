#!/bin/bash

# First-Time Deployment Script for DigitalOcean
# Run this script ONCE for initial setup

set -e

echo "=========================================="
echo "  Unified Notifications API - First Deploy"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use: sudo su)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    apt-get update
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Checking Docker Compose installation...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Installing..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Show versions
echo ""
echo "Installed versions:"
docker --version
docker-compose --version

echo ""
echo -e "${YELLOW}Step 3: Configuring firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${YELLOW}Step 4: Checking environment file...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    echo "Please create .env file:"
    echo "  cp .env.production.example .env"
    echo "  nano .env"
    exit 1
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Creating necessary directories...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www
echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo -e "${YELLOW}Step 6: Building Docker images...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${YELLOW}Step 7: Starting MongoDB and API containers...${NC}"
docker-compose up -d mongodb api

echo ""
echo -e "${YELLOW}Step 8: Waiting for services to be ready...${NC}"
sleep 10

# Check if API is healthy
echo "Checking API health..."
timeout=60
counter=0
until docker-compose exec -T api node -e "require('http').get('http://localhost:3040/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; do
    counter=$((counter+1))
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}✗ API failed to become healthy${NC}"
        echo "Showing logs:"
        docker-compose logs api
        exit 1
    fi
    echo "Waiting for API... ($counter/$timeout)"
    sleep 2
done

echo -e "${GREEN}✓ API is healthy!${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}  Initial Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your API is running at: http://localhost:3040"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Ensure DNS is configured: sms.lancolatech.co.ke → $(curl -s ifconfig.me)"
echo "2. Wait 5-10 minutes for DNS propagation"
echo "3. Verify DNS: nslookup sms.lancolatech.co.ke"
echo "4. Run SSL setup: ./scripts/init-ssl.sh"
echo ""
echo "Useful commands:"
echo "  docker-compose ps              # Check status"
echo "  docker-compose logs -f api     # View logs"
echo "  docker-compose restart         # Restart services"
echo "  ./scripts/deploy.sh            # Deploy updates"
echo ""
