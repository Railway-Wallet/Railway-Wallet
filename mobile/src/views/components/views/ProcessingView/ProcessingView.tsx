import { isDefined } from "@railgun-community/shared-models";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import KeepAwake from "react-native-keep-awake";
import { Bar as ProgressBar } from "react-native-progress";
import failureAnimation from "@assets/animations/failure.gif";
import introLoadingAnimation from "@assets/animations/introLoading.gif";
import loadingAnimation from "@assets/animations/loading.gif";
import successAnimation from "@assets/animations/success.gif";
import { BlurView } from "@react-native-community/blur";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";
import { Icon } from "@views/components/icons/Icon";
import { SpinnerCubes } from "@views/components/loading/SpinnerCubes/SpinnerCubes";
import { styles } from "./styles";

export enum ProcessingState {
  Processing = "processing",
  Success = "success",
  Fail = "fail",
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
  const isAndroidDevice = isAndroid();

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

    return "";
  }, [isProcessing, isSuccess, isFail, processingText, successText, failure]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingSrc(loadingAnimation);
    }, 2000);

    return () => {
      clearTimeout(timer);
      setLoadingSrc(introLoadingAnimation);
    };
  }, []);

  useEffect(() => {
    if (isProcessing) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }
  }, [isProcessing]);

  const handleOnPressView = useCallback(() => {
    if (isSuccess) {
      return onPressSuccessView;
    }

    if (isFail && onPressFailView && failure) {
      return () => onPressFailView(failure);
    }

    return undefined;
  }, [failure, isFail, isSuccess, onPressFailView, onPressSuccessView]);

  return (
    <>
      <BlurView blurType="light" blurAmount={2} style={styles.fullScreenView}>
        <TouchableOpacity
          style={styles.fullScreenView}
          onPress={handleOnPressView}
          disabled={isProcessing}
        >
          <View style={styles.pageWrapper}>
            <View style={styles.animationsContainer}>
              {isAndroidDevice ? (
                isProcessing && (
                  <SpinnerCubes size={64} style={styles.loading} />
                )
              ) : (
                <Image
                  source={loadingSrc as ImageSourcePropType}
                  style={styles.loading}
                  resizeMode="contain"
                />
              )}
              {isSuccess &&
                (isAndroidDevice ? (
                  <Icon
                    size={108}
                    source="check-circle-outline"
                    color="white"
                  />
                ) : (
                  <Image
                    source={successAnimation as ImageSourcePropType}
                    style={styles.animation}
                    resizeMode="contain"
                  />
                ))}
              {isFail &&
                (isAndroidDevice ? (
                  <Icon
                    size={108}
                    source="close-circle-outline"
                    color={styleguide.colors.error()}
                  />
                ) : (
                  <Image
                    source={failureAnimation as ImageSourcePropType}
                    style={styles.animation}
                    resizeMode="contain"
                  />
                ))}
            </View>
            <View style={styles.informationContainer}>
              <Text
                style={[styles.subtleText, !isProcessing && styles.boldText]}
                testID="ProcessView-ProcessingText"
              >
                {description}
              </Text>
              {isProcessing && isDefined(progress) && (
                <View style={styles.progressBarWrapper}>
                  <ProgressBar
                    progress={progress / 100}
                    color={styleguide.colors.txGreen()}
                    borderColor={styleguide.colors.white}
                  />
                </View>
              )}
              {isProcessing && (
                <Text style={styles.warningText}>{processingWarning}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </BlurView>
    </>
  );
};
