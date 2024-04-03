import React from 'react';
import { Toast } from '@components/alerts/Toast/Toast';
import { useReduxSelector } from '@react-shared';
import styles from './ToastWrapperView.module.scss';

type Props = {};

export const ToastWrapperView: React.FC<Props> = () => {
  const { toast } = useReduxSelector('toast');

  return (
    <div className={styles.toastsWrapper}>
      {toast.immediate && (
        <Toast {...toast.immediate} isImmediate={true} duration={5200} />
      )}
      {toast.asyncQueue.length > 0 && (
        <Toast {...toast.asyncQueue[0]} isImmediate={false} duration={4800} />
      )}
    </div>
  );
};
