import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SeedPhraseView } from "@components/views/SeedPhraseView/SeedPhraseView";
import { useSecurityAuthorization } from "@hooks/security/useSecurityAuthorization";
import { SettingsStackParamList } from "@models/navigation-models";
import { RouteProp } from "@react-navigation/native";
import { styleguide } from "@react-shared";
import { EnterPinModal } from "@screens/modals/EnterPinModal/EnterPinModal";
import { SettingsListHeader } from "@screens/tabs/SettingsScreen/SettingsListHeader/SettingsListHeader";
import { styles } from "./styles";

type Props = {
  route: RouteProp<
    { params: SettingsStackParamList["ShowSeedPhrase"] },
    "params"
  >;
};

export const ShowSeedPhraseScreen: React.FC<Props> = ({ route }) => {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [showEnterPinModal, setShowEnterPinModal] = useState(false);
  const [mnemonicLength, setMnemonicLength] = useState<number>(0);

  const success = () => setAuthSuccess(true);
  const fail = () => setShowEnterPinModal(true);
  const { authenticate } = useSecurityAuthorization(success, fail);

  const { wallet } = route.params;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <EnterPinModal
        show={showEnterPinModal}
        allowBackNav={true}
        authorizeSession={() => {
          setShowEnterPinModal(false);
          setAuthSuccess(true);
        }}
      />
      <AppHeader
        title="Seed Phrase"
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Wallet" />}
        isModal={false}
      />
      {authSuccess && (
        <View style={styles.wrapper}>
          <SettingsListHeader title={`${mnemonicLength}-word seed phrase`} />
          <SeedPhraseView
            wallet={wallet}
            setMnemonicWordCount={setMnemonicLength}
          />
          <View style={styles.textNoticeWrapper}>
            <Text style={styles.textNotice}>
              This seed phrase is the only way to recover and access your
              wallet. Your wallet will not be available after deleting the app
              or restoring from a backup.
            </Text>
            <Text style={styles.textNotice}>Keep it secret, keep it safe.</Text>
          </View>
        </View>
      )}
    </>
  );
};
