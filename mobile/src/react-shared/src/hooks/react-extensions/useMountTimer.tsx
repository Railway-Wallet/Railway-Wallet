import { useEffect, useState } from "react";

export const useMountTimer = (timeout: number) => {
  const [mountTimerCompleted, setMountTimerCompleted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMountTimerCompleted(true);
    }, timeout);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mountTimerCompleted,
  };
};
