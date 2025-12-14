from abc import ABC, abstractmethod

from schemas.forms import FormGenerationSchema, FormSchema, FormImprovementSchema
from schemas.questions import QuestionSchema, QuestionGenerationSchema, QuestionImprovementSchema, \
    MultipleQuestionGenerationSchema


class LLMServiceInterface(ABC):
    @abstractmethod
    def create_form(self, topic: FormGenerationSchema) -> FormSchema:
        raise NotImplementedError

    @abstractmethod
    def improve_form(self, topic: FormImprovementSchema) -> FormSchema:
        raise NotImplementedError

    @abstractmethod
    def generate_question(self, topic: QuestionGenerationSchema) -> QuestionSchema:
        raise NotImplementedError

    @abstractmethod
    def improve_question(self, question_improvement_schema: QuestionImprovementSchema) -> QuestionSchema:
        raise NotImplementedError

    @abstractmethod
    def generate_multiple_questions(self, topic: MultipleQuestionGenerationSchema) -> list[QuestionSchema]:
        raise NotImplementedError