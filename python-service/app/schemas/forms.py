from typing import Optional

from pydantic import BaseModel

from schemas.questions import QuestionSchema


class FormSchema(BaseModel):
    title: str
    questions: list[QuestionSchema]

    class Config:
        from_attributes = True


class FormGenerationSchema(BaseModel):
    topic: str
    questions_count: Optional[int]
    target_audience: Optional[str]

    class Config:
        from_attributes = True
