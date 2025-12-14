export type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'scale';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: QuestionOption[]; // Для single_choice и multiple_choice
  min?: number; // Для scale
  max?: number; // Для scale
  order: number;
  userAnswer?: string | string[]; // Ответ пользователя (для отображения уже заполненных ответов)
}

export interface Survey {
  id?: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSurveyRequest {
  title: string;
  description: string;
  questions: Question[];
}

export interface UpdateSurveyRequest {
  title?: string;
  description?: string;
  questions?: Question[];
}

export interface GPTAnalysis {
  text: string;
  score: 'good' | 'average' | 'bad';
}

export interface Answer {
  questionId: string;
  value: string;
}

export interface SurveyAnswerRequest {
  surveyId: string | number;
  userId: string; // UUID из бэкенда
  answers: Answer[];
}

// Типы для статистики опросов
export interface ChoiceDistribution {
  options: string[];
  counts: number[];
  percentages: number[];
}

export interface ScaleDistribution {
  min: number;
  max: number;
  average: number;
  distribution: number[]; // Количество ответов для каждой оценки (1-10)
  median: number;
}

export interface TextAnalytics {
  totalAnswers: number;
  wordCloud: string[];
  sampleAnswers: string[];
}

export interface QuestionAnalytics {
  questionId: number;
  questionTitle: string;
  questionType: string;
  totalAnswers: number;
  answerDistribution: ChoiceDistribution | ScaleDistribution | TextAnalytics;
}

export interface SurveyAnalytics {
  surveyId: number;
  title: string;
  description: string;
  totalRespondents: number;
  completedCount: number;
  incompletedCount: number;
  questionsAnalytics: QuestionAnalytics[];
  gptAnalysis?: string | null;
}

