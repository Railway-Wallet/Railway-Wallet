import { useCallback,useEffect, useState } from 'react';

export const useKeySinglePress = (targetKey: string) => {
  const [keyPressed, setKeyPressed] = useState(false);

  const upHandler = useCallback(
    ({ key }: KeyboardEvent) => {
      if (key === targetKey) setKeyPressed(true);
    },
    [targetKey],
  );

  useEffect(() => {
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keyup', upHandler);
    };
  }, [upHandler]);

  return keyPressed;
};
