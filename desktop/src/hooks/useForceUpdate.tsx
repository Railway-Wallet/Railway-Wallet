import { useReducer } from 'react';

export const useForceUpdate = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, forceUpdate] = useReducer(x => x + 1, 0);

  return { forceUpdate };
};
