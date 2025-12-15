import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi } from '../services/api';
import { SurveyAnalytics, QuestionAnalytics, ChoiceDistribution, ScaleDistribution, TextAnalytics } from '../types/survey';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const SurveyAnalyticsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGPT, setIsLoadingGPT] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAnalytics();
    }
  }, [id]);

  const loadAnalytics = async (includeGPT: boolean = false) => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await surveyApi.getAnalytics(id, includeGPT);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Ошибка загрузки статистики:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить статистику');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadGPTAnalysis = async () => {
    setIsLoadingGPT(true);
    try {
      await loadAnalytics(true);
    } catch (err) {
      console.error('Ошибка загрузки GPT анализа:', err);
    } finally {
      setIsLoadingGPT(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!id) return;
    try {
      await surveyApi.downloadCsv(id);
    } catch (error: any) {
      console.error('Ошибка скачивания CSV:', error);
      alert(error.response?.data?.message || 'Не удалось скачать файл');
    }
  };

  const renderChoiceDistribution = (distribution: ChoiceDistribution, question: QuestionAnalytics) => {
    const maxCount = Math.max(...distribution.counts, 1);
    
    return (
      <div className="space-y-3">
        {distribution.options.map((option, index) => {
          const count = distribution.counts[index] || 0;
          const percentage = distribution.percentages[index] || 0;
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{option}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">{count} ответов</span>
                  <span className="font-semibold text-primary-600 min-w-[60px] text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${width}%` }}
                >
                  {width > 15 && (
                    <span className="text-white text-xs font-semibold">{count}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderScaleDistribution = (distribution: ScaleDistribution, question: QuestionAnalytics) => {
    const maxCount = Math.max(...distribution.distribution, 1);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-700">{distribution.average.toFixed(1)}</div>
            <div className="text-sm text-gray-600 mt-1">Среднее</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{distribution.median.toFixed(1)}</div>
            <div className="text-sm text-gray-600 mt-1">Медиана</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{question.totalAnswers}</div>
            <div className="text-sm text-gray-600 mt-1">Ответов</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 mb-3">Распределение оценок:</h4>
          {distribution.distribution.map((count, index) => {
            const value = index + distribution.min;
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
            
            return (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-8 text-right">{value}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${width}%` }}
                  >
                    {width > 20 && (
                      <span className="text-white text-xs font-semibold">{count}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTextAnalytics = (analytics: TextAnalytics, question: QuestionAnalytics) => {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-lg font-bold text-blue-700">{analytics.totalAnswers}</div>
          <div className="text-sm text-gray-600">Всего текстовых ответов</div>
        </div>
        
        {analytics.wordCloud && analytics.wordCloud.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Наиболее частые слова:</h4>
            <div className="flex flex-wrap gap-2">
              {analytics.wordCloud.map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {analytics.sampleAnswers && analytics.sampleAnswers.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Примеры ответов:</h4>
            <div className="space-y-2">
              {analytics.sampleAnswers.map((answer, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500 text-sm text-gray-700"
                >
                  "{answer}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuestionAnalytics = (question: QuestionAnalytics) => {
    const getQuestionTypeLabel = (type: string) => {
      switch (type) {
        case 'single-choice':
          return 'Один вариант';
        case 'multiple-choice':
          return 'Несколько вариантов';
        case 'scale-1-10':
          return 'Шкала 1-10';
        case 'text':
          return 'Текстовый ответ';
        default:
          return type;
      }
    };

    const distribution = question.answerDistribution;
    const isChoice = 'options' in distribution;
    const isScale = 'average' in distribution && 'distribution' in distribution;
    const isText = 'wordCloud' in distribution || 'sampleAnswers' in distribution;

    return (
      <Card key={question.questionId} className="mb-6">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">{question.questionTitle}</h3>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              {getQuestionTypeLabel(question.questionType)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Всего ответов: <span className="font-semibold">{question.totalAnswers}</span>
          </p>
        </div>
        
        {question.totalAnswers === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>На этот вопрос пока нет ответов</p>
          </div>
        ) : (
          <div className="mt-4">
            {isChoice && renderChoiceDistribution(distribution as ChoiceDistribution, question)}
            {isScale && renderScaleDistribution(distribution as ScaleDistribution, question)}
            {isText && renderTextAnalytics(distribution as TextAnalytics, question)}
          </div>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Загрузка статистики...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ошибка загрузки</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => loadAnalytics()}>Попробовать снова</Button>
                <Button variant="secondary" onClick={() => navigate('/')}>На главную</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const completionRate = analytics.totalRespondents > 0
    ? (analytics.completedCount / analytics.totalRespondents * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 pb-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Назад
            </Button>
            <h1 className="text-4xl font-bold gradient-text mb-2">{analytics.title}</h1>
            {analytics.description && (
              <p className="text-gray-600 text-lg">{analytics.description}</p>
            )}
          </div>
          <Button
            onClick={handleDownloadCsv}
            variant="secondary"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Скачать CSV
          </Button>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">{analytics.totalRespondents}</div>
              <div className="text-sm text-gray-600">Всего респондентов</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{analytics.completedCount}</div>
              <div className="text-sm text-gray-600">Завершено</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{analytics.incompletedCount}</div>
              <div className="text-sm text-gray-600">Не завершено</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{completionRate}%</div>
              <div className="text-sm text-gray-600">Процент завершения</div>
            </div>
          </Card>
        </div>

        {/* GPT Анализ */}
        {analytics.gptAnalysis && (
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">GPT Анализ</h2>
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analytics.gptAnalysis}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Кнопка загрузки GPT анализа */}
        {!analytics.gptAnalysis && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">GPT Анализ результатов</h3>
                <p className="text-sm text-gray-600">Получите детальный анализ результатов опроса с выводами и рекомендациями</p>
              </div>
              <Button
                onClick={handleLoadGPTAnalysis}
                isLoading={isLoadingGPT}
                disabled={isLoadingGPT}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Загрузить GPT анализ
              </Button>
            </div>
          </Card>
        )}

        {/* Статистика по вопросам */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Статистика по вопросам</h2>
          {analytics.questionsAnalytics.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>В этом опросе пока нет вопросов</p>
              </div>
            </Card>
          ) : (
            analytics.questionsAnalytics.map(renderQuestionAnalytics)
          )}
        </div>
      </div>
    </div>
  );
};

