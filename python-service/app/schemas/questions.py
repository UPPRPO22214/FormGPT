from enum import Enum

from pydantic import BaseModel


class AnswerType(Enum):
    multiple_choice = "multiple_choice"
    single_choice = "single_choice"


class QuestionSchema(BaseModel):
    id: int
    form_id: int
    answer_type: AnswerType
    title: str
    answer_options: list[str]

    class Config:
        from_attributes = True
