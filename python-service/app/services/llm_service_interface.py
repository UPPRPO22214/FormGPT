from abc import ABC, abstractmethod

from schemas.forms import FormGenerationSchema


class LLMServiceInterface(ABC):
    @abstractmethod
    def create_form(self, topic: FormGenerationSchema):
        raise NotImplementedError
    @abstractmethod
    def generate_question(self, topic: FormGenerationSchema):
        raise NotImplementedError