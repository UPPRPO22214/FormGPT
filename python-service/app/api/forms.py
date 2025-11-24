from fastapi import APIRouter

from dependencies import LLMServiceDep
from schemas.forms import FormGenerationSchema, FormSchema
from services.llm_service import LLMService

router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)


# TODO: add comments for swagger
@router.post("/create")
async def create(generation_model: FormGenerationSchema, service: LLMServiceDep) -> FormSchema:
    return service.create_form(generation_model)
