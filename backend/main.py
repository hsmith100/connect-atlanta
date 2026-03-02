from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import routes
from routes.events import router as events_router, gallery_router
from routes.forms import router as forms_router

# Import database initialization
from database import init_database

app = FastAPI(
    title="Beats on the Beltline API",
    description="Backend API for event management and Cloudinary gallery integration",
    version="2.0.0"
)

# Add CORS middleware
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(events_router)
app.include_router(gallery_router)
app.include_router(forms_router)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on application startup"""
    try:
        init_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")

@app.get("/")
def read_root():
    return {
        "message": "Beats on the Beltline API",
        "service": "FastAPI Backend",
        "database": "PostgreSQL",
        "cloudinary": "enabled",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "events": "/api/events",
            "forms": "/api/forms",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint for container monitoring."""
    try:
        # Test database connection based on database type
        db_url = config("DATABASE_URL", default="")
        
        if not db_url:
            return {
                "status": "healthy",
                "database": "no_database_configured",
                "service": "connect"
            }
        
        db_status = "unknown"
        
        if "postgresql" == "postgresql":
            try:
                import psycopg2
                conn = psycopg2.connect(db_url)
                conn.close()
                db_status = "connected"
            except ImportError:
                db_status = "psycopg2_not_installed"
            except Exception:
                db_status = "connection_failed"
                
        elif "postgresql" == "mysql":
            try:
                import pymysql
                # Parse MySQL URL manually for simple connection test
                # Format: mysql://user:pass@host:port/database
                if db_url.startswith("mysql://"):
                    url_part = db_url[8:]  # Remove mysql://
                    if "@" in url_part:
                        auth_part, host_part = url_part.split("@", 1)
                        if ":" in auth_part:
                            user, password = auth_part.split(":", 1)
                        else:
                            user, password = auth_part, ""
                        
                        if "/" in host_part:
                            host_port, database = host_part.split("/", 1)
                        else:
                            host_port, database = host_part, ""
                        
                        if ":" in host_port:
                            host, port = host_port.split(":", 1)
                            port = int(port)
                        else:
                            host, port = host_port, 3306
                        
                        conn = pymysql.connect(
                            host=host,
                            port=port,
                            user=user,
                            password=password,
                            database=database
                        )
                        conn.close()
                        db_status = "connected"
            except ImportError:
                db_status = "pymysql_not_installed"
            except Exception:
                db_status = "connection_failed"
                
        elif "postgresql" == "sqlite":
            try:
                import sqlite3
                # Extract SQLite file path from URL
                if db_url.startswith("sqlite:///"):
                    db_file = db_url[10:]  # Remove sqlite:///
                    conn = sqlite3.connect(db_file)
                    conn.close()
                    db_status = "connected"
            except Exception:
                db_status = "connection_failed"
        
        return {
            "status": "healthy" if db_status == "connected" else "degraded",
            "database": db_status,
            "service": "connect",
            "database_type": "postgresql"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "database": "health_check_failed",
            "service": "connect",
            "error": str(e)
        }

# Additional API endpoints
@app.get("/api/v1/")
def api_root():
    return {
        "message": "Welcome to connect API",
        "version": "v1",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/api/v1/items")
def get_items():
    """Get list of items (sample endpoint)."""
    return {
        "items": [
            {"id": 1, "name": "Sample Item 1", "description": "This is a sample item"},
            {"id": 2, "name": "Sample Item 2", "description": "Another sample item"}
        ],
        "total": 2
    }

@app.post("/api/v1/items")
def create_item(item: dict):
    """Create a new item (sample endpoint)."""
    return {
        "message": "Item created successfully",
        "item": item,
        "id": 123
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
