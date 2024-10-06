import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  getRailgunWalletShareableViewingKey,
  showImmediateToast,
  StoredWallet,
  ToastType,
  useAppDispatch,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { openInAppBrowserLink } from "@services/util/in-app-browser-service";
import { Constants } from "@utils/constants";
import { styles } from "./styles";

type Props = {
  wallet: StoredWallet;
  onViewingKeyFail: () => void;
};

export const ViewingKeyView: React.FC<Props> = ({
  wallet,
  onViewingKeyFail,
}) => {
  const [viewingKey, setViewingKey] = useState<Optional<string>>();
  const [blur, setBlur] = useState(true);

  const blurredKey =
    "************************************************************************************************************************************************************************************************************************************************************************************************";

  const dispatch = useAppDispatch();

  useEffect(() => {
    const getViewingKey = async () => {
      const shareableViewingKey = await getRailgunWalletShareableViewingKey(
        wallet.railWalletID
      );

      if (!isDefined(shareableViewingKey)) {
        onViewingKeyFail();
      } else {
        setViewingKey(shareableViewingKey);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getViewingKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const onCopyViewingKey = () => {
    if (!isDefined(viewingKey)) {
      return;
    }
    Clipboard.setString(viewingKey);
    triggerHaptic(HapticSurface.ClipboardCopy);
    dispatch(
      showImmediateToast({
        message:
          "Shareable Private Key copied. Be careful — it can be used to access your transaction history.",
        type: ToastType.Copy,
      })
    );
  };

  const tapShowHideViewingKey = () => {
    triggerHaptic(HapticSurface.SelectItem);
    setBlur(!blur);
  };

  const onLearnMore = async () => {
    triggerHaptic(HapticSurface.NavigationButton);
    await openInAppBrowserLink(Constants.VIEW_ONLY_WALLETS_URL, dispatch);
  };

  const keyText = blur || !isDefined(viewingKey) ? blurredKey : viewingKey;
  return (
    <View>
      <View style={styles.textBoxWrapper}>
        <Text style={styles.text}>{keyText}</Text>
      </View>
      <Text style={styles.showViewingKeyText} onPress={tapShowHideViewingKey}>
        {blur ? "Click to show" : "Click to hide"}
      </Text>
      <View style={styles.bottomButtons}>
        <View style={styles.bottomButtons}>
          <ButtonWithTextAndIcon
            title="Copy"
            onPress={onCopyViewingKey}
            icon="content-copy"
            additionalStyles={styles.button}
          />
          <ButtonWithTextAndIcon
            title="Learn More"
            onPress={onLearnMore}
            icon="open-in-new"
            additionalStyles={styles.button}
          />
        </View>
      </View>
    </View>
  );
};
