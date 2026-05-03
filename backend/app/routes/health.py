from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"success": True, "data": {"status": "ok"}}
