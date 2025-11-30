import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { UpdateProfileRequest, ChangePasswordRequest } from '../types/user';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    user,
    logout,
    updateProfile,
    changePassword,
    loadUser,
    isLoading,
    error,
    setError,
  } = useAuthStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const profileForm = useForm<UpdateProfileRequest>({
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
    },
  });

  const passwordForm = useForm<ChangePasswordRequest & { confirmPassword: string }>();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      profileForm.reset({
        email: user.email,
        name: user.name || '',
      });
    }
  }, [user, profileForm]);

  useEffect(() => {
    return () => {
      setError(null);
      setSuccessMessage(null);
    };
  }, [setError]);

  const handleProfileSubmit = async (data: UpdateProfileRequest) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await updateProfile(data);
      setSuccessMessage('Профиль успешно обновлен');
      setIsEditingProfile(false);
    } catch (err) {
      // Ошибка уже обработана в store
    }
  };

  const handlePasswordSubmit = async (data: ChangePasswordRequest & { confirmPassword: string }) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      if (data.newPassword !== data.confirmPassword) {
        setError('Новые пароли не совпадают');
        return;
      }

      const { confirmPassword, ...passwordData } = data;
      await changePassword(passwordData);
      setSuccessMessage('Пароль успешно изменен');
      setIsChangingPassword(false);
      passwordForm.reset();
    } catch (err) {
      // Ошибка уже обработана в store
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 pb-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Заголовок страницы */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Профиль</h1>
          <p className="text-gray-600">Управляйте своими данными и настройками</p>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-slide-up">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-slide-up">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Информация о пользователе */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name || 'Пользователь'}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white/60 backdrop-blur-xl rounded-xl border border-white/30">
                <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">
                  Email
                </label>
                <p className="text-gray-900 font-medium">{user.email}</p>
              </div>
              {user.name && (
                <div className="p-4 bg-white/60 backdrop-blur-xl rounded-xl border border-white/30">
                  <label className="block text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">
                    Имя
                  </label>
                  <p className="text-gray-900 font-medium">{user.name}</p>
                </div>
              )}
              <div className="p-4 bg-white/60 backdrop-blur-xl rounded-xl border border-white/30">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Дата регистрации
                </label>
                <p className="text-gray-900 font-medium">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setSuccessMessage(null);
                setError(null);
              }}
              className="w-full md:w-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isEditingProfile ? 'Отменить редактирование' : 'Редактировать профиль'}
            </Button>
          </div>
        </Card>

        {/* Форма редактирования профиля */}
        {isEditingProfile && (
          <Card className="animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактирование профиля
            </h2>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
              <Input
                label="Email"
                type="email"
                {...profileForm.register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Некорректный email',
                  },
                })}
                error={profileForm.formState.errors.email?.message}
              />

              <Input
                label="Имя"
                type="text"
                {...profileForm.register('name')}
                error={profileForm.formState.errors.name?.message}
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" isLoading={isLoading} className="flex-1 sm:flex-none">
                  Сохранить изменения
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditingProfile(false);
                    profileForm.reset({
                      email: user.email,
                      name: user.name || '',
                    });
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Форма смены пароля */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Смена пароля
          </h2>
          {!isChangingPassword ? (
            <Button
              variant="secondary"
              onClick={() => {
                setIsChangingPassword(true);
                setSuccessMessage(null);
                setError(null);
              }}
              className="w-full sm:w-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Изменить пароль
            </Button>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6 animate-slide-up">
              <Input
                label="Текущий пароль"
                type="password"
                {...passwordForm.register('oldPassword', {
                  required: 'Текущий пароль обязателен',
                })}
                error={passwordForm.formState.errors.oldPassword?.message}
              />

              <Input
                label="Новый пароль"
                type="password"
                {...passwordForm.register('newPassword', {
                  required: 'Новый пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Пароль должен быть не менее 6 символов',
                  },
                })}
                error={passwordForm.formState.errors.newPassword?.message}
              />

              <Input
                label="Подтвердите новый пароль"
                type="password"
                {...passwordForm.register('confirmPassword', {
                  required: 'Подтверждение пароля обязательно',
                })}
                error={passwordForm.formState.errors.confirmPassword?.message}
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" isLoading={isLoading} className="flex-1 sm:flex-none">
                  Изменить пароль
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false);
                    passwordForm.reset();
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

