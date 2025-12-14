import { Question, Survey, CreateSurveyRequest, Answer, SurveyAnswerRequest } from '../types/survey';

/**
 * Преобразует тип вопроса из формата фронтенда в формат бэкенда
 */
export const transformQuestionTypeToBackend = (type: string): string => {
  switch (type) {
    case 'single_choice':
      return 'single-choice';
    case 'multiple_choice':
      return 'multiple-choice';
    case 'scale':
      return 'scale-1-10';
    case 'text':
      return 'text';
    default:
      return type;
  }
};

/**
 * Преобразует тип вопроса из формата бэкенда в формат фронтенда
 */
export const transformQuestionTypeFromBackend = (type: string): string => {
  switch (type) {
    case 'single-choice':
      return 'single_choice';
    case 'multiple-choice':
      return 'multiple_choice';
    case 'scale-1-10':
      return 'scale';
    case 'text':
      return 'text';
    default:
      return type;
  }
};

/**
 * Преобразует вопрос из формата фронтенда в формат бэкенда для создания/обновления
 */
export const transformQuestionToBackend = (question: Question) => {
  return {
    id: question.id && !isNaN(Number(question.id)) ? Number(question.id) : undefined,
    title: question.text,
    type: transformQuestionTypeToBackend(question.type),
    options: question.options?.map(opt => opt.text) || undefined,
  };
};

/**
 * Преобразует вопрос из формата бэкенда в формат фронтенда
 */
export const transformQuestionFromBackend = (question: any, index: number = 0): Question => {
  return {
    id: String(question.id),
    type: transformQuestionTypeFromBackend(question.type) as any,
    text: question.title,
    required: false, // Бэкенд не возвращает required, по умолчанию false
    options: question.options?.map((opt: string, idx: number) => ({
      id: String(idx),
      text: opt,
    })),
    min: question.type === 'scale-1-10' ? 1 : undefined,
    max: question.type === 'scale-1-10' ? 10 : undefined,
    order: index,
  };
};

/**
 * Преобразует опрос из формата бэкенда в формат фронтенда
 * Поддерживает как SurveyResponseDTO, так и SurveyWithAnswersResponseDTO
 */
export const transformSurveyFromBackend = (survey: any): Survey => {
  return {
    id: String(survey.id),
    title: survey.title,
    description: survey.description || '',
    questions: survey.questions?.map((q: any, index: number) => {
      const question = transformQuestionFromBackend(q, index);
      // Если есть userAnswer (из SurveyWithAnswersResponseDTO), сохраняем его
      // Бэкенд возвращает текст опций, а не ID
      if (q.userAnswer !== undefined && q.userAnswer !== null && q.userAnswer !== '') {
        // Для multiple-choice ответы приходят через ';' как текст опций
        if (question.type === 'multiple_choice') {
          question.userAnswer = q.userAnswer.split(';').map((text: string) => text.trim()).filter((text: string) => text.length > 0);
        } else {
          question.userAnswer = q.userAnswer;
        }
      }
      return question;
    }) || [],
    createdAt: survey.createdAt,
    updatedAt: survey.updatedAt,
  };
};

/**
 * Преобразует запрос на создание опроса из формата фронтенда в формат бэкенда
 */
export const transformCreateSurveyRequestToBackend = (request: CreateSurveyRequest) => {
  return {
    title: request.title,
    description: request.description || '',
    questions: request.questions.map(transformQuestionToBackend),
  };
};

/**
 * Преобразует ответ из формата фронтенда в формат бэкенда
 */
export const transformAnswerToBackend = (answer: Answer) => {
  const questionId = Number(answer.questionId);
  if (isNaN(questionId)) {
    console.error('Invalid questionId:', answer.questionId);
    throw new Error(`Invalid questionId: ${answer.questionId}`);
  }
  return {
    questionId: questionId,
    value: answer.value,
  };
};

/**
 * Преобразует запрос на отправку ответов из формата фронтенда в формат бэкенда
 */
export const transformSurveyAnswerRequestToBackend = (request: SurveyAnswerRequest) => {
  const transformedAnswers = request.answers.map(transformAnswerToBackend);
  console.log('Transformed answers:', transformedAnswers);
  return {
    answers: transformedAnswers,
  };
};

