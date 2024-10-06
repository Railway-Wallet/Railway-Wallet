import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { ViewingKeyView } from "@components/views/ViewingKeyView/ViewingKeyView";
import { useSecurityAuthorization } from "@hooks/security/useSecurityAuthorization";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { CalloutType, logDevError, styleguide } from "@react-shared";
import { EnterPinModal } from "@screens/modals/EnterPinModal/EnterPinModal";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { VIEWING_KEY_INFO_CALLOUT_TEXT } from "../../import-create/ViewingKeyCalloutScreen/ViewingKeyCalloutScreen";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "ShowViewingKey">;
  route: RouteProp<
    { params: SettingsStackParamList["ShowViewingKey"] },
    "params"
  >;
};

export const ShowViewingKeyScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [showEnterPinModal, setShowEnterPinModal] = useState(false);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const success = () => setAuthSuccess(true);
  const fail = () => setShowEnterPinModal(true);
  const { authenticate } = useSecurityAuthorization(success, fail);

  const { wallet } = route.params;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onViewingKeyFail = () => {
    const error = new Error("Failed to Fetch Viewing Key", {
      cause: new Error(
        "Please set this wallet as the active wallet and try again."
      ),
    });
    logDevError(error);
    setErrorModal({
      show: true,
      error,
      onDismiss: () => {
        setErrorModal(undefined);
        navigation.goBack();
      },
    });
  };

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
        title="Shareable Viewing Key"
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Wallet" />}
        isModal={false}
      />
      {authSuccess && (
        <View style={styles.wrapper}>
          <InfoCallout
            type={CalloutType.Info}
            text={VIEWING_KEY_INFO_CALLOUT_TEXT}
          />
          <ViewingKeyView wallet={wallet} onViewingKeyFail={onViewingKeyFail} />
        </View>
      )}
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};
