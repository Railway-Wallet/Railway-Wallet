import { useEffect } from 'react';

export const useCloseOnEsc = (onClose: () => void) => {
  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', closeOnEsc);
    return () => {
      window.removeEventListener('keydown', closeOnEsc);
    };
  }, [onClose]);
};
