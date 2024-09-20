import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';

export const usePersistedState = (
  key: string,
  defaultValue: string,
): [string, (state: string) => void] => {
  const [state, setState] = useState<string>(() => {
    const persistedState = window.localStorage.getItem(key);
    return isDefined(persistedState)
      ? JSON.parse(persistedState)
      : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [state, setState];
};
