from enum import Enum
from typing import Optional

from pydantic import BaseModel


class AnswerType(Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SINGLE_CHOICE = "single_choice"
    NUMERIC = "numeric"
    TEXT = "text"


class QuestionSchema(BaseModel):
    text: str
    answer_type: AnswerType
    answer_options: list[str]

    class Config:
        from_attributes = True

class QuestionGenerationSchema(BaseModel):
    topic: str
    target_audience: Optional[str]