#!/bin/bash

# SSL Initialization Script using DNS Challenge
# This works even when port 80 is in use

set -e

DOMAIN="sms.lancolatech.co.ke"
EMAIL="admin@lancolatech.co.ke"

echo "=========================================="
echo "  SSL Setup via DNS Challenge"
echo "=========================================="
echo ""
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Create directories
mkdir -p certbot/conf
mkdir -p certbot/www

echo "Step 1: Requesting certificate via DNS challenge..."
echo ""
echo "You'll need to add a TXT record to your DNS."
echo ""

# Request certificate with manual DNS challenge
docker-compose run --rm --entrypoint "\
  certbot certonly --manual \
  --preferred-challenges dns \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN" certbot

echo ""
echo "=========================================="
echo "  Instructions:"
echo "=========================================="
echo ""
echo "Certbot will show you a TXT record to add."
echo ""
echo "1. Go to DigitalOcean → Networking → Domains"
echo "2. Find: lancolatech.co.ke"
echo "3. Add TXT record:"
echo "   - Hostname: _acme-challenge.sms"
echo "   - Value: (the value certbot shows)"
echo "   - TTL: 300"
echo "4. Wait 2-3 minutes for DNS propagation"
echo "5. Press Enter in certbot to verify"
echo ""
echo "After verification, restart nginx:"
echo "  docker-compose restart nginx"
echo ""
