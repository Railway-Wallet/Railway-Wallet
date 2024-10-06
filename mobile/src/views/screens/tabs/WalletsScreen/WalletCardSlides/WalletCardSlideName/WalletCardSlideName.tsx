import { isDefined } from "@railgun-community/shared-models";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Text } from "react-native";
import { shortenWalletAddress } from "@react-shared";
import { AnimatedWrapper } from "@services/animation/AnimatedWrapper";
import { styles } from "./styles";

type Props = {
  walletAddress?: string;
  walletName: string;
  slideIsActive: boolean;
};

const ANIMATION_TIMEOUT = 3690;
const ANIMATION_DURATION = 690;

export const WalletCardSlideName: React.FC<Props> = ({
  walletAddress,
  walletName,
  slideIsActive,
}) => {
  const shouldAnimate = isDefined(walletAddress) && slideIsActive;

  const startWithWalletName = !isDefined(walletAddress);
  const showingWalletName = useRef(startWithWalletName);

  const walletAddressOpacity = useMemo(() => {
    return startWithWalletName
      ? new AnimatedWrapper.Value(0)
      : new AnimatedWrapper.Value(1);
  }, [startWithWalletName]);
  const walletNameOpacity = useMemo(() => {
    return startWithWalletName
      ? new AnimatedWrapper.Value(1)
      : new AnimatedWrapper.Value(0);
  }, [startWithWalletName]);

  const updateToWalletAddress = useCallback(() => {
    showingWalletName.current = false;
    AnimatedWrapper.timing(walletNameOpacity, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
    AnimatedWrapper.timing(walletAddressOpacity, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [walletAddressOpacity, walletNameOpacity]);

  const updateToWalletName = useCallback(() => {
    showingWalletName.current = true;
    AnimatedWrapper.timing(walletNameOpacity, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
    AnimatedWrapper.timing(walletAddressOpacity, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [walletAddressOpacity, walletNameOpacity]);

  const updateSlideName = useCallback(() => {
    if (!shouldAnimate) {
      return;
    }
    if (showingWalletName.current) {
      updateToWalletAddress();
    } else {
      updateToWalletName();
    }
  }, [
    shouldAnimate,
    showingWalletName,
    updateToWalletAddress,
    updateToWalletName,
  ]);

  useEffect(() => {
    updateToWalletAddress();
  }, [slideIsActive, updateToWalletAddress]);

  useEffect(() => {
    const timer = setInterval(updateSlideName, ANIMATION_TIMEOUT);
    return () => {
      clearInterval(timer);
    };
  }, [updateSlideName]);

  return (
    <>
      {shouldAnimate && (
        <>
          {
            <AnimatedWrapper.Text
              style={[styles.slideName, { opacity: walletAddressOpacity }]}
            >
              {walletAddress ? shortenWalletAddress(walletAddress) : null}
            </AnimatedWrapper.Text>
          }
          {
            <AnimatedWrapper.Text
              style={[styles.slideName, { opacity: walletNameOpacity }]}
            >
              {walletName}
            </AnimatedWrapper.Text>
          }
        </>
      )}
      {!shouldAnimate && <Text style={[styles.slideName]}>{walletName}</Text>}
    </>
  );
};
