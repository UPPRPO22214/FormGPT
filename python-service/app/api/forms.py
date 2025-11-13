from fastapi import APIRouter

from schemas.forms import FormGenerationSchema, FormSchema
from services.llm_service import LLMService

router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)


# TODO: add comments for swagger
@router.post("/create", response_model=FormSchema)
async def create(generation_model: FormGenerationSchema):
    service = LLMService()
    return service.create_form(generation_model)
