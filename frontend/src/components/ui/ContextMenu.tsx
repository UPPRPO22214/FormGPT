import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
  children: ReactNode;
}

export const ContextMenu = ({ isOpen, onClose, x, y, children }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setAdjustedPosition({ x, y });
  }, [isOpen, x, y]);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const adjustPosition = () => {
      const menu = menuRef.current;
      if (!menu) return;

      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = adjustedPosition.x;
      let adjustedY = adjustedPosition.y;

      // Корректировка по горизонтали
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (adjustedX < 10) {
        adjustedX = 10;
      }

      // Корректировка по вертикали
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }
      if (adjustedY < 10) {
        adjustedY = 10;
      }

      if (adjustedX !== adjustedPosition.x || adjustedY !== adjustedPosition.y) {
        setAdjustedPosition({ x: adjustedX, y: adjustedY });
      }
    };

    // Используем requestAnimationFrame для корректировки после рендера
    requestAnimationFrame(adjustPosition);
  }, [isOpen, adjustedPosition.x, adjustedPosition.y]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl shadow-2xl py-2 z-[1000] min-w-[200px] animate-in slide-in-from-top-2"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

interface ContextMenuItemProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'default' | 'danger';
  icon?: ReactNode;
}

export const ContextMenuItem = ({ onClick, children, variant = 'default', icon }: ContextMenuItemProps) => {
  const baseStyles = 'w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3';
  const variantStyles = {
    default: 'text-gray-700 hover:bg-white/60 hover:text-primary-600',
    danger: 'text-red-600 hover:bg-red-50 hover:text-red-700',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

