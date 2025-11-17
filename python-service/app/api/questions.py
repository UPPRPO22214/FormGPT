from fastapi import APIRouter

from schemas.questions import QuestionGenerationSchema
from services.llm_service import LLMService

router = APIRouter(
    prefix="/questions",
    tags=["Questions"],
)

@router.post("/")
async def generate_question(form: QuestionGenerationSchema):
    return LLMService().generate_question(form)
