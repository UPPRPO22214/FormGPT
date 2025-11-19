import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LoginRequest } from '../types/user';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, setError } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Очищаем ошибку при размонтировании
    return () => setError(null);
  }, [setError]);

  const onSubmit = async (data: LoginRequest) => {
    try {
      setError(null);
      await login(data);
      navigate('/profile');
    } catch (err) {
      // Ошибка уже обработана в store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FormGPT</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Вход в систему</h2>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              {...register('email', {
                required: 'Email обязателен',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Некорректный email',
                },
              })}
              error={errors.email?.message}
            />
            
            <Input
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              {...register('password', {
                required: 'Пароль обязателен',
                minLength: {
                  value: 6,
                  message: 'Пароль должен быть не менее 6 символов',
                },
              })}
              error={errors.password?.message}
            />
            
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Войти
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Нет аккаунта?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

