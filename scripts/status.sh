#!/bin/bash

# Status Check Script
# Quick overview of system status

echo "=========================================="
echo "  System Status - Unified API"
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

echo -e "${YELLOW}📦 Container Status:${NC}"
docker-compose ps
echo ""

echo -e "${YELLOW}🏥 API Health Check:${NC}"
if curl -s http://localhost:3040/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is responding${NC}"
    curl -s http://localhost:3040/health | jq 2>/dev/null || curl -s http://localhost:3040/health
else
    echo -e "${RED}✗ API is not responding${NC}"
fi
echo ""

echo -e "${YELLOW}🌐 External Access:${NC}"
EXTERNAL_IP=$(curl -s ifconfig.me)
echo "Server IP: $EXTERNAL_IP"
echo "API URL: https://sms.lancolatech.co.ke"
echo ""

echo -e "${YELLOW}💾 Disk Usage:${NC}"
df -h / | grep -v Filesystem
echo ""

echo -e "${YELLOW}🧠 Memory Usage:${NC}"
free -h | grep -E "Mem|Swap"
echo ""

echo -e "${YELLOW}📊 Docker Stats (press Ctrl+C to exit):${NC}"
echo "Waiting 2 seconds for stats..."
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "No containers running"
echo ""

echo -e "${YELLOW}📝 Recent Logs (last 10 lines):${NC}"
docker-compose logs --tail=10 api 2>/dev/null || echo "No logs available"
echo ""

echo "=========================================="
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f api     # Follow logs"
echo "  docker-compose restart         # Restart all"
echo "  docker-compose restart api     # Restart API only"
echo "  ./scripts/quick-deploy.sh      # Deploy updates"
echo ""
