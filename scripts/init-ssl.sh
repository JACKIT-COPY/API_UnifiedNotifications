#!/bin/bash

# SSL Initialization Script for Let's Encrypt
# This script should be run once to obtain the initial SSL certificates

set -e

DOMAIN="sms.lancolatech.co.ke"
EMAIL="admin@lancolatech.co.ke"  # Change this to your email
STAGING=0  # Set to 1 for testing with Let's Encrypt staging server

echo "Initializing SSL certificates for $DOMAIN..."

# Create directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Download recommended TLS parameters
if [ ! -f "certbot/conf/options-ssl-nginx.conf" ]; then
    echo "Downloading recommended TLS parameters..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
fi

if [ ! -f "certbot/conf/ssl-dhparams.pem" ]; then
    echo "Downloading SSL DH parameters..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem
fi

# Create temporary self-signed certificate
if [ ! -d "certbot/conf/live/$DOMAIN" ]; then
    echo "Creating temporary self-signed certificate..."
    mkdir -p "certbot/conf/live/$DOMAIN"

    docker-compose run --rm --entrypoint "\
        openssl req -x509 -nodes -newkey rsa:2048 -days 1\
        -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
        -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
        -subj '/CN=localhost'" certbot
fi

echo "Starting nginx..."
docker-compose up -d nginx

echo "Removing temporary certificate..."
docker-compose run --rm --entrypoint "\
    rm -Rf /etc/letsencrypt/live/$DOMAIN && \
    rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
    rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

# Request Let's Encrypt certificate
echo "Requesting Let's Encrypt certificate for $DOMAIN..."

if [ $STAGING -eq 1 ]; then
    STAGING_ARG="--staging"
    echo "Using Let's Encrypt staging server (for testing)"
else
    STAGING_ARG=""
fi

docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN" certbot

echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload

echo "SSL certificate initialization complete!"
echo "Your API is now accessible at https://$DOMAIN"
