from typing import Optional

from pydantic import BaseModel

from schemas.questions import QuestionSchema

#TODO: add examples and fields for swagger docs

class FormSchema(BaseModel):
    title: str
    questions: list[QuestionSchema]

    class Config:
        from_attributes = True


class FormGenerationSchema(BaseModel):
    topic: str
    questions_count: Optional[int] = None
    target_audience: Optional[str] = None

    class Config:
        from_attributes = True
