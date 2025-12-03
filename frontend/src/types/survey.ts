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
  userId: number;
  answers: Answer[];
}

