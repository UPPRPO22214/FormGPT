from abc import ABC, abstractmethod

from schemas.forms import FormGenerationSchema, FormSchema


class LLMServiceInterface(ABC):
    @abstractmethod
    def create_form(self, topic: FormGenerationSchema) -> FormSchema:
        raise NotImplementedError

    @abstractmethod
    def generate_question(self, topic: FormGenerationSchema):
        raise NotImplementedError
