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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
          <Button variant="secondary" onClick={handleLogout}>
            Выйти
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Информация о пользователе */}
        <Card title="Информация о пользователе">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {user.name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <p className="text-gray-900">{user.name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата регистрации
              </label>
              <p className="text-gray-600">
                {new Date(user.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setSuccessMessage(null);
                setError(null);
              }}
            >
              {isEditingProfile ? 'Отменить редактирование' : 'Редактировать профиль'}
            </Button>
          </div>
        </Card>

        {/* Форма редактирования профиля */}
        {isEditingProfile && (
          <Card title="Редактирование профиля">
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
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

              <div className="flex gap-4">
                <Button type="submit" isLoading={isLoading}>
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
                >
                  Отмена
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Форма смены пароля */}
        <Card title="Смена пароля">
          {!isChangingPassword ? (
            <Button
              variant="secondary"
              onClick={() => {
                setIsChangingPassword(true);
                setSuccessMessage(null);
                setError(null);
              }}
            >
              Изменить пароль
            </Button>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
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

              <div className="flex gap-4">
                <Button type="submit" isLoading={isLoading}>
                  Изменить пароль
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false);
                    passwordForm.reset();
                  }}
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

