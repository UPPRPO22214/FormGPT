import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  confirmDisabled?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'default',
  confirmDisabled = false,
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-top-2">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/70 hover:bg-white/90 backdrop-blur-md border border-white/40 transition-colors text-gray-700 hover:text-gray-900 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex items-start gap-4 mb-4 pr-8">
          {variant === 'danger' && (
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 flex-1">{title}</h2>
        </div>

        {/* Content */}
        <div className="mb-6 text-gray-800">{children}</div>

        {/* Actions */}
        {(onConfirm || onCancel) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {onCancel && (
              <button
                onClick={handleCancel}
                className="px-6 py-3 font-semibold rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-md text-gray-700 hover:bg-white/90 border-2 border-white/40 hover:border-white/60 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={handleConfirm}
                disabled={confirmDisabled}
                className={`px-6 py-3 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  confirmDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : variant === 'danger'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl shadow-red-500/25'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 shadow-lg hover:shadow-xl shadow-primary-500/25'
                }`}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

