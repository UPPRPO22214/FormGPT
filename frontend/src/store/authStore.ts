import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest } from '../types/user';
import { authApi, userApi } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.TOKEN),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(credentials);
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      set({ token: response.token, isAuthenticated: true });
      await get().loadUser();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка входа. Проверьте данные.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.register(data);
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      set({ token: response.token, isAuthenticated: true });
      await get().loadUser();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка регистрации. Email может быть уже занят.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  loadUser: async () => {
    try {
      const token = get().token;
      if (!token) return;
      
      const user = await userApi.getProfile();
      set({ user });
    } catch (error: any) {
      // Если ошибка 401, токен невалиден - очищаем состояние
      if (error.response?.status === 401) {
        get().logout();
      }
    }
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await userApi.updateProfile(data);
      set({ user: updatedUser });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка обновления профиля.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (data: ChangePasswordRequest) => {
    try {
      set({ isLoading: true, error: null });
      await userApi.changePassword(data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка смены пароля. Проверьте старый пароль.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error: string | null) => set({ error }),
}));

