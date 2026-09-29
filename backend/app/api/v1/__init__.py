from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.visitors import router as visitors_router
from app.api.v1.visits import router as visits_router
from app.api.v1.passes import router as passes_router
from app.api.v1.gate import router as gate_router
from app.api.v1.checkpoints import router as checkpoints_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.reports import router as reports_router
from app.api.v1.settings import router as settings_router
from app.api.v1.audit import router as audit_router
from app.api.v1.ws import router as ws_router
from app.api.v1.visitor_portal import router as visitor_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(visitor_router, prefix="/visitor", tags=["Visitor Portal"])
api_router.include_router(patients_router, prefix="/patients", tags=["Patients"])
api_router.include_router(visitors_router, prefix="/visitors", tags=["Visitors"])
api_router.include_router(visits_router, prefix="/visits", tags=["Visits"])
api_router.include_router(passes_router, prefix="/passes", tags=["Passes"])
api_router.include_router(gate_router, prefix="/gate", tags=["Smart Gate Access"])
api_router.include_router(checkpoints_router, prefix="/checkpoints", tags=["Checkpoints"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts & Notifications"])
api_router.include_router(reports_router, prefix="/reports", tags=["Operational Reports"])
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])
api_router.include_router(audit_router, prefix="/audit-logs", tags=["Audit Log"])
api_router.include_router(ws_router, tags=["WebSockets"])
