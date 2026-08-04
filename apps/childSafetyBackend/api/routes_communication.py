from fastapi import APIRouter
from child_safety_core.domain import SecureMessage

router = APIRouter(prefix="/v1", tags=["communication"])


@router.post("/communication/messages", response_model=SecureMessage)
async def send_secure_message(message: SecureMessage) -> SecureMessage:
    return message
