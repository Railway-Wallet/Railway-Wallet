import React from 'react';

export function useFocus<T extends HTMLElement = HTMLElement>() {
  const ref = React.useRef<T>(null);
  const setFocus = () => {
    ref?.current?.focus?.();
  };

  const setBlur = () => {
    ref?.current?.blur?.();
  };

  return [ref, setFocus, setBlur] as const;
}
