import {
  DependencyList,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";

export const useResettableState = <S,>(
  initialState: S | (() => S),
  deps: DependencyList
): [S, Dispatch<SetStateAction<S>>] => {
  const [item, setItem] = useState(initialState);

  useEffect(() => {
    setItem(initialState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [item, setItem];
};
