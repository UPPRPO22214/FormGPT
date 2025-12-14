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
} from '../types/survey';
import {
  transformSurveyFromBackend,
  transformCreateSurveyRequestToBackend,
  transformSurveyAnswerRequestToBackend,
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
      // Удаляем токен и перенаправляем на страницу входа
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      // Для 403 показываем более понятное сообщение
      if (error.response?.status === 403) {
        console.error('Доступ запрещен. Возможно, токен истек или у вас нет прав доступа.');
      }
      window.location.href = '/login';
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
};

export default api;

