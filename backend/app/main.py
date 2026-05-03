import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import engine, Base
from app.middleware.cors import setup_cors
from app.routes import health, tasks, settings, sync, migration
from app.limiter import limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("schedule-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables on startup."""
    # Ensure the data directory exists for SQLite
    db_url = os.getenv("DATABASE_URL", "sqlite:///./data/schedule.db")
    if "sqlite" in db_url:
        db_path = db_url.replace("sqlite:///", "")
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)

    Base.metadata.create_all(bind=engine)
    logger.info("Application started")
    yield
    logger.info("Application stopped")


app = FastAPI(
    title="Schedule API",
    description="Backend API for the Schedule task management application",
    version="1.0.0",
    lifespan=lifespan,
)

# 速率限制器：基于客户端 IP 地址进行限流
app.state.limiter = limiter

# 注册 429 速率限制异常处理器
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with user-friendly messages."""
    errors = exc.errors()
    details = []
    for err in errors:
        field = ".".join(str(loc) for loc in err["loc"][1:])  # skip 'body'/'query' prefix
        msg = err["msg"]
        details.append(f"{field}: {msg}" if field else msg)

    logger.warning(f"Validation error on {request.url}: {details}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "message": "输入验证失败",
            "error": "VALIDATION_ERROR",
            "code": 422,
            "details": details,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler to prevent leaking internal details."""
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "message": "服务器内部错误，请稍后重试",
            "error": "INTERNAL_SERVER_ERROR",
            "code": 500,
        },
    )


# Setup CORS
setup_cors(app)

# Register routers
app.include_router(health.router)
app.include_router(tasks.router)
app.include_router(settings.router)
app.include_router(sync.router)
app.include_router(migration.router)
