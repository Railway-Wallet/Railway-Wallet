import { isDefined } from '@railgun-community/shared-models';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import failureAnimation from '@assets/img/animations/failure.gif';
import introLoadingAnimation from '@assets/img/animations/introLoading.gif';
import loadingAnimation from '@assets/img/animations/loading.gif';
import successAnimation from '@assets/img/animations/success.gif';
import { Text } from '@components/Text/Text';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import styles from './ProcessingView.module.scss';

export enum ProcessingState {
  Processing = 'processing',
  Success = 'success',
  Fail = 'fail',
}

interface ProcessingViewProps {
  processingState: ProcessingState;
  processingText: string;
  processingWarning?: string;
  successText?: string;
  failure?: Error;
  bottomProcessingText?: string;
  progress?: number;
  onPressSuccessView: Optional<() => void>;
  onPressFailView: Optional<(err: Error) => void>;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  processingState,
  processingText,
  processingWarning,
  successText,
  failure,
  progress,
  onPressSuccessView,
  onPressFailView,
}) => {
  const [loadingSrc, setLoadingSrc] = useState(introLoadingAnimation);

  const isProcessing = processingState === ProcessingState.Processing;
  const isSuccess = processingState === ProcessingState.Success;
  const isFail = processingState === ProcessingState.Fail;

  const description = useMemo(() => {
    if (isProcessing) {
      return processingText;
    }

    if (isSuccess && isDefined(successText)) {
      return successText;
    }

    if (isFail && failure) {
      return failure.message;
    }

    return '';
  }, [isProcessing, isSuccess, isFail, processingText, successText, failure]);

  const handleOnPressView = useCallback(() => {
    if (isSuccess) {
      return onPressSuccessView;
    }

    if (isFail && onPressFailView && failure) {
      return () => onPressFailView(failure);
    }

    return undefined;
  }, [failure, isFail, isSuccess, onPressFailView, onPressSuccessView]);

  useEffect(() => {
    const preloadLoadingImage = new Image();
    const preloadSuccessImage = new Image();
    const preloadFailureImage = new Image();
    preloadLoadingImage.src = loadingAnimation;
    preloadSuccessImage.src = successAnimation;
    preloadFailureImage.src = failureAnimation;

    const timer = setTimeout(() => {
      setLoadingSrc(loadingAnimation);
    }, 2000);

    return () => {
      clearTimeout(timer);
      setLoadingSrc(introLoadingAnimation);
    };
  }, []);

  return (
    <div className={styles.blurView}>
      <div onClick={handleOnPressView} className={styles.pageWrapper}>
        <div className={styles.animationsContainer}>
          <img
            src={loadingSrc}
            className={styles.loadingAnimation}
            alt="loading"
          />
          {isSuccess && (
            <img
              src={successAnimation}
              className={styles.successAnimation}
              alt="success"
            />
          )}
          {isFail && (
            <img
              src={failureAnimation}
              className={styles.failureAnimation}
              alt="failure"
            />
          )}
        </div>
        <div className={styles.informationContainer}>
          <Text className={styles.subtleText}>{description}</Text>
          {isProcessing && isDefined(progress) && (
            <div className={styles.progressBarContainer}>
              <ProgressBar progress={progress} />
            </div>
          )}
          {isProcessing && (
            <Text className={styles.warningText}>{processingWarning}</Text>
          )}
        </div>
      </div>
    </div>
  );
};
