import { useCallback, useEffect, useState } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  const handleResize = useCallback(() => {
    requestAnimationFrame(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    handleResize();

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return windowSize;
}
