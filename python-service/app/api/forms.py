from fastapi import APIRouter

from dependencies import LLMServiceDep
from schemas.forms import FormGenerationSchema, FormSchema, FormImprovementSchema, SurveyAnalysisRequestSchema
from services.llm_service import LLMService

router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)


# TODO: add comments for swagger
@router.post("/create")
async def create(generation_model: FormGenerationSchema, service: LLMServiceDep) -> FormSchema:
    return service.create_form(generation_model)


@router.post("/improve")
async def improve(generation_model: FormImprovementSchema, service: LLMServiceDep) -> FormSchema:
    return service.improve_form(generation_model)

@router.post("/analyize_results")
async def analyze_results(analytics_model: SurveyAnalysisRequestSchema, service: LLMServiceDep) -> str:
    return service.analyze_results(analytics_model)