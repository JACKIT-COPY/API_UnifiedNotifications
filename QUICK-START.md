# Quick Start Deployment Guide

## 🚀 Deploy in 30 Minutes

### 1️⃣ Configure DNS (5 minutes)

**In your cPanel or DNS provider:**

Add A Record:
- **Name**: `api` (or `api.sms.lancolatech.co.ke`)
- **Type**: A
- **Value**: Your DigitalOcean droplet IP
- **TTL**: 3600

Verify: `nslookup api.sms.lancolatech.co.ke`

---

### 2️⃣ Setup DigitalOcean Server (10 minutes)

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Setup SSH for GitHub
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Copy this and add to GitHub: Settings → Deploy keys
```

---

### 3️⃣ Clone & Configure (5 minutes)

```bash
# Clone repository
mkdir -p ~/unified-api && cd ~/unified-api
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git .

# Create environment file
cp .env.production.example .env
nano .env
```

**Update these critical values:**
```env
MONGO_ROOT_PASSWORD=your_secure_password_123
JWT_SECRET=generate_with_openssl_rand_base64_64
```

Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 4️⃣ Deploy Application (5 minutes)

```bash
# Build and start (without SSL first)
docker-compose up -d mongodb api

# Check logs
docker-compose logs -f api
```

Wait for: `🚀 NotifyHub backend running on port 3040`

---

### 5️⃣ Setup SSL (5 minutes)

```bash
# Update email in script
nano scripts/init-ssl.sh
# Change: EMAIL="admin@lancolatech.co.ke" to your email

# Make executable and run
chmod +x scripts/init-ssl.sh
./scripts/init-ssl.sh
```

✅ Visit: `https://api.sms.lancolatech.co.ke`

---

### 6️⃣ Setup Auto-Deployment (5 minutes)

**Generate GitHub Actions SSH Key:**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # Copy this private key
```

**Add GitHub Secrets:**
Repository → Settings → Secrets → Actions → New repository secret

| Secret Name | Value |
|------------|-------|
| `DO_SSH_PRIVATE_KEY` | Content of `~/.ssh/github_actions` (private key) |
| `DO_SERVER_IP` | Your droplet IP |
| `DO_USER` | `root` or your SSH user |
| `DEPLOY_PATH` | `/root/unified-api` |

**Test deployment:**
```bash
# Make a small change
echo "# Test" >> README.md
git add .
git commit -m "test: trigger deployment"
git push origin main
```

Watch at: GitHub → Actions tab

---

## ✅ Verification Checklist

- [ ] DNS resolves to droplet IP
- [ ] `https://api.sms.lancolatech.co.ke` shows valid SSL
- [ ] Health check works: `https://api.sms.lancolatech.co.ke/health`
- [ ] GitHub Actions deployment succeeds
- [ ] MongoDB is running: `docker-compose ps`
- [ ] Logs are clean: `docker-compose logs -f`

---

## 🆘 Quick Troubleshooting

**API not responding:**
```bash
docker-compose logs api
docker-compose restart api
```

**SSL issues:**
```bash
docker-compose logs certbot
docker-compose logs nginx
```

**Database issues:**
```bash
docker-compose logs mongodb
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

**Redeploy from scratch:**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Next Steps

- ✅ Add your frontend domain to CORS in [src/main.ts](src/main.ts)
- ✅ Setup MongoDB backups (see [DEPLOYMENT.md](DEPLOYMENT.md))
- ✅ Configure email/SMS credentials in `.env`
- ✅ Monitor logs regularly
- ✅ Update security settings

Full documentation: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🎯 Common Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Manual deployment
cd ~/unified-api && git pull && docker-compose build && docker-compose up -d

# Check status
docker-compose ps

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p
```

---

**Support:** admin@lancolatech.co.ke
