import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  showImmediateToast,
  StoredWallet,
  styleguide,
  ToastType,
  useAppDispatch,
} from "@react-shared";
import { ShowSeedPhraseQRCodeModal } from "@screens/modals/ShowSeedPhraseQRCodeModal/ShowSeedPhraseQRCodeModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";
import { SeedPhraseTextBox } from "./SeedPhraseTextBox/SeedPhraseTextBox";
import { styles } from "./styles";

type Props = {
  wallet: StoredWallet;
  setMnemonicWordCount?: (count: number) => void;
  blurSeedPhrase?: boolean;
  isLoadingMnemonic?: boolean;
  setIsLoadingMnemonic?: (isLoading: boolean) => void;
};

export const SeedPhraseView: React.FC<Props> = ({
  wallet,
  setMnemonicWordCount,
  blurSeedPhrase = false,
  setIsLoadingMnemonic,
  isLoadingMnemonic,
}) => {
  const [mnemonic, setMnemonic] = useState<Optional<string>>();
  const [showScanQRCodeModal, setShowScanQRCodeModal] =
    useState<boolean>(false);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [blurredMnemonicWords, setBlurredMnemonicWords] = useState<string[]>(
    []
  );
  const [blur, setBlur] = useState(blurSeedPhrase);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const getMnemonicWords = async () => {
      setIsLoadingMnemonic?.(true);
      const walletSecureService = new WalletSecureServiceReactNative();
      const secureMnemonic = await walletSecureService.getWalletMnemonic(
        wallet
      );
      const secureMnemonicWords = secureMnemonic.split(" ");
      const blurredMnemonicWords: string[] = [];
      secureMnemonicWords.forEach(() => blurredMnemonicWords.push("*****"));
      setBlurredMnemonicWords(blurredMnemonicWords);
      setMnemonic(secureMnemonic);
      setMnemonicWords(secureMnemonicWords);

      if (setMnemonicWordCount) {
        setMnemonicWordCount(secureMnemonicWords.length);
      }
      setIsLoadingMnemonic?.(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getMnemonicWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const onCopySeedPhrase = () => {
    if (!isDefined(mnemonic)) {
      return;
    }
    Clipboard.setString(mnemonic);
    triggerHaptic(HapticSurface.ClipboardCopy);
    dispatch(
      showImmediateToast({
        message:
          "Seed phrase copied. Be careful - it can be used to access your account.",
        type: ToastType.Copy,
      })
    );
  };

  const tapShowHideSeedPhrase = () => {
    triggerHaptic(HapticSurface.SelectItem);
    const currentBlur = blur ?? false;
    setBlur(!currentBlur);
  };

  if (isDefined(isLoadingMnemonic) && isLoadingMnemonic) {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={styleguide.colors.white} />
        <Text style={styles.loadingLabel}>
          {"Loading encrypted wallet and seed phrase…"}
        </Text>
      </View>
    );
  }

  return (
    <>
      <ShowSeedPhraseQRCodeModal
        show={showScanQRCodeModal}
        onDismiss={() => setShowScanQRCodeModal(false)}
        mnemonic={mnemonic}
      />
      <View>
        <View style={styles.textBoxWrapper}>
          {blur ?? false
            ? blurredMnemonicWords.map((word: string, index: number) => (
                <SeedPhraseTextBox text={word} key={index} blur={true} />
              ))
            : mnemonicWords.map((word: string, index: number) => (
                <SeedPhraseTextBox text={word} key={index} />
              ))}
        </View>
        {blurSeedPhrase && (
          <Text
            style={styles.showSeedPhraseText}
            onPress={tapShowHideSeedPhrase}
          >
            {blur ? "Click to show" : "Click to hide"}
          </Text>
        )}
        <View style={styles.bottomButtons}>
          <View style={styles.bottomButtons}>
            <ButtonWithTextAndIcon
              title="Copy"
              onPress={onCopySeedPhrase}
              icon="content-copy"
              additionalStyles={styles.button}
            />
            <ButtonWithTextAndIcon
              title="View QR"
              onPress={() => {
                setShowScanQRCodeModal(true);
              }}
              icon="qrcode"
              additionalStyles={styles.button}
            />
          </View>
        </View>
      </View>
    </>
  );
};
