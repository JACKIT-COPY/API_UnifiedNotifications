# Security Guide

## Current Setup

Your API is running on **HTTP (port 8080)** without SSL. Here are the security measures and recommendations:

## ✅ Implemented Security

### 1. JWT Authentication
- All protected endpoints require valid JWT tokens
- Token expiration: 7 days (configurable)
- Secret key stored in environment variables

### 2. MongoDB Authentication
- Database access requires username/password
- Database is not exposed to internet (internal Docker network only)

### 3. Firewall (UFW)
- Only ports 8080, 8443, 22 (SSH) are open
- All other ports blocked

### 4. CORS Configuration
- Restricts which domains can access the API
- Update in `src/main.ts` to allow only your frontend domains

### 5. Input Validation
- All inputs validated using `class-validator`
- Prevents injection attacks

## 🔒 Recommended: Add HTTPS

### Option 1: Cloudflare (Easiest & Free)

**Benefits:**
- Free SSL certificate
- DDoS protection
- CDN/caching
- No server changes needed

**Setup:**
1. Sign up at https://cloudflare.com
2. Add your domain `lancolatech.co.ke`
3. Update nameservers at your domain registrar
4. DNS Settings:
   - Type: A
   - Name: `sms`
   - Value: `165.232.152.128`
   - Proxy: ✅ Enabled (orange cloud)
5. SSL/TLS Settings:
   - Set to "Flexible" mode
6. Page Rules:
   - URL: `https://sms.lancolatech.co.ke/*`
   - Setting: Forwarding URL
   - Destination: `http://165.232.152.128:8080/$1`

**Result:** Users access `https://sms.lancolatech.co.ke` (secure)

---

### Option 2: Self-Signed Certificate

**For development/testing only** (browsers will show warnings):

```bash
cd /opt/Unified_NotIfications-API

# Create SSL directory
mkdir -p ssl

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/selfsigned.key \
  -out ssl/selfsigned.crt \
  -subj "/CN=sms.lancolatech.co.ke"

# Update docker-compose.yml to mount ssl directory
# Update nginx config to use these certificates
```

---

## 🛡️ Additional Security Measures

### 1. Enable Rate Limiting

Update your `.env`:
```env
RATE_LIMIT_TTL=60        # Time window in seconds
RATE_LIMIT_MAX=100       # Max requests per window
```

### 2. Restrict CORS

Edit `src/main.ts`:
```typescript
app.enableCors({
  origin: [
    'https://your-frontend.com',
    'https://app.lancolatech.co.ke',
  ],
  credentials: true,
});
```

### 3. Add API Key Authentication (Optional)

For additional security beyond JWT:

```typescript
// Create middleware to check API key header
@UseGuards(ApiKeyGuard)
```

### 4. IP Whitelist (Optional)

Restrict access to specific IPs in Nginx:

```nginx
# In nginx/conf.d/api.conf
location / {
    allow 1.2.3.4;      # Your office IP
    allow 5.6.7.8;      # Your home IP
    deny all;

    proxy_pass http://api_backend;
}
```

### 5. Hide Server Information

Already configured in Nginx to not expose version numbers.

### 6. Regular Updates

```bash
# Update and rebuild
cd /opt/Unified_NotIfications-API
./scripts/quick-deploy.sh
```

---

## 🔐 Current Vulnerabilities

### Without HTTPS:
❌ Data transmitted in plain text
❌ Susceptible to man-in-the-middle attacks
❌ JWT tokens visible in transit

### Mitigation Until HTTPS:
✅ Use VPN when accessing API
✅ Deploy Cloudflare (free HTTPS)
✅ Only access from trusted networks
✅ Use strong JWT secrets
✅ Enable rate limiting
✅ Restrict CORS origins

---

## 📊 Security Checklist

- [x] JWT authentication enabled
- [x] MongoDB password protected
- [x] Firewall configured
- [x] Input validation enabled
- [x] CORS configured
- [ ] **HTTPS/SSL enabled** ← Recommended
- [ ] Rate limiting configured
- [ ] API key authentication (optional)
- [ ] IP whitelist (optional)
- [ ] Regular security updates

---

## 🚨 Production Recommendations

For production use:
1. **Must have:** HTTPS via Cloudflare or proper SSL
2. **Highly recommended:** Rate limiting
3. **Recommended:** IP whitelist for admin endpoints
4. **Optional:** API key authentication

---

## 📞 Support

For security issues, contact: admin@lancolatech.co.ke
