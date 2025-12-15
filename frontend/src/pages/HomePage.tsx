import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { surveyApi } from '../services/api';
import { Survey, GPTAnalysis } from '../types/survey';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ContextMenu, ContextMenuItem } from '../components/ui/ContextMenu';
import { Modal } from '../components/ui/Modal';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; surveyId: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; surveyId: string | null }>({ isOpen: false, surveyId: null });
  const [analysisModal, setAnalysisModal] = useState<{ isOpen: boolean; analysis: GPTAnalysis | null }>({ isOpen: false, analysis: null });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setIsLoading(true);
      const data = await surveyApi.getAll();
      setSurveys(data);
    } catch (error) {
      console.error('Ошибка загрузки опросов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleContextMenu = (e: React.MouseEvent, surveyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, surveyId });
  };

  const handleDelete = async () => {
    if (!deleteModal.surveyId) return;
    try {
      await surveyApi.delete(deleteModal.surveyId);
      setSurveys(surveys.filter(s => s.id !== deleteModal.surveyId));
      setDeleteModal({ isOpen: false, surveyId: null });
    } catch (error) {
      console.error('Ошибка удаления опроса:', error);
      alert('Не удалось удалить опрос');
    }
  };

  const handleEdit = (surveyId: string) => {
    setContextMenu(null);
    navigate(`/surveys/${surveyId}/edit`);
  };

  const handleAnalyze = async (surveyId: string) => {
    setContextMenu(null);
    setIsAnalyzing(true);
    try {
      const survey = surveys.find(s => s.id === surveyId);
      if (!survey || !survey.id) {
        throw new Error('Опрос не найден');
      }
      const analysis = await surveyApi.analyze(survey.id, survey);
      setAnalysisModal({ isOpen: true, analysis });
    } catch (error) {
      console.error('Ошибка анализа опроса:', error);
      alert('Не удалось проанализировать опрос');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewAnalytics = (surveyId: string) => {
    setContextMenu(null);
    navigate(`/surveys/${surveyId}/analytics`);
  };

  const handleTakeSurvey = (surveyId: string) => {
    setContextMenu(null);
    navigate(`/surveys/${surveyId}`);
  };

  const getScoreLabel = (score: string) => {
    switch (score) {
      case 'good':
        return 'Хорошо';
      case 'average':
        return 'Средне';
      case 'bad':
        return 'Плохо';
      default:
        return score;
    }
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'average':
        return 'text-yellow-600 bg-yellow-50';
      case 'bad':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 pb-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Приветственный блок */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Добро пожаловать{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Создавайте опросы с помощью искусственного интеллекта и собирайте ценные данные от вашей аудитории
          </p>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:scale-[1.02] transition-transform">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Создать новый опрос</h3>
                <p className="text-gray-600 mb-4">
                  Используйте GPT помощника для быстрого создания профессиональных опросов
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="button" onClick={() => navigate('/surveys/create')} className="w-full sm:w-auto">
                    Создать опрос
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => navigate('/surveys/create/gpt')} 
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Создать с GPT
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:scale-[1.02] transition-transform">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Мои опросы</h3>
                <p className="text-gray-600 mb-4">
                  Управляйте своими опросами и просматривайте статистику
                </p>
                <div className="text-3xl font-bold text-primary-600">
                  {surveys.length}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Список опросов */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Мои опросы</h2>
            <Button type="button" onClick={() => navigate('/surveys/create')} size="sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Создать
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Загрузка опросов...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">У вас пока нет опросов</h3>
              <p className="text-gray-600 mb-6">Создайте свой первый опрос с помощью GPT помощника</p>
              <Button type="button" onClick={() => navigate('/surveys/create')}>
                Создать первый опрос
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  onContextMenu={(e) => survey.id && handleContextMenu(e, survey.id)}
                  className="relative"
                >
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      if (survey.id) {
                        handleContextMenu(e, survey.id);
                      }
                    }}
                    className="block p-6 bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 hover:border-primary-300 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {survey.title}
                      </h3>
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 group-hover:bg-primary-200 transition-colors">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    {survey.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {survey.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(survey.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {survey.questions?.length || 0} вопросов
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Контекстное меню */}
      {contextMenu && (
        <ContextMenu
          isOpen={true}
          onClose={() => setContextMenu(null)}
          x={contextMenu.x}
          y={contextMenu.y}
        >
          <ContextMenuItem
            onClick={() => handleEdit(contextMenu.surveyId)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Редактировать
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleAnalyze(contextMenu.surveyId)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            Проанализировать
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleTakeSurvey(contextMenu.surveyId)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Прохождение
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleViewAnalytics(contextMenu.surveyId)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            Статистика
          </ContextMenuItem>
          <div className="border-t border-gray-200 my-1"></div>
          <ContextMenuItem
            onClick={() => {
              setContextMenu(null);
              setDeleteModal({ isOpen: true, surveyId: contextMenu.surveyId });
            }}
            variant="danger"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            Удалить
          </ContextMenuItem>
        </ContextMenu>
      )}

      {/* Модальное окно подтверждения удаления */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, surveyId: null })}
        title="Удаление опроса"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, surveyId: null })}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      >
        <p>Вы уверены, что хотите удалить этот опрос? Это действие нельзя отменить.</p>
      </Modal>

      {/* Модальное окно результатов анализа */}
      <Modal
        isOpen={analysisModal.isOpen}
        onClose={() => setAnalysisModal({ isOpen: false, analysis: null })}
        title="Анализ опроса"
        onCancel={() => setAnalysisModal({ isOpen: false, analysis: null })}
        cancelText="Закрыть"
      >
        {isAnalyzing ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Анализ опроса...</p>
          </div>
        ) : analysisModal.analysis ? (
          <div className="space-y-4">
            <div className={`px-4 py-3 rounded-xl ${getScoreColor(analysisModal.analysis.score)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Оценка качества:</span>
                <span className="font-bold">{getScoreLabel(analysisModal.analysis.score)}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Рекомендации:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{analysisModal.analysis.text}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

