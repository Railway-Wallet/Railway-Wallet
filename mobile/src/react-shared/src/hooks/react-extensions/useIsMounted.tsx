import { useCallback, useEffect, useRef } from "react";

export const useIsMounted = () => {
  const mounted = useRef(false);
  const isMounted = useCallback(() => mounted.current, []);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  return { isMounted };
};
