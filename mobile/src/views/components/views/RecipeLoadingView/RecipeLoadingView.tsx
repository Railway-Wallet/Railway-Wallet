import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SpinnerCubes } from "@components/loading/SpinnerCubes/SpinnerCubes";
import { styleguide } from "@react-shared";
import { Icon } from "@views/components/icons/Icon";
import { ErrorDetailsModal } from "@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { styles } from "./styles";

type Props = {
  recipeError: Optional<Error>;
  recipeName: string;
  goBack: () => void;
};

export const RecipeLoadingView = ({
  recipeError,
  recipeName,
  goBack,
}: Props) => {
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  if (isDefined(recipeError)) {
    return (
      <>
        <AppHeader
          allowFontScaling={true}
          isModal={false}
          headerLeft={<HeaderBackButton customAction={goBack} />}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            {recipeError.message}{" "}
            <Text style={styles.errorShowMore} onPress={openErrorDetailsModal}>
              (show more)
            </Text>
          </Text>
        </View>
        {isDefined(recipeError) && (
          <ErrorDetailsModal
            error={recipeError}
            show={showErrorDetailsModal}
            onDismiss={dismissErrorDetailsModal}
          />
        )}
      </>
    );
  }

  return (
    <View style={styles.recipeLoadingViewContainer}>
      <View style={styles.textAndImageContainer}>
        <Icon source="chef-hat" size={48} color={styleguide.colors.text()} />
        <Text
          style={styles.loadingTitle}
        >{`Cooking up ${recipeName} Recipe...`}</Text>
      </View>
      <SpinnerCubes size={50} />
    </View>
  );
};
