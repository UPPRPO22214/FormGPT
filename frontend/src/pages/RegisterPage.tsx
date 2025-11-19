import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { RegisterRequest } from '../types/user';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, isLoading, error, setError } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => setError(null);
  }, [setError]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
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
          <h2 className="text-2xl font-semibold text-gray-700">Регистрация</h2>
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
              placeholder="Минимум 6 символов"
              {...register('password', {
                required: 'Пароль обязателен',
                minLength: {
                  value: 6,
                  message: 'Пароль должен быть не менее 6 символов',
                },
              })}
              error={errors.password?.message}
            />
            
            <Input
              label="Подтвердите пароль"
              type="password"
              placeholder="Повторите пароль"
              {...register('confirmPassword', {
                required: 'Подтверждение пароля обязательно',
                validate: (value) =>
                  value === password || 'Пароли не совпадают',
              })}
              error={errors.confirmPassword?.message}
            />
            
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Зарегистрироваться
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Войти
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

