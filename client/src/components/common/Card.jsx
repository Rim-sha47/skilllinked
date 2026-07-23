import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  footer,
  noPadding = false,
  glassHeavy = false,
  ...props
}) => {
  const paddingClass = noPadding ? '' : 'p-6';
  const glassClass = glassHeavy ? 'bg-glass-heavy' : 'bg-glass';

  return (
    <div
      className={`${glassClass} overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50 ${className}`}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-dark-card/30">
          <h3 className="text-lg font-bold text-text-primary dark:text-gray-100">
            {title}
          </h3>
        </div>
      )}
      
      <div className={paddingClass}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-dark-bg/50">
          {footer}
        </div>
      )}
    </div>
  );
};
