declare module 'react-datepicker' {
  import * as React from 'react';
  const DatePicker: React.FC<any>;
  // eslint-disable-next-line import/no-default-export
  export default DatePicker;
}

declare module 'react-modal' {
  import * as React from 'react';
  const Modal: React.FC<any> & {
    setAppElement: (selector: string) => void
  };
  // eslint-disable-next-line import/no-default-export
  export default Modal;
}

declare type Optional<T> = T | undefined;
declare type MapType<T> = Partial<Record<string, T>>;

declare module '@assets/libs/snarkjs.min.js';
