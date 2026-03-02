# connect

A modern FastAPI backend with postgresql database integration.

## Features

- 🚀 **FastAPI** - Modern, fast web framework for building APIs
- 🗃️ **Postgresql** - Robust database integration
- 🔐 **Authentication** - JWT-based authentication system
- 📚 **Auto Documentation** - Interactive API docs with Swagger/OpenAPI
- 🧪 **Testing** - Comprehensive test suite with pytest
- 🐳 **Docker** - Production-ready containerization
- 📊 **Monitoring** - Health checks and metrics

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and configuration.

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations

```bash
python -c "
import asyncio
from models import create_tables, seed_sample_data
import os

async def setup():
    await create_tables(os.environ['DATABASE_URL'])
    await seed_sample_data(os.environ['DATABASE_URL'])

asyncio.run(setup())
"
```

### 4. Start Development Server

```bash
uvicorn main:app --reload
```

The API will be available at:
- **Application**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Docker Deployment

### Build and run with Docker:

```bash
docker build -t connect .
docker run -p 8000:8000 --env-file .env connect
```

### Or use Docker Compose:

```bash
docker-compose up --build
```

## API Endpoints

### Core Endpoints
- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation
- `GET /api/v1/` - API root

### Items CRUD
- `GET /api/v1/items` - List items (with pagination)
- `POST /api/v1/items` - Create new item
- `GET /api/v1/items/{id}` - Get specific item
- `PUT /api/v1/items/{id}` - Update item
- `DELETE /api/v1/items/{id}` - Delete item






## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
```

### Type Checking

```bash
mypy .
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | Required |
| `SECRET_KEY` | JWT secret key | Required |
| `DEBUG` | Enable debug mode | `false` |
| `ENVIRONMENT` | Deployment environment | `production` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `WORKERS` | Number of worker processes | `4` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

## Project Structure

```
connect/
├── main.py              # FastAPI application entry point
├── models.py            # Database models and schema
├── routers/             # API route definitions
│   ├── __init__.py
│   └── api.py          # Main API routes
├── requirements.txt     # Python dependencies
├── .env.example        # Environment template
├── .dockerignore       # Docker ignore rules
├── Dockerfile          # Docker configuration
├── start.sh           # Startup script
└── README.md          # This file
```

## License

This project is licensed under the MIT License.
