import { isDefined } from '@railgun-community/shared-models';
import React, { ReactElement, useEffect, useRef } from 'react';
import {
  GradientStyle,
  RailgunGradient,
} from '@components/RailgunGradient/RailgunGradient';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  ERC20InfoData,
  EVENT_OPEN_DRAWER_WITH_DATA,
} from '@models/drawer-types';
import {
  dismissAsyncToast,
  getNetworkFrontendConfig,
  hideImmediateToast,
  RAILGUN_GRADIENT,
  ShowToastProps,
  styleguide,
  ToastAction,
  ToastActionScreen,
  ToastType,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import {
  AppEventChangeNetworkData,
  AppEventChangePrivatePublicData,
  appEventsBus,
  EVENT_CHANGE_NETWORK,
  EVENT_CHANGE_PRIVATE_PUBLIC,
} from '@services/navigation/app-events';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './Toast.module.scss';

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
  const { network } = useReduxSelector('network');
  const toastTimeout = useRef<NodeJS.Timeout>();
  const dispatch = useAppDispatch();

  const onDismiss = () => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    dispatch(isImmediate ? hideImmediateToast() : dismissAsyncToast());
  };

  useEffect(() => {
    if (!message) {
      onDismiss();
      return;
    }

    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    toastTimeout.current = setTimeout(onDismiss, duration);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

        switch (navigationData.screen) {
          case ToastActionScreen.TokenInfo: {
            appEventsBus.dispatch(EVENT_CHANGE_NETWORK, {
              networkName: navigationData.params.networkName,
              forceChangeNetwork:
                network.current.name !== navigationData.params.networkName,
            } as AppEventChangeNetworkData);

            appEventsBus.dispatch(EVENT_CHANGE_PRIVATE_PUBLIC, {
              isRailgun: navigationData.params.isRailgun ?? true,
            } as AppEventChangePrivatePublicData);

            drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
              drawerName: DrawerName.ERC20Info,
              extraData: {
                erc20: navigationData.params.token,
                balanceBucketFilter: navigationData.params.balanceBucketFilter,
              } as ERC20InfoData,
            });
          }
        }
        break;
      }
    }
  };

  const onPress = () => {
    handleActionData();
    onDismiss();
  };

  const typeToIcon = (toastType?: ToastType): Optional<ReactElement> => {
    if (!toastType) {
      return undefined;
    }
    switch (toastType) {
      case ToastType.Success:
        return renderIcon(IconType.Check, 24);
      case ToastType.Error:
        return renderIcon(IconType.Alert, 24);
      case ToastType.Info:
        return renderIcon(IconType.Info, 24);
      case ToastType.Copy:
        return renderIcon(IconType.CopySuccess, 24);
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
    <div className={styles.toastContainer}>
      <div onClick={onPress}>
        <div className={styles.toastOuterContent}>
          <RailgunGradient className={styles.border} gradient={gradient}>
            <div className={styles.toastContent}>
              <div className={styles.textIconWrapper}>
                <div>{icon}</div>
                <div className={styles.textSubtextWrapper}>
                  <Text className={styles.messageText}>{message}</Text>
                  {isDefined(subtext) && (
                    <Text className={styles.subtext}>{subtext}</Text>
                  )}
                </div>
              </div>
            </div>
          </RailgunGradient>
        </div>
      </div>
    </div>
  );
};
