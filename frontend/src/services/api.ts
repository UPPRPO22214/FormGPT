import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  User,
} from '../types/user';
import {
  Survey,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  GPTAnalysis,
  SurveyAnswerRequest,
  Question,
  SurveyAnalytics,
} from '../types/survey';
import {
  transformSurveyFromBackend,
  transformCreateSurveyRequestToBackend,
  transformSurveyAnswerRequestToBackend,
  transformQuestionFromBackend,
} from '../utils/apiTransformers';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      // Логируем для отладки (можно убрать в продакшене)
      if (config.url?.includes('generate-questions')) {
        console.log('Отправка запроса на генерацию вопросов с токеном:', {
          url: config.url,
          hasToken: !!token,
          tokenLength: token.length,
        });
      }
    } else {
      console.warn('Токен не найден в localStorage для запроса:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок 401 и 403
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      
      // Детальное логирование для отладки
      console.error('Ошибка аутентификации:', {
        status: error.response?.status,
        url: url,
        isAuthEndpoint,
        responseData: error.response?.data,
        hasToken: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
      });
      
      // Не делаем редирект для ошибок логина/регистрации - это ошибки самих операций, а не проблемы с токеном
      // Редирект нужен только для ошибок авторизации при запросах к защищенным ресурсам
      if (!isAuthEndpoint) {
        // Для 403 не всегда нужно сразу перенаправлять - может быть проблема с правами доступа
        // Удаляем токен только если это точно проблема с токеном (401 или 403 с сообщением об истекшем токене)
        if (error.response?.status === 401) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          // Для 403 проверяем, не является ли это ошибкой доступа к ресурсу (например, опрос принадлежит другому пользователю)
          // В этом случае не перенаправляем, а позволяем компоненту обработать ошибку
          const errorMessage = error.response?.data;
          const isTokenError = typeof errorMessage === 'string' && 
            (errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('expired'));
          
          if (isTokenError) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            window.location.href = '/login';
          }
          // Иначе позволяем компоненту обработать ошибку (например, показать сообщение пользователю)
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
};

export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<User>('/users/me', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put('/users/me/password', data);
  },
};

/**
 * Преобразует surveyId в integer для запросов к API
 * Бэкенд ожидает integer в путях, но может возвращать UUID в ответах
 */
const normalizeSurveyId = (id: string | number | undefined): string => {
  if (!id) throw new Error('Survey ID is required');
  // Если это число или строка-число, используем как есть
  if (typeof id === 'number') return String(id);
  // Пытаемся преобразовать в число, если это возможно
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    return String(numId);
  }
  // Если это UUID или другой формат, возвращаем как есть
  return String(id);
};

export const surveyApi = {
  getAll: async (): Promise<Survey[]> => {
    const response = await api.get<any[]>('/surveys');
    return response.data.map(transformSurveyFromBackend);
  },

  getById: async (id: string): Promise<Survey> => {
    const normalizedId = normalizeSurveyId(id);
    const response = await api.get<any>(`/surveys/${normalizedId}`);
    return transformSurveyFromBackend(response.data);
  },

  create: async (data: CreateSurveyRequest): Promise<Survey> => {
    const backendData = transformCreateSurveyRequestToBackend(data);
    const response = await api.post<any>('/surveys', backendData);
    return transformSurveyFromBackend(response.data);
  },

  update: async (id: string, data: UpdateSurveyRequest): Promise<Survey> => {
    const normalizedId = normalizeSurveyId(id);
    const backendData = transformCreateSurveyRequestToBackend({
      title: data.title || '',
      description: data.description || '',
      questions: data.questions || [],
    });
    const response = await api.put<any>(`/surveys/${normalizedId}`, backendData);
    return transformSurveyFromBackend(response.data);
  },

  delete: async (id: string): Promise<void> => {
    const normalizedId = normalizeSurveyId(id);
    await api.delete(`/surveys/${normalizedId}`);
  },

  analyze: async (id: string, survey: Survey): Promise<GPTAnalysis> => {
    // Для /gpt/surveys/{surveyId}/analyze используется UUID (string) согласно OpenAPI
    // Используем survey.id если он есть, иначе id из параметра
    const surveyId = survey.id || id;
    // Не преобразуем в число для этого эндпоинта, так как ожидается UUID
    const response = await api.post<GPTAnalysis>(`/gpt/surveys/${surveyId}/analyze`, survey);
    return response.data;
  },

  submitAnswers: async (surveyId: string, data: SurveyAnswerRequest): Promise<{ success: boolean }> => {
    const normalizedId = normalizeSurveyId(surveyId);
    const backendData = transformSurveyAnswerRequestToBackend(data);
    console.log('Submitting to backend:', {
      url: `/surveys/${normalizedId}/answers`,
      data: backendData
    });
    try {
      const response = await api.post<{ success: boolean }>(`/surveys/${normalizedId}/answers`, backendData);
      console.log('Backend response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Backend error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      });
      throw error;
    }
  },

  getAnalytics: async (surveyId: string, includeGPT: boolean = false): Promise<SurveyAnalytics> => {
    const normalizedId = normalizeSurveyId(surveyId);
    const response = await api.get<SurveyAnalytics>(`/surveys/${normalizedId}/analytics`, {
      params: { includeGPT }
    });
    return response.data;
  },

  improveQuestion: async (questionId: string, prompt?: string): Promise<Question> => {
    const normalizedId = normalizeSurveyId(questionId);
    // Согласно OpenAPI: requestBody необязательный, можно отправить пустой объект или объект с prompt
    const requestBody = prompt ? { prompt } : {};
    const response = await api.put<any>(`/gpt/questions/${normalizedId}/edit`, requestBody);
    // Преобразуем ответ бэкенда в формат фронтенда
    return transformQuestionFromBackend(response.data);
  },

  generateQuestions: async (surveyId: string, count: number, prompt?: string): Promise<Question[]> => {
    const normalizedId = normalizeSurveyId(surveyId);
    // Согласно OpenAPI: count обязательный (1-10), promt необязательный (обратите внимание на опечатку "promt" в спецификации)
    const requestBody: { count: number; promt?: string } = { count };
    if (prompt) {
      requestBody.promt = prompt;
    }
    
    console.log('Генерация вопросов:', {
      surveyId,
      normalizedId,
      count,
      hasPrompt: !!prompt,
      url: `/gpt/surveys/${normalizedId}/generate-questions`,
    });
    
    try {
      const response = await api.post<any[]>(`/gpt/surveys/${normalizedId}/generate-questions`, requestBody);
      return response.data.map(transformQuestionFromBackend);
    } catch (error: any) {
      console.error('Ошибка при генерации вопросов:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        surveyId,
        normalizedId,
      });
      throw error;
    }
  },
};

export default api;

