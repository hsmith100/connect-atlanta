# 🚀 Deploy Your Custom Build

**Burger ID:** 41  
**Server IP:** 54.210.148.147  
**SSH Key:** `serverburger-1-27.pem`

## 🛠️ Your Custom Technology Stack

- **Frontend:** Nextjs (Port 3000)
- **Backend:** Fastapi (Port 8000)
- **Database:** Postgresql (Port 5432)

## 📋 Quick Start

Your deployment script is **pre-configured** for your custom stack!

```bash
./deploy.sh
```

That's it! Your custom build will be live at your server URLs.

## 🎯 What This Does

1. **✅ Tests your SSH connection** to the server
2. **🔨 Builds your custom containers locally** (validates everything works)
3. **📤 Syncs your customized files** to the production server
4. **🚢 Rebuilds and restarts** your custom stack on the server
5. **🏥 Runs technology-specific health checks** to confirm deployment success

## ⚡ Deployment Options

### Full Deployment (Recommended)
```bash
./deploy.sh
```
- Builds your custom stack locally first
- Syncs all customizations
- Rebuilds on server with your exact configuration
- Most reliable option for custom builds

### Fast Deployment
```bash
./deploy.sh --fast
```
- Skips local build
- Syncs files and rebuilds on server
- Good for small changes to custom builds

### Test Build Only
```bash
./deploy.sh --build-only
```
- Tests your custom stack locally
- Validates all technology integrations
- No deployment to server

## 🔧 Prerequisites

### 1. Download Your SSH Key
1. Go to your [Server Burger Dashboard](https://serverburger.app/dashboard/orders)
2. Download your SSH key for Burger #41
3. **Important:** Save as `serverburger-1-27.pem` in `~/.ssh/`

### 2. Test Connection
```bash
./scripts/ssh-connect.sh
```

## 🌐 Your Live URLs

After deployment, your custom stack will be available at:
- **Frontend:** http://54.210.148.147:3000
- **Backend:** http://54.210.148.147:8000

## 🔧 Custom Build Features

✅ **Dynamic Port Configuration:** Automatically detected from your technology choices  
✅ **Framework-Specific Health Checks:** Tailored endpoints for each technology  
✅ **Multi-Service Support:** Handles complex custom architectures  
✅ **Technology-Aware Deployment:** Optimized for your specific stack  

## 🎯 Technology-Specific Notes

### Nextjs Frontend
- **Port:** 3000
- **Health Check:** http://localhost:3000
- **Development Command:** ``

### Fastapi Backend  
- **Port:** 8000
- **Health Check:** http://localhost:8000/health
- **Development Command:** ``

### Postgresql Database
- **Port:** 5432
- **Health Check:** ``
- **Docker Image:** ``


## 📁 What Gets Deployed

**✅ Included:**
- All your customized source code
- Technology-specific configurations
- Custom middleware and integrations
- Database schemas and migrations
- Static assets and resources
- Docker configurations optimized for your stack

**❌ Excluded:**
- `.git/` directory
- `node_modules/`, `__pycache__/`, `vendor/` (rebuilt on server)
- Build artifacts (`dist/`, `build/`, `.next/`)
- Log files and cache directories
- Local environment files

## 🆘 Troubleshooting

### SSH Key Issues
```bash
# Wrong permissions? Fix with:
chmod 600 ~/.ssh/serverburger-1-27.pem

# Missing key? Download from:
# https://serverburger.app/dashboard/orders
```

### Custom Build Issues
```bash
# Test your custom stack locally:
docker-compose build
docker-compose up -d

# Check service logs:
docker-compose logs frontend
docker-compose logs backend
docker-compose logs database```

### Technology-Specific Debugging
**Nextjs Frontend:**
```bash
# Check if frontend is responding:
curl -f http://localhost:3000
```

**Fastapi Backend:**
```bash
# Check if backend API is responding:
curl -f http://localhost:8000/health
```

**Postgresql Database:**
```bash
# Test database connection:

```

## 💡 Custom Build Pro Tips

1. **Test locally first** - Your custom stack may have complex interdependencies
2. **Check service startup order** - Some technologies need databases to be ready first
3. **Monitor health checks** - Each technology has specific endpoints and requirements
4. **Review logs** - Custom builds benefit from detailed logging during deployment
5. **Validate integrations** - Test connections between your custom services

## 🤖 Ask Your AI Assistant

Your AI assistant understands your custom technology stack! They can help with:

- Technology-specific deployment issues
- Integration problems between services  
- Performance optimization for your custom stack
- Debugging framework-specific errors

Just describe your issue and mention your technologies:
> "My Nextjs isn't connecting to Fastapi"

---

**🎯 Your Custom Build Advantage:** This deployment script automatically handles all the complexities of your custom technology choices. No manual configuration needed - everything is personalized for your unique stack! 🎉

**Technologies Supported:** Nextjs, Fastapi, Postgresql 