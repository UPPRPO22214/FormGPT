import json

import logging
from config import settings
from gigachat import GigaChat
from gigachat.models import Chat

from schemas.forms import FormSchema, FormGenerationSchema
from schemas.questions import QuestionSchema, AnswerType
from schemas.utils import MessageSchema
from services.llm_service_interface import LLMServiceInterface

logger = logging.getLogger(__name__)


class LLMService(LLMServiceInterface):

    def __init__(self):
        self._client = GigaChat(verify_ssl_certs=False, credentials=settings.GIGACHAT_CREDENTIALS)

        self._system_prompt = "You are a helpful assistant for creating google forms."

    def create_form(self, topic: FormGenerationSchema) -> FormSchema:
        messages = [
            MessageSchema(role="system", content=self._system_prompt),
            MessageSchema(role="user", content=f"Придумай форму на тему:{topic.topic}")
        ]
        if topic.questions_count:
            messages.append(MessageSchema(role="user", content=f"Сделай {topic.questions_count} вопросов"))
        if topic.target_audience:
            messages.append(MessageSchema(role="user", content=f"Целевая аудитория: {topic.target_audience}"))
        form = FormSchema(title="Ntvf njgbrf", questions=[
            QuestionSchema(text="Вопрос", answer_type=AnswerType.MULTIPLE_CHOICE,
                           answer_options=["Ответ 1", "Ответ 2"]),
            QuestionSchema(text="Вопрос", answer_type=AnswerType.SINGLE_CHOICE, answer_options=["Ответ 1"])])

        messages.append(
            MessageSchema(role="user",
                          content="Ответ пришли в формате JSON:"
                                  f"ПРИМЕР ОТВЕТА: {form.model_dump_json()}"
                                  "Верни ТОЛЬКО JSON без каких-либо пояснений."
                          ))
        return FormSchema(**self.generate_answer_by_messages(messages))

    def generate_question(self, topic: FormGenerationSchema):
        pass

    def generate_answer_by_messages(self, messages: list[MessageSchema]):
        chat = Chat(
            messages=messages,
            model=settings.GIGACHAT_MODEL,
        )
        answer = self._client.chat(chat)
        choice = answer.choices[0]
        content = choice.message.content

        content = content.replace("'", '"')
        content = content.strip()
        logger.info(content)
        print(content)
        return json.loads(content)
