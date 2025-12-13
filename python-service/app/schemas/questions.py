from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class AnswerType(Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SINGLE_CHOICE = "single_choice"
    NUMERIC = "numeric"
    TEXT = "text"


class QuestionSchema(BaseModel):
    text: str = Field(..., description="Question text")
    answer_type: AnswerType = Field(..., description="Type of the answer", examples=[answer for answer in AnswerType])
    answer_options: Optional[list[str]] = Field(None, description="Answer options")

    class Config:
        from_attributes = True  # In case from_attributes is True Pydantic automatically takes attributes from the orm model after conversation


class QuestionGenerationSchema(BaseModel):
    topic: str = Field(..., description="Topic of the question")
    target_audience: Optional[str] = Field(
        None,
        description="Target audience for the question (optional)",
        example="students"
    )


class MultipleQuestionGenerationSchema(BaseModel):
    topic: Optional[str] = Field(None, description="Topic of the question")
    target_audience: Optional[str] = Field(
        None,
        description="Target audience for the question (optional)",
        example="students"
    )
    questions_count: Optional[int] = Field(1, description="Question count", examples=[1, 2])
    previous_questions: Optional[list[QuestionSchema]] = Field(None,
                                                               description="Previous questions to get the context")


class QuestionImprovementSchema(BaseModel):
    text: str = Field(..., description="Question to improve")
    answer_type: Optional[AnswerType] = Field(None, description="Type of the answer",
                                              examples=[answer for answer in AnswerType])
    answer_options: Optional[list[str]] = Field(None, description="Answer options")
    prompt: Optional[str] = Field(None, description="Prompt for the question improvement")
