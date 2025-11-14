from fastapi import APIRouter

from dependencies import LLMServiceDep
from schemas.questions import QuestionGenerationSchema, QuestionSchema
from services.llm_service import LLMService

router = APIRouter(
    prefix="/questions",
    tags=["Questions"],
)

@router.post("/generate")
async def generate_question(form: QuestionGenerationSchema, service: LLMServiceDep) -> QuestionSchema:
    return service.generate_question(form)

