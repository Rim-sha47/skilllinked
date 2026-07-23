import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-glow border border-transparent',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 border border-transparent shadow-sm',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 bg-transparent',
    ghost: 'text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent',
    danger: 'bg-gradient-to-r from-danger to-red-600 text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={!props.disabled && !isLoading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!props.disabled && !isLoading ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
};
