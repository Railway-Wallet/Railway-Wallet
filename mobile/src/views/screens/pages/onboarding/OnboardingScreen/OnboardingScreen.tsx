import React, { useCallback } from "react";
import { ImageURISource, SafeAreaView, View, ViewToken } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import onboardingSecurityImage from "@assets/img/onboarding-security.png";
import onboardingSeedphraseImage from "@assets/img/onboarding-seedphrase.png";
import onboardingWelcomeImage from "@assets/img/onboarding-welcome.png";
import { RootStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { SharedConstants, StorageService } from "@react-shared";
import { OnboardingButton } from "../OnboardingButton/OnboardingButton";
import { OnboardingListItem } from "../OnboardingListItem/OnboardingListItem";
import { PaginationElement } from "../PaginationElement/PaginationElement";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<RootStackParamList, "OnboardingScreen">;
  route: RouteProp<
    { params: RootStackParamList["OnboardingScreen"] },
    "params"
  >;
};

export type AnimatedFlatListRef = Animated.FlatList<{
  text: string;
  image: ImageURISource;
}>;

const pages = [
  {
    text: "Welcome to Railway\nThe private DeFi wallet",
    image: onboardingWelcomeImage,
  },
  {
    text: "Railway Wallet takes privacy and anonymity seriously. This app exists solely on your device, does not collect any analytics and does not store any data on centralized servers. It is a non-custodial tool to help you interact on the blockchain.",
    image: onboardingSecurityImage,
  },
  {
    text: "You are in complete control and maintain sole responsibility of your data and funds at all times. It is critical that you save your seed phrase safely.\nThere are no backups.",
    image: onboardingSeedphraseImage,
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const navigateHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Tabs" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    StorageService.setItem(SharedConstants.HAS_SEEN_APP_INTRO, "1");
  };

  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const flatListRef = useAnimatedRef<AnimatedFlatListRef>();

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    flatListIndex.value = viewableItems[0].index ?? 0;
  };

  const scrollHandle = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: { text: string; image: ImageURISource };
      index: number;
    }) => {
      return <OnboardingListItem item={item} index={index} x={x} />;
    },
    [x]
  );

  const handleOnPress = () => {
    if (flatListIndex.value === pages.length - 1) {
      navigateHome();
    } else {
      flatListRef?.current?.scrollToIndex({
        index: flatListIndex.value + 1,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        onScroll={scrollHandle}
        horizontal
        scrollEventThrottle={16}
        pagingEnabled
        data={pages}
        keyExtractor={(_, index) => index.toString()}
        bounces={false}
        renderItem={renderItem as any}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
      />
      <View style={styles.bottomContainer}>
        <PaginationElement length={pages.length} x={x} />
        <OnboardingButton
          currentIndex={flatListIndex}
          length={pages.length}
          handleSubmit={handleOnPress}
        />
      </View>
    </SafeAreaView>
  );
};
