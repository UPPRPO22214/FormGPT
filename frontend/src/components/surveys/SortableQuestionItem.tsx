import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionItem } from './QuestionItem';
import { Question } from '../../types/survey';

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const SortableQuestionItem = ({
  question,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}: SortableQuestionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="relative group">
        <QuestionItem
          question={question}
          index={index}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          isDragging={isDragging}
        />
        <div
          {...attributes}
          {...listeners}
          className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all rounded-xl ${
            isDragging
              ? 'opacity-100 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg scale-110'
              : 'opacity-0 group-hover:opacity-100 hover:bg-gradient-to-br hover:from-primary-100 hover:to-primary-200 text-gray-400 hover:text-primary-600'
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
