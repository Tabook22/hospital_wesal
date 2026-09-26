import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1 import api_router
from app.seeds.seed_data import seed_database
from app.services.timing_engine import evaluate_all_active_visits
from app.api.v1.ws import ws_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("wesal")

# Periodic background worker to check visit timings every 5 seconds
async def background_timing_checker():
    logger.info("Starting background timing checker for Sultan Qaboos Hospital...")
    while True:
        try:
            await asyncio.sleep(5)
            db = SessionLocal()
            try:
                updated_count = evaluate_all_active_visits(db)
                if updated_count > 0:
                    logger.info(f"Background timing check updated {updated_count} visits.")
                    await ws_manager.broadcast({
                        "type": "STATUS_REFRESH",
                        "updated_count": updated_count
                    })
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in background timing checker: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed demo database
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Verifying seed data...")
    seed_database()

    # Start background task
    timing_task = asyncio.create_task(background_timing_checker())
    yield
    # Shutdown
    timing_task.cancel()
    try:
        await timing_task
    except asyncio.CancelledError:
        pass
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart Hospital Visitor Management & Access Control Platform - Prototype for Sultan Qaboos Hospital",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "hospital": settings.HOSPITAL_NAME,
        "platform": "WESAL"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9900, reload=True)
