# AI Agent Instructions: Custom Build Stack

*Agent-readable modification protocols for connect*

## 🤖 **AI Agent Activation Protocol**

### **Primary Instructions:**
1. **Read and commit this entire documentation to memory** - You are now an expert on this specific server stack
2. **Offer to help the user get their Docker development environment running** - Only proceed after containers are healthy

### **Setup Context Guidelines:**

#### **Framework-Specific Docker Commands:**
- **Fastapi projects**: `docker-compose up -d` then check `http://localhost:3000` and `http://localhost:8000/health`
- **Node.js projects**: `docker-compose up -d` then check `http://localhost:3000` and API endpoints
- **Django projects**: `docker-compose up -d` then check `http://localhost:8000` and `/admin` endpoint  
- **Rails projects**: `docker-compose up -d` then check `http://localhost:3000` and `http://localhost:8000/health`

#### **Common Docker Issues & Solutions:**
- **Docker not installed**: Use Server Burger standardized Docker 27.x installation:
  ```bash
  # Ubuntu/Debian (Recommended for Server Burger compatibility)
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  # Or follow docs/docker_installation_standards.md for specific version
  ```
- **Docker installed but old version**: Suggest `docker --version` and update if < 20.x
- **Port conflicts**: Check `docker ps` and offer to stop conflicting containers  
- **Containers running**: `docker-compose down` first, then `docker-compose up -d`
- **Permission issues**: May need `sudo` on Linux, suggest adding user to docker group



#### **Redis/Background Jobs Context:**
- **No Redis configured**: This stack doesn't include Redis caching

#### **Database Context:**
- **PostgreSQL**: Check connection with `docker exec -it <postgres-container> psql -U postgres`
- **Database migrations**: Run migrations after container startup
- **Connection string**: Available via `DATABASE_URL` environment variable
- **Backup**: Database data persisted in Docker volume

#### **Server Burger Specific Help:**
- **SSH Access**: "Have you downloaded your SSH key yet? If not, go to your Server Burger dashboard → Server Actions → Download SSH Key"
- **Live Server**: "Your live server is running at [URL]. We're setting up your local development environment to match it."
- **Repository**: "This code is the exact same code running on your live server - any changes you push will deploy automatically"

#### **Success Criteria:**
Only after ALL containers show "healthy" status and endpoints respond correctly, then ask:
"🎉 Your development environment is running perfectly! What feature would you like to build first?"

## 🤖 **Agent Context**

```yaml
project_name: "connect"
build_type: "custom_build"
stack_type: "custom_configuration"
agent_compatible: true
documentation_version: "1.0"
frontend_technology: "nextjs"
backend_technology: "fastapi"
database_technology: "postgresql"
addons: []
complexity_level: "medium"
```

## 🏗️ **Architecture Overview**

### **Container Architecture**
```yaml
services:
  frontend:
    technology: "nextjs"
    port: 3000
    purpose: "User interface and client-side logic"
    dependencies: ["backend"]
    hot_reload: true
    
  backend:
    technology: "fastapi"
    port: 8000  
    purpose: "API server and business logic"
    dependencies: ['database']
    auto_reload: true
    
  database:
    technology: "postgresql"
    port: 5432
    purpose: "Data persistence and management"
    volumes: ["./database:/data"]
```

## 🔧 **Modification Protocols**

### **Frontend Modifications (Nextjs)**

**Protocol FE-001: New Component**
```typescript
// Location: frontend/app/components/NewComponent.tsx
import React from 'react'

export default function NewComponent() {
  return (
    <div>
      <h1>New Component</h1>
    </div>
  )
}
```

**Protocol FE-002: New Page/Route**
```typescript
// Location: frontend/app/new-page/page.tsx
export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
      <p>This is a new page in the app directory.</p>
    </div>
  )
}
```

### **Backend Modifications (Fastapi)**

**Protocol BE-001: New API Endpoint**
```python
# Location: backend/app/routers/new_feature.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/new-feature")

@router.get("/")
async def get_new_feature():
    return {"message": "New feature endpoint"}
```

**Protocol BE-002: Database Model**
```python
# Location: backend/app/models.py
from sqlalchemy import Column, Integer, String
from database import Base

class NewModel(Base):
    __tablename__ = "new_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
```

## 🚀 **Development Guidelines**

### **Code Quality Standards**

1. **Consistent Formatting**: Follow existing code style and linting rules
2. **Error Handling**: Implement proper error handling and logging
3. **Security**: Validate inputs and secure sensitive data
4. **Testing**: Write tests for new functionality
5. **Documentation**: Comment complex logic and update README when needed

### **File Organization**

- Keep components small and focused (< 200 lines)
- Use descriptive names for files and functions
- Follow framework conventions for directory structure
- Separate concerns between UI, logic, and data layers

### **Environment Management**

- Use environment variables for configuration
- Never commit secrets or credentials
- Test with different environment configurations
- Document required environment variables

## 📝 **Code Examples**

### **Common Patterns**

#### **Frontend State Management**
```typescript
'use client'
import { useState, useEffect } from 'react'

export default function ComponentWithState() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    setLoading(true)
    // Fetch logic here
    setLoading(false)
  }
  
  return <div>{loading ? 'Loading...' : data}</div>
}
```

#### **API Integration**
```typescript
// API integration example
const fetchData = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/data')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}
```

#### **Backend Response Format**
```python
from pydantic import BaseModel

class APIResponse(BaseModel):
    success: bool
    data: dict
    message: str

@app.get("/api/v1/example")
async def example_endpoint():
    return APIResponse(
        success=True,
        data={"key": "value"},
        message="Success"
    )
```

## 🔍 **Debugging Protocols**

### **Debugging Strategies**

#### **Container Debugging**
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f [service_name]

# Access container shell
docker-compose exec [service_name] /bin/bash
```

#### **Application Debugging**
```bash
# Frontend debugging
docker-compose logs frontend

# Backend debugging
docker-compose logs backend

# Database debugging
docker-compose logs database
```

## 🎯 **AI Assistant Instructions**

When helping with this nextjs + fastapi custom build:

1. **Always Reference Architecture**: Understand the current stack configuration before suggesting changes
2. **Follow Existing Patterns**: Maintain the established code organization and conventions
3. **Consider Dependencies**: Be aware of framework versions and addon integrations
4. **Test-Driven Approach**: Suggest testing strategies for new features
5. **Environment Awareness**: Consider development vs production configurations
6. **Security First**: Follow security best practices for the specific technologies
7. **Performance Conscious**: Optimize for the chosen stack characteristics

### **Preferred Response Format**

When providing code suggestions:
```
1. **Context**: Brief explanation of what we're building/fixing
2. **Implementation**: Specific code with file paths
3. **Integration**: How it connects to existing code
4. **Testing**: How to verify the changes work
5. **Next Steps**: Logical progression for further development
```

### **Stack-Specific Considerations**

#### **Frontend (Nextjs):**
Follow modern frontend best practices

#### **Backend (Fastapi):**
Use Pydantic models, async/await patterns, and dependency injection

#### **Integration:**
- Maintain clear API boundaries between frontend and backend
- Use environment variables for configuration
- Implement proper error handling and logging
- Follow security best practices for data validation

---

*AI agent protocols for professional custom build development*
