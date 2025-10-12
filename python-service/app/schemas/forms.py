from pydantic import BaseModel
from questions import QuestionSchema


class FormSchema(BaseModel):
    id: int
    title: str
    author_id: int
    questions: list[QuestionSchema]

    class Config:
        from_attributes = True
