import json

import logging
from config import settings
from gigachat import GigaChat
from gigachat.models import Chat

from schemas.forms import FormSchema, FormGenerationSchema, FormImprovementSchema, SurveyAnalysisRequestSchema
from schemas.questions import QuestionSchema, AnswerType, QuestionImprovementSchema, QuestionGenerationSchema, \
    MultipleQuestionGenerationSchema
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
        return FormSchema(**self._generate_json_answer_by_messages(messages))

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
        return QuestionSchema(**self._generate_json_answer_by_messages(messages))

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
        return QuestionSchema(**self._generate_json_answer_by_messages(messages))

    def improve_form(self, form_schema: FormImprovementSchema) -> FormSchema:
        messages = [
            MessageSchema(role="system", content=self._system_prompt),
            MessageSchema(role="user", content=f"Вот моя форма:{form_schema.model_dump_json()}")
        ]

        if form_schema.prompt:
            messages.append(
                MessageSchema(role="user", content=f"{form_schema.prompt}"))
        else:
            messages.append(MessageSchema(role="user",
                                          content="Улучши мою форму, возможно надо поменять тип вопроса или варианты ответов."))

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
        return FormSchema(**self._generate_json_answer_by_messages(messages))

    def generate_multiple_questions(self, multiple_question_generation: MultipleQuestionGenerationSchema) -> list[
        QuestionSchema]:
        messages = [
            MessageSchema(role="system", content=self._system_prompt)
        ]
        if multiple_question_generation.topic:
            messages.append(MessageSchema(role="user",
                                          content=f"Тема опроса f{multiple_question_generation.topic}"))
        if multiple_question_generation.target_audience:
            messages.append(
                MessageSchema(role="user",
                              content=f"Целевая аудитория опроса: {multiple_question_generation.target_audience}"))

        if multiple_question_generation.previous_questions:
            messages.append(
                MessageSchema(role="user",
                              content=f"Вопросы должны совпадать по теме с предыдущими: {[question.model_dump_json() for question in multiple_question_generation.previous_questions]}"))

        messages.append(
            MessageSchema(role="user",
                          content=f"Сгененрируй {multiple_question_generation.questions_count} дополнительных вопросов"))

        question_example = QuestionSchema(text="Вопрос", answer_type=AnswerType.MULTIPLE_CHOICE,
                                          answer_options=["Ответ 1", "Ответ 2"])

        messages.append(
            MessageSchema(role="user",
                          content="Ответ пришли в СТРОГО В формате JSON:"
                                  f"ПРИМЕР ОТВЕТА: [{question_example.model_dump_json()},{question_example.model_dump_json()}]"
                                  "Верни ТОЛЬКО JSON без каких-либо пояснений."
                                  f"Типы вопросов {[answer_type.value for answer_type in AnswerType]}"
                          ))
        return [QuestionSchema(**question) for question in self._generate_json_answer_by_messages(messages)]

    def analyze_results(self, topic: SurveyAnalysisRequestSchema) -> str:
        messages = [
            MessageSchema(role="system", content=self._system_prompt)
        ]

        messages.append(MessageSchema(role="user",
                                      content=f"Вот тебе информация об опросе:{topic.survey.model_dump_json()}"))

        messages.append(MessageSchema(role="user",
                                      content=f"Вот имнформация о прохождении людьми каждого вопроса:{[question.model_dump_json() for question in topic.questions]}"))
        messages.append(MessageSchema(role="user",
                                      content=f"Проанализируй результаты опросы и напиши подробную аналитику по данному опросу"))

        return self._generate_answer_by_messages(messages)

    def _generate_answer_by_messages(self, messages: list[MessageSchema]):
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
        return content

    def _generate_json_answer_by_messages(self, messages: list[MessageSchema]):
        for i in range(3):
            try:
                return json.loads(self._generate_answer_by_messages(messages))
            except ValueError:
                logger.info("Couldn't decode, next try")
                continue
