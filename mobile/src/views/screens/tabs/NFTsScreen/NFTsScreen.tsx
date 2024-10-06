import React, { useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingHeader } from "@components/headers/FloatingHeader/FloatingHeader";
import { TabHeaderText } from "@components/text/TabHeaderText/TabHeaderText";
import { NFTsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import { styleguide } from "@react-shared";
import { calculateFloatingHeaderOpacityFromPageContentOffset } from "../WalletsScreen/WalletFloatingHeader/WalletFloatingHeader";
import { styles } from "./styles";

interface NFTsScreenProps {
  navigation: NavigationProp<NFTsStackParamList, "NFTs">;
}

export const NFTsScreen: React.FC<NFTsScreenProps> = () => {
  StatusBar.setBarStyle("light-content");

  const [headerOpacity, setHeaderOpacity] = useState(0);
  const insets = useSafeAreaInsets();

  const onPageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageContentOffset = event.nativeEvent.contentOffset.y;
    const opacity =
      calculateFloatingHeaderOpacityFromPageContentOffset(pageContentOffset);
    setHeaderOpacity(opacity);
  };

  return (
    <>
      <FloatingHeader
        opacity={headerOpacity}
        backgroundColor={styleguide.colors.headerBackground}
        title="NFTs"
        isModal={false}
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          onScroll={onPageScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.titleRow, { opacity: 1 - headerOpacity }]}>
            <TabHeaderText title="NFTs" />
          </View>
        </ScrollView>
      </View>
    </>
  );
};
