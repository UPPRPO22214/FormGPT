from typing import Optional

from pydantic import BaseModel, Field

from schemas.questions import QuestionSchema


# TODO: add examples and fields for swagger docs

class FormSchema(BaseModel):
    title: str = Field(..., description="Form title")
    questions: list[QuestionSchema] = Field(..., description="List of questions")

    class Config:
        from_attributes = True


class FormGenerationSchema(BaseModel):
    topic: str = Field(..., description="Topic of the form")
    questions_count: Optional[int] = Field(None, description="Question count", examples=[1, 2])
    target_audience: Optional[str] = Field(None, description="Target audience", examples=["Students", "Teachers"])

    class Config:
        from_attributes = True


class FormImprovementSchema(BaseModel):
    prompt: Optional[str] = Field(None, description="Prompt for the form")
    form: FormSchema = Field(..., description="Form to improve")

    class Config:
        from_attributes = True
