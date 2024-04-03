import { useUnload } from '@hooks/useUnload';

type Props = {
  message: string;
};

export const UseUnloadComponent = ({ message }: Props) => {
  useUnload(e => {
    e.returnValue = message;
    return message;
  });

  return <></>;
};
