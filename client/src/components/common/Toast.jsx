import React, { useEffect } from 'react';
import { clsx } from 'clsx';

/**
 * Toast notification component.
 * @param {Object} props
 * @param {string} props.message - Message to display.
 * @param {('success'|'error'|'info')} [props.type='info'] - Toast style.
 * @param {number} [props.duration=3000] - Auto-dismiss after ms.
 * @param {function} [props.onClose] - Callback when toast closes.
 */
export const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-primary text-white',
  }[type];

  return (
    <div
      className={clsx(
        'fixed bottom-4 right-4 max-w-sm w-full rounded-md shadow-lg p-3 z-50 transition-transform',
        typeClasses
      )}
    >
      {message}
    </div>
  );
};

export default Toast;
