import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export const Card = ({ children, title, className = '' }: CardProps) => {
  return (
    <div className={`bg-white/60 backdrop-blur-xl rounded-2xl shadow-soft p-6 border border-white/30 transition-all duration-300 hover:shadow-lg hover:border-white/50 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6 pb-2 border-b border-white/30">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

