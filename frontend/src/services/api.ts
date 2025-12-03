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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Удаляем токен и перенаправляем на страницу входа
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
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

export const surveyApi = {
  getAll: async (): Promise<Survey[]> => {
    const response = await api.get<Survey[]>('/surveys');
    return response.data;
  },

  getById: async (id: string): Promise<Survey> => {
    const response = await api.get<Survey>(`/surveys/${id}`);
    return response.data;
  },

  create: async (data: CreateSurveyRequest): Promise<Survey> => {
    const response = await api.post<Survey>('/surveys', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSurveyRequest): Promise<Survey> => {
    const response = await api.put<Survey>(`/surveys/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/surveys/${id}`);
  },

  analyze: async (id: string, survey: Survey): Promise<GPTAnalysis> => {
    const response = await api.post<GPTAnalysis>(`/gpt/surveys/${id}/analyze`, survey);
    return response.data;
  },

  submitAnswers: async (surveyId: string, data: SurveyAnswerRequest): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(`/surveys/${surveyId}/answers`, data);
    return response.data;
  },
};

export default api;

