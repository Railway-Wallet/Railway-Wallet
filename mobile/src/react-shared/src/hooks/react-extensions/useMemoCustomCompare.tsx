import { useEffect, useRef } from "react";

export const useMemoCustomCompare = <T,>(
  next: T,
  compare: (prev: T, next: T) => boolean
): T => {
  const previousRef = useRef<T>(next);
  const previous = previousRef.current;

  const isEqual = compare(previous, next);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  }, [isEqual, next]);

  return isEqual ? previous : next;
};
