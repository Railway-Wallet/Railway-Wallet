import { isDefined } from "@railgun-community/shared-models";
import React, { useCallback, useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  GradientStyle,
  RailgunGradient,
} from "@components/gradient/RailgunGradient";
import { useNavigation } from "@react-navigation/native";
import {
  dismissAsyncToast,
  getNetworkFrontendConfig,
  hideImmediateToast,
  RAILGUN_GRADIENT,
  ShowToastProps,
  styleguide,
  ToastAction,
  ToastType,
  useAppDispatch,
} from "@react-shared";
import { AnimatedWrapper } from "@services/animation/AnimatedWrapper";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

type ToastProps = ShowToastProps & {
  isImmediate: boolean;
  duration: number;
};

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  subtext,
  networkName,
  type,
  duration,
  isImmediate,
  actionData,
}) => {
  const fadeAnim = useRef(new AnimatedWrapper.Value(0)).current;
  const toastTimeout = useRef<NodeJS.Timeout>();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const onDismiss = useCallback(() => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    AnimatedWrapper.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dispatch(isImmediate ? hideImmediateToast() : dismissAsyncToast());
    });
  }, [dispatch, fadeAnim, isImmediate]);

  const playAsyncToastHaptic = useCallback(() => {
    if (!type) {
      return;
    }
    switch (type) {
      case ToastType.Success:
        triggerHaptic(HapticSurface.NotifySuccess);
        return;
      case ToastType.Error:
        triggerHaptic(HapticSurface.NotifyError);
        return;
      case ToastType.Copy:
      case ToastType.Info:
        return;
    }
  }, [type]);

  useEffect(() => {
    if (!message) {
      onDismiss();
      return;
    }

    AnimatedWrapper.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (!isImmediate) {
      playAsyncToastHaptic();
    }

    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    toastTimeout.current = setTimeout(onDismiss, duration);
  }, [
    duration,
    fadeAnim,
    id,
    isImmediate,
    message,
    onDismiss,
    playAsyncToastHaptic,
  ]);

  if (!message) {
    return null;
  }

  const handleActionData = () => {
    if (!actionData) {
      return;
    }
    switch (actionData.toastAction) {
      case ToastAction.Navigate: {
        const navigationData = actionData.navigationDataUNSAFE;
        if (!navigationData) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
        (navigation as any).navigate(navigationData.stack, {
          screen: navigationData.screen,
          params: navigationData.params,
        });
        break;
      }
    }
  };

  const onPress = () => {
    handleActionData();
    onDismiss();
  };

  const typeToIcon = (toastType?: ToastType): Optional<string> => {
    if (!toastType) {
      return undefined;
    }
    switch (toastType) {
      case ToastType.Success:
        return "check-bold";
      case ToastType.Error:
        return "alert-circle-outline";
      case ToastType.Info:
        return "information-outline";
      case ToastType.Copy:
        return "content-copy";
    }
  };

  const icon = typeToIcon(type);

  let gradient: Optional<GradientStyle>;
  switch (type) {
    case ToastType.Error:
      gradient = styleguide.colors.gradients.redCallout;
      break;
    default:
      if (networkName) {
        gradient = {
          ...RAILGUN_GRADIENT,
          colors: getNetworkFrontendConfig(networkName).gradientColors,
        };
      }
      break;
  }

  return (
    <View style={styles.toastContainer}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        testID="Toast-TouchHandler"
      >
        <AnimatedWrapper.View style={{ opacity: fadeAnim }}>
          <View style={styles.toastOuterContent}>
            <RailgunGradient style={styles.border} gradient={gradient}>
              <View style={styles.toastContent}>
                <View style={styles.textIconWrapper}>
                  {isDefined(icon) && (
                    <Icon
                      size={24}
                      source={icon}
                      color={styleguide.colors.white}
                    />
                  )}
                  <View style={styles.textSubtextWrapper}>
                    <Text
                      style={styles.messageText}
                      numberOfLines={5}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {message.length > 120
                        ? `${message.substring(0, 120)}...`
                        : message}
                    </Text>
                    {isDefined(subtext) && (
                      <Text style={styles.subtext}>{subtext}</Text>
                    )}
                  </View>
                </View>
              </View>
            </RailgunGradient>
          </View>
        </AnimatedWrapper.View>
      </TouchableOpacity>
    </View>
  );
};
