import { Question, QuestionType } from '../../types/survey';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface QuestionItemProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onImprove?: (id: string, prompt?: string) => void;
  isDragging?: boolean;
  index: number;
  canImprove?: boolean;
}

const questionTypeLabels: Record<QuestionType, string> = {
  single_choice: 'Одиночный выбор',
  multiple_choice: 'Множественный выбор',
  text: 'Текст',
  scale: 'Шкала',
};

const questionTypeIcons: Record<QuestionType, JSX.Element> = {
  single_choice: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  multiple_choice: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  text: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  scale: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
};

export const QuestionItem = ({
  question,
  onUpdate,
  onDelete,
  onDuplicate,
  onImprove,
  isDragging = false,
  index,
  canImprove = false,
}: QuestionItemProps) => {
  const handleTypeChange = (type: QuestionType) => {
    const updatedQuestion: Question = {
      ...question,
      type,
      options: type === 'single_choice' || type === 'multiple_choice' 
        ? question.options || [{ id: String(Date.now()), text: '' }, { id: String(Date.now() + 1), text: '' }]
        : undefined,
      min: type === 'scale' ? question.min || 1 : undefined,
      max: type === 'scale' ? question.max || 10 : undefined,
    };
    onUpdate(updatedQuestion);
  };

  const handleTextChange = (text: string) => {
    onUpdate({ ...question, text });
  };

  const handleRequiredChange = (required: boolean) => {
    onUpdate({ ...question, required });
  };

  const handleOptionChange = (optionId: string, text: string) => {
    if (!question.options) return;
    const updatedOptions = question.options.map(opt =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onUpdate({ ...question, options: updatedOptions });
  };

  const handleAddOption = () => {
    if (!question.options) return;
    const newId = String(Date.now() + Math.random());
    onUpdate({
      ...question,
      options: [...question.options, { id: newId, text: '' }],
    });
  };

  const handleDeleteOption = (optionId: string) => {
    if (!question.options || question.options.length <= 1) return;
    onUpdate({
      ...question,
      options: question.options.filter(opt => opt.id !== optionId),
    });
  };

  const handleScaleChange = (field: 'min' | 'max', value: number) => {
    onUpdate({ ...question, [field]: value });
  };

  return (
    <Card
      className={`transition-all duration-300 ${
        isDragging
          ? 'opacity-70 shadow-2xl scale-[1.02] border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/50 to-white'
          : 'hover:shadow-xl border-l-4 border-l-transparent hover:border-l-primary-300'
      }`}
    >
      <div className="space-y-6">
        {/* Заголовок вопроса с номером */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-base shadow-md">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={question.text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Введите текст вопроса..."
              className="text-base"
            />
          </div>
          <div className="flex gap-2">
            {canImprove && onImprove && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onImprove(question.id)}
                title="Улучшить вопрос с помощью ИИ"
                className="hover:bg-gradient-to-r hover:from-purple-100 hover:to-purple-200 transition-all border-purple-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDuplicate(question.id)}
              title="Дублировать вопрос"
              className="hover:bg-gray-100 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(question.id)}
              title="Удалить вопрос"
              className="hover:scale-105 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Тип вопроса с иконкой */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Тип вопроса
          </label>
          <div className="relative">
            <select
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              className="w-full px-4 py-3 pl-12 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none bg-white/80 backdrop-blur-sm cursor-pointer hover:border-gray-300 font-medium"
            >
              {Object.entries(questionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none">
              {questionTypeIcons[question.type]}
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Опции для single_choice и multiple_choice */}
        {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
          <div className="space-y-4 bg-white/60 backdrop-blur-xl p-5 rounded-xl border-2 border-white/30">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Варианты ответов
              </label>
              <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg">
                {question.options?.length || 0} вариантов
              </span>
            </div>
            <div className="space-y-3">
              {question.options?.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {optionIndex + 1}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      placeholder={`Вариант ${optionIndex + 1}`}
                      className="bg-white"
                    />
                  </div>
                  {question.options && question.options.length > 1 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteOption(option.id)}
                      title="Удалить вариант"
                      className="opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddOption}
              className="w-full hover:bg-gray-100 transition-all border-2 border-dashed border-gray-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить вариант
            </Button>
          </div>
        )}

        {/* Настройки для scale */}
        {question.type === 'scale' && (
          <div className="bg-white/60 backdrop-blur-xl p-5 rounded-xl border-2 border-white/30">
            <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Диапазон шкалы
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="От"
                  type="number"
                  value={question.min || 1}
                  onChange={(e) => handleScaleChange('min', parseInt(e.target.value) || 1)}
                  min={1}
                  className="bg-white"
                />
              </div>
              <div>
                <Input
                  label="До"
                  type="number"
                  value={question.max || 10}
                  onChange={(e) => handleScaleChange('max', parseInt(e.target.value) || 10)}
                  min={2}
                  className="bg-white"
                />
              </div>
            </div>
            {question.min && question.max && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-700">Предпросмотр:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: question.max - question.min + 1 }, (_, i) => i + question.min).map((num) => (
                      <span key={num} className="px-3 py-1.5 bg-white rounded-lg border-2 border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Обязательный вопрос */}
        <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-100">
          <input
            type="checkbox"
            id={`required-${question.id}`}
            checked={question.required}
            onChange={(e) => handleRequiredChange(e.target.checked)}
            className="w-5 h-5 text-primary-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0 cursor-pointer transition-all"
          />
          <label
            htmlFor={`required-${question.id}`}
            className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-3 flex-1"
          >
            <span>Обязательный вопрос</span>
            {question.required && (
              <span className="px-3 py-1 bg-gradient-to-r from-red-100 to-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                Обязательно
              </span>
            )}
          </label>
        </div>
      </div>
    </Card>
  );
};
