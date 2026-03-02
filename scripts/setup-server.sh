#!/bin/bash

# Server Setup Script for DigitalOcean Droplet
# Run this script once on a fresh Ubuntu droplet

set -e

echo "Setting up DigitalOcean droplet for deployment..."

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    git \
    ufw

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Configure firewall
echo "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Setup deployment directory
echo "Setting up deployment directory..."
mkdir -p ~/unified-api
cd ~/unified-api

# Clone repository (you'll need to add your repo URL)
echo "Repository cloning should be done separately with proper SSH keys"
echo "Run: git clone git@github.com:your-username/your-repo.git ."

# Create .env file
echo "Creating .env template..."
cat > .env.example << 'EOF'
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=changeme_secure_password
MONGO_DATABASE=unified_api

# Application Configuration
NODE_ENV=production
PORT=3040
JWT_SECRET=changeme_secure_jwt_secret
JWT_EXPIRES_IN=7d

# Add your other environment variables here
EOF

echo "Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure SSH keys for GitHub"
echo "2. Clone your repository"
echo "3. Copy .env.example to .env and update values"
echo "4. Run init-ssl.sh to setup SSL certificates"
echo "5. Run deploy.sh to start the application"
