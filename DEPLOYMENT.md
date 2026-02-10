# Deployment Guide - DigitalOcean

This guide provides step-by-step instructions for deploying the Unified Notifications API to DigitalOcean with Docker, SSL, and automated deployments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [DNS Configuration](#dns-configuration)
3. [Server Setup](#server-setup)
4. [Application Deployment](#application-deployment)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [GitHub Actions Setup](#github-actions-setup)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- DigitalOcean account with a droplet (Ubuntu 22.04 LTS recommended)
- Domain: `sms.lancolatech.co.ke`
- GitHub repository access
- SSH access to your droplet

### Recommended Droplet Specifications

- **Type**: Basic Droplet
- **Size**: 2 vCPUs, 2 GB RAM, 50 GB SSD ($12/month)
- **OS**: Ubuntu 22.04 LTS
- **Datacenter**: Choose closest to your users

---

## DNS Configuration

### Step 1: Configure Domain

You need to point `sms.lancolatech.co.ke` to your DigitalOcean droplet.

#### Option A: Using cPanel DNS (If you control DNS)

1. Log into your cPanel account
2. Navigate to **Zone Editor** or **Advanced DNS Zone Editor**
3. Update the **A Record**:
   - **Name/Host**: `@` or `sms.lancolatech.co.ke`
   - **Type**: A
   - **Points to/Value**: Your DigitalOcean droplet IP address
   - **TTL**: 3600 (1 hour)
4. Save the record

#### Option B: Using DigitalOcean DNS

1. Go to DigitalOcean Dashboard → Networking → Domains
2. Add domain: `sms.lancolatech.co.ke`
3. Create an **A record**:
   - **Hostname**: `@`
   - **Will Direct to**: Your droplet
   - **TTL**: 3600 seconds
4. Update your domain registrar's nameservers to:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`

#### Option C: Using Cloudflare (Recommended for better performance)

1. Add your domain to Cloudflare
2. Update the **A record**:
   - **Type**: A
   - **Name**: `@`
   - **IPv4 address**: Your DigitalOcean droplet IP
   - **Proxy status**: DNS only (click the cloud icon to make it gray)
   - **TTL**: Auto
3. Update nameservers at your domain registrar to Cloudflare's nameservers

### Step 2: Verify DNS Propagation

Wait 5-30 minutes for DNS to propagate, then verify:

```bash
# Check DNS resolution
nslookup sms.lancolatech.co.ke

# Or use dig
dig sms.lancolatech.co.ke
```

You should see your DigitalOcean droplet IP address in the response.

---

## Server Setup

### Step 1: Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 2: Create Deployment User (Optional but Recommended)

```bash
# Create a new user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Switch to deploy user
su - deploy
```

### Step 3: Run Server Setup Script

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

Or manually install requirements:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt-get install -y git

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### Step 4: Setup SSH Keys for GitHub

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy the public key
cat ~/.ssh/id_ed25519.pub
```

Add this public key to your GitHub repository:
1. Go to GitHub → Your Repository → Settings → Deploy keys
2. Click "Add deploy key"
3. Paste the public key
4. Check "Allow write access" if needed
5. Save

### Step 5: Clone Repository

```bash
# Create deployment directory
mkdir -p ~/unified-api
cd ~/unified-api

# Clone repository
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git .
```

---

## Application Deployment

### Step 1: Create Environment File

```bash
cd ~/unified-api
cp .env.example .env
nano .env
```

Update the following values:

```env
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password_here
MONGO_DATABASE=unified_api

# Application Configuration
NODE_ENV=production
PORT=3040
JWT_SECRET=your_very_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Email Configuration (if using)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=noreply@lancolatech.co.ke

# SMS/WhatsApp API credentials
# Add your specific credentials here
```

### Step 2: Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### Step 3: Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start services (without SSL initially)
docker-compose up -d mongodb api

# Check logs
docker-compose logs -f
```

---

## SSL Certificate Setup

### Step 1: Initialize SSL Certificates

Before running this, ensure:
- DNS is properly configured and propagated
- `sms.lancolatech.co.ke` points to your droplet IP
- Ports 80 and 443 are open

```bash
cd ~/unified-api

# Edit init-ssl.sh to update email
nano scripts/init-ssl.sh
# Change EMAIL="admin@lancolatech.co.ke" to your actual email

# Run SSL initialization
./scripts/init-ssl.sh
```

### Step 2: Verify SSL

Visit `https://sms.lancolatech.co.ke` in your browser. You should see a valid SSL certificate.

Test SSL configuration:
```bash
curl -I https://sms.lancolatech.co.ke
```

---

## GitHub Actions Setup

### Step 1: Generate SSH Key for GitHub Actions

On your droplet:

```bash
# Generate a separate key for GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -C "github-actions"

# Add the public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Display the private key (you'll add this to GitHub Secrets)
cat ~/.ssh/github_actions
```

### Step 2: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

1. **DO_SSH_PRIVATE_KEY**
   - The entire content of `~/.ssh/github_actions` (private key)

2. **DO_SERVER_IP**
   - Your DigitalOcean droplet IP address

3. **DO_USER**
   - Your SSH user (e.g., `deploy` or `root`)

4. **DEPLOY_PATH**
   - Path to your application (e.g., `/home/deploy/unified-api`)

### Step 3: Test Auto-Deployment

Make a small change to your code and push to main:

```bash
git add .
git commit -m "test: trigger auto-deployment"
git push origin main
```

Monitor the deployment:
1. Go to GitHub → Your Repository → Actions
2. Watch the deployment workflow run

---

## Post-Deployment

### Health Checks

```bash
# Check all services
docker-compose ps

# Check API health
curl https://sms.lancolatech.co.ke/health

# View logs
docker-compose logs -f api
docker-compose logs -f mongodb
docker-compose logs -f nginx
```

### MongoDB Access

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh -u admin -p your_password --authenticationDatabase admin

# Create application database
use unified_api
db.createUser({
  user: "apiuser",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "unified_api" }]
})
```

### Backup Configuration

Create a backup script:

```bash
nano ~/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR=~/backups/mongodb
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec -T mongodb mongodump \
  --username=admin \
  --password=your_password \
  --authenticationDatabase=admin \
  --db=unified_api \
  --archive | gzip > $BACKUP_DIR/backup_$TIMESTAMP.archive.gz

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.archive.gz"
```

```bash
chmod +x ~/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line: 0 2 * * * ~/backup-mongodb.sh
```

### Update CORS Origins

Update [src/main.ts](src/main.ts#L20-L27) to include your production frontend:

```typescript
origin: [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://sms.lancolatech.co.ke',
  'https://your-frontend-domain.com', // Add your frontend domain
],
```

---

## Troubleshooting

### SSL Certificate Issues

```bash
# Check certbot logs
docker-compose logs certbot

# Manually renew certificate
docker-compose run --rm certbot renew

# Test SSL configuration
docker-compose exec nginx nginx -t
```

### API Not Responding

```bash
# Check if containers are running
docker-compose ps

# Check API logs
docker-compose logs api

# Check nginx logs
docker-compose logs nginx

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify MongoDB is healthy
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check connection string in .env
cat .env | grep MONGODB_URI
```

### Deployment Fails

```bash
# Check GitHub Actions logs in repository

# Manually deploy
cd ~/unified-api
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use

```bash
# Check what's using ports 80/443
sudo lsof -i :80
sudo lsof -i :443

# Kill process if needed
sudo kill -9 PID
```

### View All Logs

```bash
# Follow all logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View specific service
docker-compose logs -f api
```

---

## Maintenance Commands

```bash
# Update application
cd ~/unified-api
./scripts/deploy.sh

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Clean up Docker
docker system prune -a
```

---

## Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Use strong JWT secret
- [ ] Configure firewall (UFW)
- [ ] SSL certificates are valid
- [ ] MongoDB authentication enabled
- [ ] Regular backups configured
- [ ] Keep system updated (`sudo apt-get update && sudo apt-get upgrade`)
- [ ] Monitor logs regularly
- [ ] Use non-root user for deployment

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review this documentation
- Check GitHub Actions workflow logs
- Contact: admin@lancolatech.co.ke

---

**API Endpoint:** `https://sms.lancolatech.co.ke`
