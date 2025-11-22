from typing import Annotated

from fastapi import Depends


from services.llm_service import LLMService
from services.llm_service_interface import LLMServiceInterface

LLMServiceDep = Annotated[LLMServiceInterface, Depends(LLMService)]