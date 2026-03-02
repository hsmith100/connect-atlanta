#!/bin/bash

# FastAPI Startup Script
set -e

echo "🚀 Starting FastAPI Backend..."

# Wait for database
echo "⏳ Waiting for database..."
python -c "
import asyncio
import os
import sys
from urllib.parse import urlparse

async def check_db():
    try:
        db_url = os.environ.get('DATABASE_URL', '')
        if 'postgresql' in db_url:
            import asyncpg
            parsed = urlparse(db_url)
            conn = await asyncpg.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                database=parsed.path[1:],
                user=parsed.username,
                password=parsed.password
            )
            await conn.close()
        elif 'mysql' in db_url:
            import aiomysql
            parsed = urlparse(db_url)
            conn = await aiomysql.connect(
                host=parsed.hostname,
                port=parsed.port or 3306,
                user=parsed.username,
                password=parsed.password,
                db=parsed.path[1:]
            )
            conn.close()
        print('✅ Database connected')
        return True
    except Exception as e:
        print(f'❌ Database error: {e}')
        return False

async def wait_for_db():
    for i in range(30):
        if await check_db():
            return True
        await asyncio.sleep(1)
    return False

if not asyncio.run(wait_for_db()):
    sys.exit(1)
"

echo "🚀 Starting FastAPI application..."

# Start application
if [ "$ENVIRONMENT" = "development" ]; then
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
    gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
fi