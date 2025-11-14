from abc import ABC, abstractmethod

from schemas.forms import FormGenerationSchema, FormSchema
from schemas.questions import QuestionSchema, QuestionGenerationSchema, QuestionImprovementSchema


class LLMServiceInterface(ABC):
    @abstractmethod
    def create_form(self, topic: FormGenerationSchema) -> FormSchema:
        raise NotImplementedError


    @abstractmethod
    def generate_question(self, topic: QuestionGenerationSchema) -> QuestionSchema:
        raise NotImplementedError

    @abstractmethod
    def improve_question(self, question_improvement_schema: QuestionImprovementSchema) -> QuestionSchema:
        raise NotImplementedError
