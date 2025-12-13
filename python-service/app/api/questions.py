from fastapi import APIRouter

from dependencies import LLMServiceDep
from schemas.questions import QuestionGenerationSchema, QuestionSchema, QuestionImprovementSchema, \
    MultipleQuestionGenerationSchema

router = APIRouter(
    prefix="/questions",
    tags=["Questions"],
)


@router.post("/generate")
async def generate_question(form: QuestionGenerationSchema,
                            service: LLMServiceDep) -> QuestionSchema:
    return service.generate_question(form)


@router.post("/generate_multiple")
async def generate_multiple_questions(form: MultipleQuestionGenerationSchema,
                                      service: LLMServiceDep) -> list[QuestionSchema]:
    return service.generate_multiple_questions(form)


@router.post("/improve")
async def improve_question(form: QuestionImprovementSchema, service: LLMServiceDep) -> QuestionSchema:
    return service.improve_question(form)
