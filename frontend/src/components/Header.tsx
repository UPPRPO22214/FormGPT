import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  
  // Проверяем, находимся ли мы на странице прохождения опроса
  const isTakingSurvey = location.pathname.match(/^\/surveys\/[^/]+$/) !== null && !location.pathname.includes('/edit') && !location.pathname.includes('/analytics');

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    // Функция для вычисления позиции меню
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Используем минимальный отступ, чтобы меню было прижато к хедеру без перекрытия
        setMenuPosition({
          top: rect.bottom + 12.9,
          right: window.innerWidth - rect.right,
        });
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updatePosition();
      
      // Обновляем позицию при скролле или изменении размера окна
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isMenuOpen]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className={`bg-white/50 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-50 ${isTakingSurvey ? 'pointer-events-none' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className={`flex items-center gap-3 group ${isTakingSurvey ? 'pointer-events-none cursor-default' : ''}`}>
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold gradient-text">FormGPT</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/surveys/create"
              className={`text-gray-700 hover:text-primary-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-white/40 backdrop-blur-sm ${isTakingSurvey ? 'pointer-events-none cursor-default' : ''}`}
            >
              Создать опрос
            </Link>
            
            {user && (
              <div className="relative pl-4 border-l border-white/30" ref={containerRef}>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-900">{user.name || user.email}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                  <button
                    ref={buttonRef}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow ${isTakingSurvey ? 'pointer-events-none cursor-default opacity-50' : 'cursor-pointer'}`}
                    disabled={isTakingSurvey}
                  >
                    {(user.name || user.email)[0].toUpperCase()}
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
      
      {isMenuOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-white/60 backdrop-blur-xl border border-white/30 rounded-xl shadow-xl py-2 animate-in slide-in-from-top-2 z-[100]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="px-4 py-2 border-b border-white/20">
            <div className="text-sm font-semibold text-gray-900">{user?.name || user?.email}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
          <Link
            to="/profile"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-white/40 hover:text-primary-600 transition-colors"
          >
            Профиль
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/40 hover:text-red-600 transition-colors"
          >
            Выйти
          </button>
        </div>,
        document.body
      )}
    </header>
  );
};

