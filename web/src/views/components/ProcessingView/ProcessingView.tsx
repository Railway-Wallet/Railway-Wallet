import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import cn from 'classnames';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { RailgunGradient } from '@components/RailgunGradient/RailgunGradient';
import { Text } from '@components/Text/Text';
import { styleguide } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
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
  const processingView = () => (
    <div className={cn(styles.pageWrapper, styles.processingWrapper)}>
      <div className={styles.spinnerContainer}>
        <Spinner
          size={64}
          color={styleguide.colors.text()}
          className={styles.spinner}
        />
      </div>
      <Text className={styles.subtleText}>{processingText}</Text>
      {isDefined(progress) && (
        <div className={styles.progressBarContainer}>
          <ProgressBar progress={progress} />
        </div>
      )}
      <Text className={styles.warningText}>{processingWarning}</Text>
    </div>
  );

  const successView = () => (
    <RailgunGradient
      className={styles.pageWrapper}
      onClick={onPressSuccessView}
    >
      <div className={styles.iconContainer}>
        {renderIcon(IconType.CheckCircle, 108)}
      </div>
      {isDefined(successText) && (
        <Text className={styles.boldText}>{successText}</Text>
      )}
    </RailgunGradient>
  );

  const failView = () => (
    <div
      className={cn(styles.pageWrapper, styles.failWrapper)}
      onClick={
        onPressFailView && failure ? () => onPressFailView(failure) : undefined
      }
    >
      <div className={styles.iconContainer}>
        {renderIcon(IconType.CloseCircle, 108, styleguide.colors.error())}
      </div>
      {isDefined(failure) && (
        <>
          <Text className={styles.boldText}>{failure.message}</Text>
        </>
      )}
    </div>
  );

  const coreView = () => {
    switch (processingState) {
      case ProcessingState.Processing: {
        return processingView();
      }
      case ProcessingState.Success: {
        return successView();
      }
      case ProcessingState.Fail: {
        return failView();
      }
    }
  };

  return <div className={styles.blurView}>{coreView()}</div>;
};
