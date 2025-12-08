# 🚀 Deployment Guide

## Deployment Options

### Option 1: Docker Compose (Recommended)

```powershell
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Ports:**
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

---

### Option 2: Local Development

#### Backend
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn src.api.main:app --reload --port 8000
```

#### Frontend
```powershell
cd web\frontend
npm run dev
```

---

### Option 3: Production Build

#### Backend
```powershell
# Install dependencies
pip install -r requirements.txt

# Run with production settings
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Frontend
```powershell
cd web\frontend
npm run build
npm run preview
```

Or serve with nginx/caddy:
```powershell
# Build
npm run build

# Output in dist/ folder
# Configure your web server to serve dist/
```

---

## Environment Variables

### Backend (.env)
```env
# Python environment
PYTHONPATH=C:\Users\YourUser\Desktop\projects\f1
FASTF1_CACHE=./data/cache

# API settings
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=false
LOG_LEVEL=info

# CORS origins (production)
CORS_ORIGINS=["https://yourdomain.com"]
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
# Production:
# VITE_API_URL=https://api.yourdomain.com
```

---

## Cloud Deployment

### AWS Deployment

#### Backend (Elastic Beanstalk or ECS)
```yaml
# .platform/nginx/conf.d/proxy.conf
client_max_body_size 10M;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

#### Frontend (S3 + CloudFront)
```powershell
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

### Heroku Deployment

#### Backend
```yaml
# Procfile
web: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

```powershell
heroku create f1-analytics-api
git push heroku main
```

#### Frontend
```powershell
# Use static buildpack
heroku buildpacks:set heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static

# Deploy
git push heroku main
```

---

### Vercel/Netlify (Frontend only)

#### Vercel
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-api.com/:path*"
    }
  ]
}
```

Deploy:
```powershell
npm install -g vercel
vercel --prod
```

#### Netlify
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api.com/:splat"
  status = 200
```

---

## Performance Optimization

### Backend

1. **Enable Caching**
   - Already implemented in-memory cache
   - Consider Redis for production

2. **Database Connection Pooling**
   - If using DB, configure pool size

3. **Compression**
```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### Frontend

1. **Code Splitting**
```typescript
// Lazy load pages
const TelemetryAnalysis = lazy(() => import('./pages/TelemetryAnalysis'))
```

2. **Image Optimization**
   - Compress screenshots
   - Use WebP format

3. **Bundle Analysis**
```powershell
npm run build -- --mode analyze
```

---

## Monitoring

### Backend Logging
```python
# Already using structlog
# Add APM tool like Sentry
import sentry_sdk
sentry_sdk.init(dsn="your-dsn")
```

### Frontend Error Tracking
```typescript
// Add error boundary
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "your-dsn"
})
```

---

## Security Checklist

- [ ] Update CORS origins for production
- [ ] Enable HTTPS
- [ ] Set secure headers (helmet)
- [ ] Rate limiting on API
- [ ] Environment variables protected
- [ ] Remove debug/dev dependencies
- [ ] Update API keys/tokens
- [ ] Enable CSP headers

---

## Backup & Recovery

### Data Backup
```powershell
# Backup FastF1 cache
Compress-Archive -Path data/cache -DestinationPath backup_$(Get-Date -Format 'yyyyMMdd').zip
```

### Database Backup (if added)
```powershell
# PostgreSQL example
pg_dump -U user -d f1_analytics > backup.sql
```

---

## Troubleshooting

### Issue: API not accessible
Check:
1. CORS settings in `main.py`
2. Firewall rules
3. Port availability

### Issue: Frontend can't reach API
1. Check `VITE_API_URL` in `.env`
2. Verify proxy settings
3. Check browser console for errors

### Issue: Slow performance
1. Check cache hit rate
2. Monitor API response times
3. Analyze bundle size
4. Check network tab

---

## Scaling Considerations

- **Horizontal Scaling**: Deploy multiple backend instances with load balancer
- **Cache Layer**: Use Redis/Memcached for shared cache
- **CDN**: Use CloudFlare/CloudFront for static assets
- **Database**: Add PostgreSQL for persistent data
- **Queue**: Add Celery for background tasks

---

For questions: Open an issue on GitHub
