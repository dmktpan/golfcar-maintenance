# 🔧 Production Troubleshooting Guide

คู่มือการแก้ไขปัญหาสำหรับ Golf Car Maintenance System ในสภาพแวดล้อม Production

## 📋 Table of Contents

1. [Common Issues](#common-issues)
2. [External API Problems](#external-api-problems)
3. [Database Connection Issues](#database-connection-issues)
4. [Performance Problems](#performance-problems)
5. [CORS and Security Issues](#cors-and-security-issues)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Emergency Procedures](#emergency-procedures)

## 🚨 Common Issues

### 1. Application Won't Start

**Symptoms:**
- Application fails to start
- Port already in use error
- Module not found errors

**Solutions:**

```bash
# Check if port is already in use
lsof -i :3000

# Kill existing process
kill -9 $(lsof -t -i:3000)

# Check environment variables
cat .env.production

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild application
npm run build
```

### 2. Health Check Failures

**Symptoms:**
- `/api/health` returns 503
- Database connectivity issues
- External API unreachable

**Solutions:**

```bash
# Check health endpoint
curl -v http://localhost:3000/api/health

# Check simple health endpoint
curl -v http://localhost:3000/api/health?simple=true

# Check application logs
tail -f logs/production.log

# Restart application
./scripts/production-deploy.sh
```

### 3. High Memory Usage

**Symptoms:**
- Application becomes slow
- Memory warnings in health checks
- System becomes unresponsive

**Solutions:**

```bash
# Check memory usage
./scripts/production-monitor.sh

# Restart application to clear memory
pm2 restart all  # if using PM2
# or
./scripts/production-deploy.sh

# Check for memory leaks in logs
grep -i "memory\|heap" logs/production.log
```

## 🌐 External API Problems

### 1. External API Connection Timeout

**Symptoms:**
- Slow response times
- Timeout errors in logs
- External API status shows "unhealthy"

**Diagnosis:**

```bash
# Test external API directly
curl -v http://golfcar.go2kt.com:8080/api/health

# Check network connectivity
ping golfcar.go2kt.com

# Test with different timeout
curl --connect-timeout 10 --max-time 30 http://golfcar.go2kt.com:8080/api/health
```

**Solutions:**

1. **Increase Timeout Values:**
```bash
# In .env.production
EXTERNAL_API_TIMEOUT=30000  # 30 seconds
```

2. **Implement Retry Logic:**
```javascript
// In proxy API files
const maxRetries = 3;
const retryDelay = 1000;

for (let i = 0; i < maxRetries; i++) {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
}
```

3. **Add Circuit Breaker Pattern:**
```javascript
// Implement circuit breaker for external API calls
let failureCount = 0;
const maxFailures = 5;
const resetTimeout = 60000; // 1 minute

if (failureCount >= maxFailures) {
  // Circuit is open, return cached data or error
  return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
}
```

### 2. External API Authentication Issues

**Symptoms:**
- 401 Unauthorized responses
- Authentication token expired
- API key invalid

**Solutions:**

```bash
# Check API credentials
echo $EXTERNAL_API_KEY
echo $EXTERNAL_API_BASE_URL

# Test authentication
curl -H "Authorization: Bearer $EXTERNAL_API_KEY" \
     http://golfcar.go2kt.com:8080/api/auth/verify

# Refresh authentication token
curl -X POST http://golfcar.go2kt.com:8080/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "your_refresh_token"}'
```

### 3. External API Rate Limiting

**Symptoms:**
- 429 Too Many Requests responses
- Requests being throttled
- Slow API responses

**Solutions:**

1. **Implement Request Queuing:**
```javascript
// Add request queue with rate limiting
const requestQueue = [];
const maxConcurrentRequests = 5;
const requestDelay = 200; // ms between requests

async function queuedRequest(url, options) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, options, resolve, reject });
    processQueue();
  });
}
```

2. **Add Caching:**
```javascript
// Cache responses to reduce API calls
const cache = new Map();
const cacheTimeout = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheTimeout) {
    return cached.data;
  }
  return null;
}
```

## 🗄️ Database Connection Issues

### 1. MongoDB Connection Failures

**Symptoms:**
- Database health check fails
- Prisma connection errors
- "MongoNetworkError" in logs

**Diagnosis:**

```bash
# Test MongoDB connection
mongosh "$DATABASE_URL"

# Check Prisma connection
npx prisma db push --preview-feature

# Test with Prisma Studio
npx prisma studio
```

**Solutions:**

1. **Check Connection String:**
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: mongodb://username:password@host:port/database
```

2. **Increase Connection Pool:**
```javascript
// In lib/db/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool settings
  __internal: {
    engine: {
      connectionLimit: 10,
    },
  },
});
```

3. **Add Connection Retry:**
```javascript
// In lib/middleware/database.ts
async function connectWithRetry(maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      console.log(`Database connection attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}
```

### 2. Database Performance Issues

**Symptoms:**
- Slow query responses
- High database CPU usage
- Connection timeouts

**Solutions:**

1. **Add Database Indexes:**
```javascript
// In Prisma schema
model Vehicle {
  id              String @id @default(auto()) @map("_id") @db.ObjectId
  serial_number   String @unique
  golf_course_id  Int
  
  @@index([golf_course_id])
  @@index([serial_number])
}
```

2. **Optimize Queries:**
```javascript
// Use select to limit fields
const vehicles = await prisma.vehicle.findMany({
  select: {
    id: true,
    serial_number: true,
    model: true,
  },
  where: { golf_course_id: golfCourseId },
});

// Use pagination
const vehicles = await prisma.vehicle.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

3. **Add Query Caching:**
```javascript
// Cache frequently accessed data
const vehicleCache = new Map();

async function getCachedVehicles(golfCourseId) {
  const cacheKey = `vehicles_${golfCourseId}`;
  const cached = vehicleCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.data;
  }
  
  const vehicles = await prisma.vehicle.findMany({
    where: { golf_course_id: golfCourseId }
  });
  
  vehicleCache.set(cacheKey, {
    data: vehicles,
    timestamp: Date.now()
  });
  
  return vehicles;
}
```

## 🚀 Performance Problems

### 1. Slow Page Load Times

**Symptoms:**
- Pages take >3 seconds to load
- High Time to First Byte (TTFB)
- Poor Core Web Vitals scores

**Solutions:**

1. **Enable Compression:**
```javascript
// In next.config.mjs
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  
  // Enable static optimization
  trailingSlash: false,
  
  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

2. **Add Response Caching:**
```javascript
// In API routes
export async function GET(request) {
  const response = NextResponse.json(data);
  
  // Cache for 5 minutes
  response.headers.set('Cache-Control', 'public, max-age=300');
  
  return response;
}
```

3. **Implement Code Splitting:**
```javascript
// Use dynamic imports
const DashboardComponent = dynamic(() => import('../components/Dashboard'), {
  loading: () => <div>Loading...</div>,
});
```

### 2. High CPU Usage

**Symptoms:**
- CPU usage >80%
- Slow API responses
- Application becomes unresponsive

**Solutions:**

1. **Profile Application:**
```bash
# Use Node.js profiler
node --prof app.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

2. **Optimize Heavy Operations:**
```javascript
// Use streaming for large datasets
async function* streamVehicles() {
  const batchSize = 100;
  let skip = 0;
  
  while (true) {
    const vehicles = await prisma.vehicle.findMany({
      skip,
      take: batchSize,
    });
    
    if (vehicles.length === 0) break;
    
    yield vehicles;
    skip += batchSize;
  }
}
```

3. **Add Worker Threads:**
```javascript
// For CPU-intensive tasks
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  const worker = new Worker(__filename);
  worker.postMessage(data);
  worker.on('message', (result) => {
    // Handle result
  });
} else {
  parentPort.on('message', (data) => {
    // Process data
    const result = heavyComputation(data);
    parentPort.postMessage(result);
  });
}
```

## 🔒 CORS and Security Issues

### 1. CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- Preflight request failures
- API calls blocked by browser

**Solutions:**

1. **Check CORS Configuration:**
```javascript
// In middleware.ts
export function middleware(request) {
  const response = NextResponse.next();
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

2. **Handle Preflight Requests:**
```javascript
// In API routes
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### 2. Security Headers Missing

**Symptoms:**
- Security warnings in browser
- Vulnerability scan failures
- Missing security headers

**Solutions:**

```javascript
// In next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

## 📊 Monitoring and Logging

### 1. Log Analysis

**Common Log Patterns:**

```bash
# Check for errors
grep -i "error\|exception\|fatal" logs/production.log

# Check for slow queries
grep "slow query" logs/production.log

# Check for memory issues
grep -i "memory\|heap\|gc" logs/production.log

# Check API response times
grep "response_time" logs/production.log | awk '{print $NF}' | sort -n
```

### 2. Performance Monitoring

**Key Metrics to Monitor:**

```bash
# Response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/health

# Memory usage
ps aux | grep node

# CPU usage
top -p $(pgrep node)

# Database connections
netstat -an | grep :27017 | wc -l
```

### 3. Automated Alerts

**Setup Monitoring Script:**

```bash
# Add to crontab for regular monitoring
*/5 * * * * /path/to/scripts/production-monitor.sh -q >> /var/log/monitor.log 2>&1

# Alert on failures
*/1 * * * * /path/to/scripts/health-check.sh || echo "ALERT: Application down" | mail -s "Production Alert" admin@example.com
```

## 🚨 Emergency Procedures

### 1. Application Down

**Immediate Actions:**

```bash
# 1. Check if process is running
ps aux | grep node

# 2. Check health endpoint
curl http://localhost:3000/api/health

# 3. Check logs for errors
tail -50 logs/production.log

# 4. Restart application
./scripts/production-deploy.sh

# 5. If restart fails, rollback
git checkout HEAD~1
npm run build
npm start
```

### 2. Database Connection Lost

**Immediate Actions:**

```bash
# 1. Check database status
mongosh "$DATABASE_URL" --eval "db.adminCommand('ping')"

# 2. Restart database connection
npx prisma db push

# 3. Clear connection pool
# Restart application to reset connections
./scripts/production-deploy.sh
```

### 3. External API Unavailable

**Immediate Actions:**

```bash
# 1. Test external API
curl http://golfcar.go2kt.com:8080/api/health

# 2. Enable fallback mode
export EXTERNAL_API_FALLBACK=true

# 3. Use cached data
# Implement cache fallback in proxy APIs

# 4. Notify users
# Add banner or notification about limited functionality
```

### 4. High Load Situation

**Immediate Actions:**

```bash
# 1. Check system resources
./scripts/production-monitor.sh

# 2. Enable rate limiting
export API_RATE_LIMIT=100  # requests per minute

# 3. Scale horizontally (if possible)
# Start additional instances on different ports

# 4. Optimize database queries
# Enable query caching
# Add database indexes

# 5. Enable CDN/caching
# Configure reverse proxy with caching
```

## 📞 Support Contacts

- **System Administrator:** [admin@example.com]
- **Database Administrator:** [dba@example.com]
- **External API Support:** [api-support@golfcar.go2kt.com]
- **Emergency Hotline:** [+66-xxx-xxx-xxxx]

## 📚 Additional Resources

- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)

---

**Last Updated:** $(date)
**Version:** 1.0.0