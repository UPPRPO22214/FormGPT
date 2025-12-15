import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useLocation } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Question, QuestionType, CreateSurveyRequest } from '../types/survey';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { SortableQuestionItem } from '../components/surveys/SortableQuestionItem';
import { QuestionItem } from '../components/surveys/QuestionItem';
import { surveyApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const generateId = () => String(Date.now() + Math.random());

const createDefaultQuestion = (order: number): Question => ({
  id: generateId(),
  type: 'text',
  text: '',
  required: false,
  order,
});

export const CreateSurveyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isGPTMode = location.pathname.includes('/create/gpt');
  const [questions, setQuestions] = useState<Question[]>([
    createDefaultQuestion(0),
  ]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [improveQuestionModal, setImproveQuestionModal] = useState<{ isOpen: boolean; questionId: string | null }>({ isOpen: false, questionId: null });
  const [improvePrompt, setImprovePrompt] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [generateQuestionsModal, setGenerateQuestionsModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSurveyId, setSavedSurveyId] = useState<string | null>(null);
  const [createWithGPTModal, setCreateWithGPTModal] = useState(false);
  const [gptDescription, setGptDescription] = useState('');
  const [gptTargetAudience, setGptTargetAudience] = useState('');
  const [gptQuestionCount, setGptQuestionCount] = useState(5);
  const [isCreatingWithGPT, setIsCreatingWithGPT] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSurveyRequest>();

  useEffect(() => {
    if (isEditMode && id) {
      loadSurvey(id);
    } else if (isGPTMode) {
      // Если это режим создания с GPT, показываем модальное окно для ввода параметров
      setCreateWithGPTModal(true);
    }
  }, [id, isEditMode, isGPTMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeQuestion = useMemo(
    () => questions.find((q) => q.id === activeId),
    [questions, activeId]
  );

  const loadSurvey = async (surveyId: string) => {
    try {
      setIsLoading(true);
      const survey = await surveyApi.getById(surveyId);
      
      // Заполняем форму данными опроса
      reset({
        title: survey.title,
        description: survey.description || '',
      });
      
      // Преобразуем вопросы из бэкенда в формат фронтенда
      const loadedQuestions = survey.questions.map((q, index) => ({
        ...q,
        order: index,
      }));
      
      setQuestions(loadedQuestions.length > 0 ? loadedQuestions : [createDefaultQuestion(0)]);
      
      // Сохраняем ID опроса для использования в ИИ функциях
      if (survey.id) {
        setSavedSurveyId(survey.id);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки опроса:', error);
      setSaveError(
        error.response?.data?.message || 
        error.message || 
        'Не удалось загрузить опрос для редактирования.'
      );
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
      setIsSaved(false);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = createDefaultQuestion(questions.length);
    setQuestions([...questions, newQuestion]);
    setIsSaved(false);
    setValidationErrors(new Set());
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
    setIsSaved(false);
    // Убираем ошибку валидации для этого вопроса
    setValidationErrors((prev) => {
      const newSet = new Set(prev);
      newSet.delete(updatedQuestion.id);
      return newSet;
    });
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length === 1) {
      alert('Нельзя удалить последний вопрос. Опрос должен содержать хотя бы один вопрос.');
      return;
    }
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      return filtered.map((item, index) => ({
        ...item,
        order: index,
      }));
    });
    setIsSaved(false);
    setValidationErrors((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleDuplicateQuestion = (id: string) => {
    const questionToDuplicate = questions.find((q) => q.id === id);
    if (!questionToDuplicate) return;

    const duplicatedQuestion: Question = {
      ...questionToDuplicate,
      id: generateId(),
      text: `${questionToDuplicate.text} (копия)`,
      order: questions.length,
    };

    setQuestions([...questions, duplicatedQuestion]);
    setIsSaved(false);
  };

  const validateQuestions = (): boolean => {
    const errors = new Set<string>();

    questions.forEach((q) => {
      if (!q.text.trim()) {
        errors.add(q.id);
      }
      if (
        (q.type === 'single_choice' || q.type === 'multiple_choice') &&
        (!q.options || q.options.length < 2 || q.options.some((opt) => !opt.text.trim()))
      ) {
        errors.add(q.id);
      }
    });

    setValidationErrors(errors);
    return errors.size === 0;
  };

  const onSubmit = async (data: CreateSurveyRequest) => {
    setIsSaving(true);
    setIsSaved(false);
    setSaveError(null);

    if (!validateQuestions()) {
      setIsSaving(false);
      return;
    }

    const surveyData: CreateSurveyRequest = {
      title: data.title,
      description: data.description,
      questions: questions.map((q) => ({
        ...q,
        options:
          q.type === 'single_choice' || q.type === 'multiple_choice'
            ? q.options?.filter((opt) => opt.text.trim())
            : undefined,
      })),
    };

    try {
      const savedSurvey = isEditMode && id
        ? await surveyApi.update(id, surveyData)
        : await surveyApi.create(surveyData);
      console.log(`Опрос успешно ${isEditMode ? 'обновлен' : 'создан'}:`, savedSurvey);
      setIsSaved(true);
      
      // Сохраняем ID опроса для использования в ИИ функциях
      if (savedSurvey.id) {
        setSavedSurveyId(savedSurvey.id);
        
        // Обновляем ID вопросов на основе ответа от сервера
        // Это необходимо для работы функции улучшения вопросов
        if (savedSurvey.questions && savedSurvey.questions.length === questions.length) {
          const updatedQuestions = questions.map((q, index) => {
            const savedQ = savedSurvey.questions[index];
            if (savedQ && savedQ.id) {
              return { ...q, id: savedQ.id };
            }
            return q;
          });
          setQuestions(updatedQuestions);
        }
      }
      
      // Не перенаправляем на главную страницу, пользователь остается на текущей
    } catch (error: any) {
      console.error('Ошибка сохранения опроса:', error);
      setSaveError(
        error.response?.data?.message || 
        error.message || 
        'Не удалось сохранить опрос. Попробуйте еще раз.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setIsClearModalOpen(true);
  };

  const handleConfirmClear = () => {
    setQuestions([createDefaultQuestion(0)]);
    setIsSaved(false);
    setValidationErrors(new Set());
    reset();
    setIsClearModalOpen(false);
  };

  const validQuestionsCount = useMemo(
    () => questions.filter((q) => q.text.trim()).length,
    [questions]
  );

  const handleImproveQuestion = (questionId: string) => {
    setImproveQuestionModal({ isOpen: true, questionId });
    setImprovePrompt('');
  };

  const handleConfirmImprove = async () => {
    if (!improveQuestionModal.questionId || !savedSurveyId) {
      alert('Сначала сохраните опрос, чтобы использовать функцию улучшения вопросов');
      setImproveQuestionModal({ isOpen: false, questionId: null });
      return;
    }

    setIsImproving(true);
    try {
      const improvedQuestion = await surveyApi.improveQuestion(
        improveQuestionModal.questionId,
        improvePrompt || undefined
      );
      
      // Обновляем вопрос в списке
      setQuestions((prev) =>
        prev.map((q) => (q.id === improveQuestionModal.questionId ? { ...improvedQuestion, order: q.order } : q))
      );
      
      setIsSaved(false);
      setImproveQuestionModal({ isOpen: false, questionId: null });
      setImprovePrompt('');
    } catch (error: any) {
      console.error('Ошибка улучшения вопроса:', error);
      alert(error.response?.data?.message || 'Не удалось улучшить вопрос. Попробуйте еще раз.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleCreateWithGPT = async () => {
    if (!gptDescription.trim()) {
      alert('Пожалуйста, введите описание опроса');
      return;
    }

    setIsCreatingWithGPT(true);
    try {
      const createdSurvey = await surveyApi.createWithGPT(
        gptDescription,
        gptQuestionCount,
        gptTargetAudience || undefined
      );
      
      // Загружаем созданный опрос для редактирования
      if (createdSurvey.id) {
        await loadSurvey(createdSurvey.id);
        setCreateWithGPTModal(false);
        setGptDescription('');
        setGptTargetAudience('');
        setGptQuestionCount(5);
        // Переходим в режим редактирования
        navigate(`/surveys/${createdSurvey.id}/edit`, { replace: true });
      }
    } catch (error: any) {
      console.error('Ошибка создания опроса с GPT:', error);
      
      let errorMessage = 'Не удалось создать опрос. Попробуйте еще раз.';
      
      if (error.response?.status === 403) {
        errorMessage = 'Доступ запрещен. Возможно, токен истек или у вас нет прав доступа. Пожалуйста, войдите заново.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Сессия истекла. Пожалуйста, войдите заново.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsCreatingWithGPT(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!savedSurveyId) {
      alert('Сначала сохраните опрос, чтобы использовать функцию генерации вопросов');
      setGenerateQuestionsModal(false);
      return;
    }

    setIsGenerating(true);
    try {
      const generatedQuestions = await surveyApi.generateQuestions(
        savedSurveyId,
        questionCount,
        generatePrompt || undefined
      );
      
      // Добавляем сгенерированные вопросы в список
      const maxOrder = Math.max(...questions.map(q => q.order), -1);
      const newQuestions = generatedQuestions.map((q, index) => ({
        ...q,
        order: maxOrder + 1 + index,
      }));
      
      setQuestions([...questions, ...newQuestions]);
      setIsSaved(false);
      setGenerateQuestionsModal(false);
      setGeneratePrompt('');
      setQuestionCount(3);
    } catch (error: any) {
      console.error('Ошибка генерации вопросов:', error);
      
      let errorMessage = 'Не удалось сгенерировать вопросы. Попробуйте еще раз.';
      
      if (error.response?.status === 403) {
        errorMessage = 'Доступ запрещен. Возможно, токен истек или у вас нет прав доступа к этому опросу. Пожалуйста, войдите заново.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Сессия истекла. Пожалуйста, войдите заново.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8 pb-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="mb-6 p-5 bg-white rounded-xl shadow-lg flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-gray-700">Загрузка опроса...</span>
          </div>
        )}

        {/* Заголовок */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                {isEditMode ? 'Редактирование опроса' : 'Создание опроса'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isEditMode 
                  ? 'Отредактируйте опрос, измените вопросы и их параметры'
                  : 'Создайте новый опрос, добавьте вопросы и настройте их параметры'}
              </p>
            </div>
          </div>
        </div>

        {/* Уведомление о сохранении */}
        {isSaved && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-100 border-l-4 border-green-500 rounded-xl shadow-lg flex items-center gap-4 animate-slide-up">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-green-900 font-bold text-lg">Форма сохранена</p>
              <p className="text-green-700 text-sm">Опрос успешно сохранен</p>
            </div>
          </div>
        )}

        {/* Уведомление об ошибке */}
        {saveError && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-lg flex items-center gap-4 animate-slide-up">
            <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-red-900 font-bold text-lg">Ошибка сохранения</p>
              <p className="text-red-700 text-sm">{saveError}</p>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="text-red-700 hover:text-red-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Основная информация об опросе */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Основная информация</h2>
              </div>
              <Input
                label="Название опроса"
                {...register('title', {
                  required: 'Название опроса обязательно',
                })}
                error={errors.title?.message}
                placeholder="Например: Опрос удовлетворенности клиентов"
                className="text-lg"
              />

              <Textarea
                label="Описание опроса"
                {...register('description')}
                rows={4}
                placeholder="Опишите цель опроса и что вы хотите узнать..."
              />
            </div>
          </Card>

          {/* Вопросы */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Вопросы</h2>
                </div>
                <div className="flex flex-wrap items-center gap-4 ml-13">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Перетаскивайте для изменения порядка
                  </p>
                  <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                    validQuestionsCount === questions.length && questions.length > 0
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {validQuestionsCount} / {questions.length} заполнено
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setGenerateQuestionsModal(true)}
                  className="shadow-md bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                  disabled={!savedSurveyId}
                  title={!savedSurveyId ? 'Сначала сохраните опрос' : 'Сгенерировать вопросы с помощью ИИ'}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Сгенерировать вопросы
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddQuestion}
                  className="shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить вопрос
                </Button>
              </div>
            </div>

            {questions.length === 0 ? (
              <Card className="text-center py-16 border-2 border-dashed border-white/30 bg-white/40 backdrop-blur-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-bold text-lg mb-2">Нет вопросов</p>
                <p className="text-gray-500 text-sm mb-6">Добавьте первый вопрос, чтобы начать создание опроса</p>
                <Button type="button" variant="secondary" onClick={handleAddQuestion}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить вопрос
                </Button>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className={validationErrors.has(question.id) ? 'ring-2 ring-red-500 rounded-lg' : ''}
                      >
                        <SortableQuestionItem
                          question={question}
                          index={index}
                          onUpdate={handleUpdateQuestion}
                          onDelete={handleDeleteQuestion}
                          onDuplicate={handleDuplicateQuestion}
                          onImprove={handleImproveQuestion}
                          canImprove={!!savedSurveyId}
                        />
                        {validationErrors.has(question.id) && (
                          <p className="mt-2 ml-4 text-sm text-red-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Заполните все обязательные поля
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeQuestion ? (
                    <div className="opacity-90">
                      <QuestionItem
                        question={activeQuestion}
                        index={questions.findIndex((q) => q.id === activeQuestion.id)}
                        onUpdate={() => {}}
                        onDelete={() => {}}
                        onDuplicate={() => {}}
                        isDragging={true}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-5">
            <div className="max-w-5xl mx-auto bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl p-6 flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClear}
                className="w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Очистить
              </Button>
              <Button
                type="submit"
                isLoading={isSaving}
                className="w-full sm:w-auto min-w-[180px]"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditMode ? 'Сохранить изменения' : 'Сохранить опрос'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Модальное окно подтверждения очистки */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Очистить форму?"
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
        confirmText="Очистить"
        cancelText="Отмена"
      >
        <p className="text-base leading-relaxed">
          Вы уверены, что хотите очистить форму? Все данные будут потеряны и восстановить их будет невозможно.
        </p>
      </Modal>

      {/* Модальное окно улучшения вопроса */}
      <Modal
        isOpen={improveQuestionModal.isOpen}
        onClose={() => setImproveQuestionModal({ isOpen: false, questionId: null })}
        title="Улучшить вопрос с помощью ИИ"
        onConfirm={handleConfirmImprove}
        onCancel={() => setImproveQuestionModal({ isOpen: false, questionId: null })}
        confirmText={isImproving ? "Улучшение..." : "Улучшить"}
        cancelText="Отмена"
        confirmDisabled={isImproving}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ИИ поможет улучшить формулировку вопроса, варианты ответов или структуру.
          </p>
          <Textarea
            label="Дополнительные инструкции (необязательно)"
            value={improvePrompt}
            onChange={(e) => setImprovePrompt(e.target.value)}
            rows={4}
            placeholder="Например: Сделай вопрос более понятным для новичков, добавь больше вариантов ответа..."
          />
          {isImproving && (
            <div className="flex items-center gap-3 text-primary-600">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">ИИ обрабатывает запрос...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Модальное окно создания опроса с GPT */}
      <Modal
        isOpen={createWithGPTModal}
        onClose={() => {
          setCreateWithGPTModal(false);
          if (isGPTMode) {
            navigate('/surveys/create');
          }
        }}
        title="Создать опрос с помощью ИИ"
        onConfirm={handleCreateWithGPT}
        onCancel={() => {
          setCreateWithGPTModal(false);
          if (isGPTMode) {
            navigate('/surveys/create');
          }
        }}
        confirmText={isCreatingWithGPT ? "Создание..." : "Создать"}
        cancelText="Отмена"
        confirmDisabled={isCreatingWithGPT || !gptDescription.trim()}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ИИ создаст полный опрос с указанным количеством вопросов на указанную тему.
          </p>
          <Textarea
            label="Описание темы опроса *"
            value={gptDescription}
            onChange={(e) => setGptDescription(e.target.value)}
            rows={4}
            placeholder="Например: Опрос об удовлетворенности сотрудников условиями работы в офисе"
            required
          />
          <Input
            label="Целевая аудитория (необязательно)"
            value={gptTargetAudience}
            onChange={(e) => setGptTargetAudience(e.target.value)}
            placeholder="Например: офисные сотрудники, студенты..."
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Количество вопросов
            </label>
            <Input
              type="number"
              value={gptQuestionCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 1;
                setGptQuestionCount(Math.max(1, Math.min(20, count)));
              }}
              min={1}
              max={20}
              className="w-full"
            />
          </div>
          {isCreatingWithGPT && (
            <div className="flex items-center gap-3 text-primary-600">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">ИИ создает опрос...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Модальное окно генерации вопросов */}
      <Modal
        isOpen={generateQuestionsModal}
        onClose={() => setGenerateQuestionsModal(false)}
        title="Сгенерировать вопросы с помощью ИИ"
        onConfirm={handleGenerateQuestions}
        onCancel={() => setGenerateQuestionsModal(false)}
        confirmText={isGenerating ? "Генерация..." : "Сгенерировать"}
        cancelText="Отмена"
        confirmDisabled={isGenerating}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ИИ создаст вопросы на основе темы и описания вашего опроса.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Количество вопросов
            </label>
            <Input
              type="number"
              value={questionCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 1;
                setQuestionCount(Math.max(1, Math.min(10, count)));
              }}
              min={1}
              max={10}
              className="w-full"
            />
          </div>
          <Textarea
            label="Дополнительные инструкции (необязательно)"
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            rows={4}
            placeholder="Например: Добавь вопросы о работе в команде, сделай акцент на обратную связь..."
          />
          {isGenerating && (
            <div className="flex items-center gap-3 text-primary-600">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">ИИ генерирует вопросы...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
