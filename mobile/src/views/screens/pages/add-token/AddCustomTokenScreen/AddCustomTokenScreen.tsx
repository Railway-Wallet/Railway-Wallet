import React from "react";
import { AddTokenStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { SearchableERC20 } from "@react-shared";
import { AddCustomTokenView } from "../../../../components/views/AddCustomTokenView/AddCustomTokenView";

type Props = {
  navigation: NavigationProp<AddTokenStackParamList, "AddCustomTokenScreen">;
  route: RouteProp<
    { params: AddTokenStackParamList["AddCustomTokenScreen"] },
    "params"
  >;
};

export const AddCustomTokenScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const onSuccess = (token: SearchableERC20) => {
    navigation.navigate("AddTokensScreen", {
      customToken: token,
      initialTokenAddress: undefined,
    });
  };

  return (
    <>
      <AddCustomTokenView
        initialAddTokenAddress={route.params?.initialTokenAddress}
        onSuccess={onSuccess}
      />
    </>
  );
};
