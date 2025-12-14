import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi } from '../services/api';
import { Survey, Question, Answer, SurveyAnswerRequest } from '../types/survey';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { useAuthStore } from '../store/authStore';

export const TakeSurveyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (id) {
      loadSurvey();
    }
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadSurvey = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await surveyApi.getById(id);
      setSurvey(data);
      
      // Заполняем ответы из userAnswer, если они есть
      // Бэкенд возвращает текст опций в userAnswer, а не ID
      const initialAnswers: Record<string, string | string[]> = {};
      data.questions.forEach((question) => {
        if (question.userAnswer !== undefined && question.userAnswer !== null && question.userAnswer !== '') {
          if (question.type === 'multiple_choice') {
            // Для multiple-choice userAnswer может быть массивом строк или строкой с разделителем ';'
            let answerTexts: string[] = [];
            if (Array.isArray(question.userAnswer)) {
              answerTexts = question.userAnswer;
            } else if (typeof question.userAnswer === 'string') {
              // Бэкенд может вернуть строку с разделителем ';'
              answerTexts = question.userAnswer.split(';').map(t => t.trim()).filter(t => t.length > 0);
            }
            
            // Находим ID опций по тексту
            const optionIds = answerTexts
              .map((text: string) => {
                const option = question.options?.find(opt => opt.text === text || opt.text.trim() === text.trim());
                return option?.id;
              })
              .filter((id): id is string => id !== undefined);
            
            if (optionIds.length > 0) {
              initialAnswers[question.id] = optionIds;
            }
          } else if (question.type === 'single_choice' && typeof question.userAnswer === 'string') {
            // Для single-choice нужно найти ID опции по тексту
            const userAnswerText = question.userAnswer;
            const option = question.options?.find(
              opt => opt.text === userAnswerText || opt.text.trim() === userAnswerText.trim()
            );
            if (option) {
              initialAnswers[question.id] = option.id;
            }
          } else {
            // Для text и scale просто используем значение
            initialAnswers[question.id] = question.userAnswer as string;
          }
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Ошибка загрузки опроса:', error);
      alert('Не удалось загрузить опрос');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    // Очищаем ошибку для этого вопроса при изменении ответа
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateAnswers = (): boolean => {
    if (!survey) return false;
    const newErrors: Record<string, string> = {};

    survey.questions.forEach((question) => {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && answer.trim() === '')) {
          newErrors[question.id] = 'Это поле обязательно для заполнения';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!survey || !id) return;

    // Проверяем авторизацию перед отправкой
    const token = localStorage.getItem('auth_token');
    if (!token || !user) {
      alert('Вы не авторизованы. Пожалуйста, войдите в систему.');
      navigate('/login');
      return;
    }

    if (!validateAnswers()) {
      // Прокручиваем к первому вопросу с ошибкой
      const firstErrorId = Object.keys(errors)[0];
      if (firstErrorId) {
        const element = document.getElementById(`question-${firstErrorId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Фильтруем только заполненные ответы
      const answerArray: Answer[] = Object.entries(answers)
        .filter(([questionId, value]) => {
          // Пропускаем пустые ответы
          if (!value) return false;
          if (Array.isArray(value) && value.length === 0) return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          return true;
        })
        .map(([questionId, value]) => {
        const question = survey.questions.find(q => q.id === questionId);
        if (!question) {
          console.error('Question not found for questionId:', questionId);
          throw new Error(`Question not found: ${questionId}`);
        }
        
        let answerValue: string;
        
        if (Array.isArray(value)) {
          // Для multiple-choice преобразуем ID опций в текст опций
          const optionTexts = value
            .map((optionId) => {
              const option = question.options?.find(opt => opt.id === optionId);
              return option?.text;
            })
            .filter((text): text is string => text !== undefined);
          answerValue = optionTexts.join(';'); // Бэкенд ожидает текст опций через ';'
        } else if (question.type === 'single_choice') {
          // Для single-choice преобразуем ID опции в текст опции
          const option = question.options?.find(opt => opt.id === value);
          if (!option) {
            console.error('Option not found for value:', value, 'in question:', question.id);
            throw new Error(`Option not found for question ${question.id}`);
          }
          answerValue = option.text;
        } else {
          // Для text и scale используем значение как есть
          answerValue = value;
        }
        
        return {
          questionId,
          value: answerValue,
        };
      });

      console.log('Submitting answers:', answerArray);
      console.log('Survey ID:', id);

      const request: SurveyAnswerRequest = {
        surveyId: id,
        userId: user?.id || '', // Не используется в теле запроса, но оставляем для совместимости типов
        answers: answerArray,
      };

      await surveyApi.submitAnswers(id, request);
      setSubmitSuccess(true);
      
      // Через 2 секунды перенаправляем на главную страницу
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Ошибка отправки ответов:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      let errorMessage = 'Не удалось отправить ответы. Попробуйте еще раз.';
      
      // Специальная обработка ошибки 403 (Forbidden)
      if (error?.response?.status === 403) {
        errorMessage = 'Доступ запрещен. Возможно, вы не авторизованы или ваша сессия истекла. Пожалуйста, войдите в систему заново.';
        // Interceptor уже перенаправит на страницу входа, но показываем сообщение
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error?.response?.status === 401) {
        errorMessage = 'Вы не авторизованы. Пожалуйста, войдите в систему.';
        // Interceptor уже перенаправит на страницу входа
      } else if (error?.response?.data?.message) {
        // Пытаемся извлечь детальное сообщение об ошибке
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Если это ошибка валидации, показываем более детальное сообщение
      if (error?.response?.status === 400 && error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const questionAnswer = answers[question.id];
    const error = errors[question.id];

    return (
      <div
        key={question.id}
        id={`question-${question.id}`}
        className="mb-8 scroll-mt-24"
      >
        <Card className="p-6">
          <div className="mb-4">
            <label className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </span>
              {question.text}
              {question.required && (
                <span className="text-red-500 ml-1" title="Обязательный вопрос">
                  *
                </span>
              )}
            </label>
          </div>

          {question.type === 'single_choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-white/30 bg-white/40 hover:bg-white/60 hover:border-primary-300 cursor-pointer transition-all duration-200 group"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={questionAnswer === option.id}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="flex-1 text-gray-700 group-hover:text-gray-900 font-medium">
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => {
                const selectedAnswers = Array.isArray(questionAnswer) ? questionAnswer : [];
                const isChecked = selectedAnswers.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-white/30 bg-white/40 hover:bg-white/60 hover:border-primary-300 cursor-pointer transition-all duration-200 group"
                  >
                    <input
                      type="checkbox"
                      value={option.id}
                      checked={isChecked}
                      onChange={(e) => {
                        const currentAnswers = Array.isArray(questionAnswer) ? questionAnswer : [];
                        if (e.target.checked) {
                          handleAnswerChange(question.id, [...currentAnswers, option.id]);
                        } else {
                          handleAnswerChange(question.id, currentAnswers.filter((id) => id !== option.id));
                        }
                      }}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 focus:ring-2 rounded cursor-pointer"
                    />
                    <span className="flex-1 text-gray-700 group-hover:text-gray-900 font-medium">
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'text' && (
            <Textarea
              value={typeof questionAnswer === 'string' ? questionAnswer : ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Введите ваш ответ..."
              rows={4}
              error={error}
              className="mt-2"
            />
          )}

          {question.type === 'scale' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {question.min || 1}
                </span>
                <span className="text-lg font-bold text-primary-600">
                  {typeof questionAnswer === 'string' && questionAnswer ? questionAnswer : question.min || 1}
                </span>
                <span className="text-sm text-gray-600">
                  {question.max || 10}
                </span>
              </div>
              <input
                type="range"
                min={question.min || 1}
                max={question.max || 10}
                value={typeof questionAnswer === 'string' && questionAnswer ? parseInt(questionAnswer) : question.min || 1}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((parseInt(typeof questionAnswer === 'string' && questionAnswer ? questionAnswer : String(question.min || 1)) - (question.min || 1)) / ((question.max || 10) - (question.min || 1))) * 100}%, #e5e7eb ${((parseInt(typeof questionAnswer === 'string' && questionAnswer ? questionAnswer : String(question.min || 1)) - (question.min || 1)) / ((question.max || 10) - (question.min || 1))) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Минимум</span>
                <span>Максимум</span>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
            </div>
          )}

          {error && question.type !== 'text' && question.type !== 'scale' && (
            <p className="mt-3 text-sm text-red-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Загрузка опроса...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Опрос не найден</h2>
          <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
        </Card>
      </div>
    );
  }

  const sortedQuestions = [...survey.questions].sort((a, b) => a.order - b.order);
  const answeredCount = Object.keys(answers).filter(
    (key) => {
      const answer = answers[key];
      if (!answer) return false;
      if (Array.isArray(answer)) return answer.length > 0;
      if (typeof answer === 'string') return answer.trim() !== '';
      return true; // для чисел и других типов
    }
  ).length;
  const totalQuestions = survey.questions.length;

  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 pb-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Фиксированный тонкий прогресс-бар вверху */}
      <div
        className={`fixed top-16 left-0 right-0 z-[60] transition-all duration-300 ${
          isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-lg border-b border-white/30 shadow-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-700 truncate flex-1 mr-4">
                {survey.title}
              </span>
              <span className="text-xs font-semibold text-primary-600 whitespace-nowrap">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-1 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Заголовок опроса */}
        <Card className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-3">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {survey.description}
              </p>
            )}
          </div>

          {/* Прогресс */}
          <div
            className={`mt-6 pt-6 border-t border-white/30 transition-all duration-300 ${
              isScrolled ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Прогресс заполнения
              </span>
              <span className="text-sm font-semibold text-primary-600">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Сообщение об успешной отправке */}
        {submitSuccess && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 text-green-700">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Ответы успешно отправлены!</p>
                <p className="text-sm">Вы будете перенаправлены на главную страницу...</p>
              </div>
            </div>
          </Card>
        )}

        {/* Вопросы */}
        <div className="space-y-6">
          {sortedQuestions.map((question, index) => renderQuestion(question, index))}
        </div>

        {/* Кнопка отправки */}
        <Card className="mt-8 sticky bottom-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {Object.keys(errors).length > 0 && (
                <span className="text-red-600 font-semibold">
                  Пожалуйста, заполните все обязательные поля
                </span>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || submitSuccess}
              isLoading={isSubmitting}
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
            >
              {submitSuccess ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Отправлено
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Отправить ответы
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

