import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import { Bar as ProgressBar } from 'react-native-progress';
import { RailgunGradient } from '@components/gradient/RailgunGradient';
import { BlurView } from '@react-native-community/blur';
import { styleguide } from '@react-shared';
import { Icon } from '@views/components/icons/Icon';
import { SpinnerCubes } from '../../loading/SpinnerCubes/SpinnerCubes';
import { styles } from './styles';

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
    <View style={[styles.pageWrapper, styles.processingWrapper]}>
      <SpinnerCubes size={64} style={styles.spinner} />
      <Text style={styles.subtleText} testID="ProcessView-ProcessingText">
        {processingText}
      </Text>
      {isDefined(progress) && (
        <View style={styles.progressBarWrapper}>
          <ProgressBar
            progress={progress / 100}
            color={styleguide.colors.txGreen()}
            borderColor={styleguide.colors.white}
            style={styles.progressBar}
          />
        </View>
      )}
      <Text style={styles.warningText}>{processingWarning}</Text>
    </View>
  );
  const successView = () => (
    <TouchableOpacity
      style={styles.fullScreenView}
      onPress={onPressSuccessView}
    >
      <RailgunGradient
        gradient={styleguide.colors.gradients.railgunSemiTransparent}
        style={[styles.pageWrapper, styles.fullScreenView]}
      >
        <Icon size={108} source="check-circle-outline" color="white" />
        {isDefined(successText) && (
          <Text style={styles.boldText}>{successText}</Text>
        )}
      </RailgunGradient>
    </TouchableOpacity>
  );

  const failView = () => (
    <TouchableOpacity
      style={styles.fullScreenView}
      onPress={
        onPressFailView && failure ? () => onPressFailView(failure) : undefined
      }
    >
      <View
        style={[styles.pageWrapper, styles.fullScreenView, styles.failWrapper]}
      >
        <Icon
          size={108}
          source="close-circle-outline"
          color={styleguide.colors.error()}
        />
        {isDefined(failure) && (
          <>
            <Text style={styles.boldText}>{failure.message}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const coreView = () => {
    switch (processingState) {
      case ProcessingState.Processing: {
        KeepAwake.activate();
        return processingView();
      }
      case ProcessingState.Success: {
        KeepAwake.deactivate();
        return successView();
      }
      case ProcessingState.Fail: {
        KeepAwake.deactivate();
        return failView();
      }
    }
  };

  return (
    <>
      {/* @ts-ignore - children does not exist */}
      <BlurView blurType="light" blurAmount={2} style={styles.fullScreenView}>
        {coreView()}
      </BlurView>
    </>
  );
};
