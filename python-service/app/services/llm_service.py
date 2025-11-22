import json

import logging
from config import settings
from gigachat import GigaChat
from gigachat.models import Chat

from schemas.forms import FormSchema, FormGenerationSchema
from schemas.questions import QuestionSchema, AnswerType, QuestionImprovementSchema, QuestionGenerationSchema
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
            messages.append(MessageSchema(role="user", content=f"Целевая аудитория формы: {topic.target_audience}"))

        form = FormSchema(title="Form title", questions=[
            QuestionSchema(text="Вопрос", answer_type=AnswerType.MULTIPLE_CHOICE,
                           answer_options=["Ответ 1", "Ответ 2"]),
            QuestionSchema(text="Вопрос", answer_type=AnswerType.SINGLE_CHOICE, answer_options=["Ответ 1"])])

        messages.append(
            MessageSchema(role="user",
                          content="Ответ пришли в формате JSON:"
                                  f"ПРИМЕР ОТВЕТА: {form.model_dump_json()}"
                                  "Верни ТОЛЬКО JSON без каких-либо пояснений."
                                  f"Типы вопросов {[answer_type.value for answer_type in AnswerType]}"
                          ))
        return FormSchema(**self.generate_answer_by_messages(messages))

    def generate_question(self, topic: QuestionGenerationSchema) -> QuestionSchema:
        messages = [
            MessageSchema(role="system", content=self._system_prompt),
            MessageSchema(role="user", content=f"Придумай вопрос на тему:{topic.topic}")
        ]
        if topic.target_audience:
            messages.append(MessageSchema(role="user", content=f"Целевая аудитория вопроса: {topic.target_audience}"))

        question_example = QuestionSchema(text="Вопрос", answer_type=AnswerType.MULTIPLE_CHOICE,
                                          answer_options=["Ответ 1", "Ответ 2"])

        messages.append(
            MessageSchema(role="user",
                          content="Ответ пришли в формате JSON:"
                                  f"ПРИМЕР ОТВЕТА: {question_example.model_dump_json()}"
                                  "Верни ТОЛЬКО JSON без каких-либо пояснений."
                                  f"Типы вопросов {[answer_type.value for answer_type in AnswerType]}"
                          ))
        return QuestionSchema(**self.generate_answer_by_messages(messages))

    def improve_question(self, question_improvement_schema: QuestionImprovementSchema) -> QuestionSchema:
        messages = [
            MessageSchema(role="system", content=self._system_prompt),
            MessageSchema(role="user", content=f"Вот мой вопрос:{question_improvement_schema.text}")
        ]
        if question_improvement_schema.answer_options:
            messages.append(MessageSchema(role="user",
                                          content=f"Вот варианты ответов:{question_improvement_schema.answer_options}"))
        if question_improvement_schema.answer_type:
            messages.append(
                MessageSchema(role="user", content=f"Вот тип ответа:{question_improvement_schema.answer_type}"))

        if question_improvement_schema.prompt:
            messages.append(
                MessageSchema(role="user", content=f"{question_improvement_schema.prompt}"))
        else:
            messages.append(MessageSchema(role="user",
                                          content="Улучши мой вопрос, возможно надо поменять тип вопроса или варианты ответов."))

        question_example = QuestionSchema(text="Вопрос", answer_type=AnswerType.MULTIPLE_CHOICE,
                                          answer_options=["Ответ 1", "Ответ 2"])

        messages.append(
            MessageSchema(role="user",
                          content="Ответ пришли в формате JSON:"
                                  f"ПРИМЕР ОТВЕТА: {question_example.model_dump_json()}"
                                  "Верни ТОЛЬКО JSON без каких-либо пояснений."
                                  f"Типы вопросов {[answer_type.value for answer_type in AnswerType]}"
                          ))
        return QuestionSchema(**self.generate_answer_by_messages(messages))

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
