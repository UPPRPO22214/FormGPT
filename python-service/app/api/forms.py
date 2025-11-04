from fastapi import APIRouter

from schemas.forms import FormGenerationSchema
from services.llm_service import LLMService

router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)

@router.post("/create")
async def create(generation_model: FormGenerationSchema):
    service = LLMService()
    return service.create_form(generation_model)
