"""
Database connection and utility functions for PostgreSQL
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional
from contextlib import contextmanager


def get_database_url() -> str:
    """
    Get database URL from environment variables.
    Supports both individual components and full DATABASE_URL.
    """
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        return database_url
    
    # Build from individual components
    host = os.getenv("DATABASE_HOST", "db")
    port = os.getenv("DATABASE_PORT", "5432")
    database = os.getenv("DATABASE_NAME", "connect_db")
    user = os.getenv("DATABASE_USER", "connect_user")
    password = os.getenv("DATABASE_PASSWORD", "connect_password")
    
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"


def get_db_connection():
    """
    Create a new database connection.
    Returns a connection object with RealDictCursor for dictionary-like rows.
    
    Usage:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
    """
    database_url = get_database_url()
    conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    return conn


@contextmanager
def get_db_cursor():
    """
    Context manager for database operations.
    Automatically handles connection and cursor cleanup.
    
    Usage:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM events")
            results = cursor.fetchall()
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def execute_query(query: str, params: Optional[tuple] = None, fetch: str = "all"):
    """
    Execute a query and return results.
    
    Args:
        query: SQL query string
        params: Query parameters (optional)
        fetch: "all", "one", or "none"
    
    Returns:
        Query results based on fetch parameter
    """
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        
        if fetch == "all":
            return cursor.fetchall()
        elif fetch == "one":
            return cursor.fetchone()
        else:
            return None


def run_migrations():
    """
    Run all SQL migration files from the migrations directory.
    Executes files in alphabetical order.
    """
    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
    
    if not os.path.exists(migrations_dir):
        print("⚠️ Migrations directory not found")
        return
    
    # Get all .sql files and sort them
    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
    
    if not migration_files:
        print("ℹ️ No migration files found")
        return
    
    with get_db_cursor() as cursor:
        for migration_file in migration_files:
            migration_path = os.path.join(migrations_dir, migration_file)
            try:
                with open(migration_path, 'r') as f:
                    migration_sql = f.read()
                    cursor.execute(migration_sql)
                    print(f"✅ Executed migration: {migration_file}")
            except Exception as e:
                print(f"⚠️ Migration {migration_file} failed or already applied: {e}")


def init_database():
    """
    Initialize database tables if they don't exist.
    Creates the events table with all required fields.
    """
    with get_db_cursor() as cursor:
        # Create events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                location VARCHAR(255),
                description TEXT,
                flyer_url VARCHAR(500),
                attendees VARCHAR(50),
                artists VARCHAR(50),
                
                -- Cloudinary integration
                cloudinary_folder VARCHAR(255),
                gallery_enabled BOOLEAN DEFAULT false,
                photo_count INTEGER DEFAULT 0,
                video_count INTEGER DEFAULT 0,
                gallery_updated_at TIMESTAMP,
                
                -- Metadata
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CONSTRAINT unique_cloudinary_folder UNIQUE(cloudinary_folder)
            )
        """)
        
        # Create index for better query performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_gallery_enabled 
            ON events(gallery_enabled)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_date 
            ON events(date DESC)
        """)
        
        print("✅ Database tables initialized successfully")
        
    # Run migrations
    run_migrations()

