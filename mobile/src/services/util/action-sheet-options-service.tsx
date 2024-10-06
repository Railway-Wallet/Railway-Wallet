import { isDefined } from "@railgun-community/shared-models";
import { ActionSheetOptions } from "@expo/react-native-action-sheet";
import { styleguide } from "@react-shared";

type ShowActionSheet = (
  options: ActionSheetOptions,
  callback: (i?: number) => void | Promise<void>
) => void;

export type OptionWithAction = {
  name: string;
  action: () => void | Promise<void>;
  isDestructive?: boolean;
  disabled?: boolean;
};

export const callActionSheet = (
  showActionSheet: ShowActionSheet,
  title: string,
  optionsWithActions: OptionWithAction[]
) => {
  const numButtons = optionsWithActions.length;
  const cancelIndex = numButtons;
  const options = optionsWithActions.map((o) => o.name);
  const destructiveIndices: number[] = [];
  const disabledIndices: number[] = [];
  for (let i = 0; i < optionsWithActions.length; i++) {
    const option = optionsWithActions[i];
    if (option.isDestructive ?? false) {
      destructiveIndices.push(i);
    }
    if (option.disabled ?? false) {
      disabledIndices.push(i);
    }
  }

  showActionSheet(
    {
      title: title,
      options: [...options, "Cancel"],
      cancelButtonIndex: cancelIndex,
      destructiveButtonIndex: destructiveIndices,
      disabledButtonIndices: disabledIndices,
      userInterfaceStyle: "dark",
      textStyle: {
        ...styleguide.typography.label,
        color: styleguide.colors.text(),
      },
      titleTextStyle: {
        ...styleguide.typography.caption,
        color: styleguide.colors.labelSecondary,
      },
      messageTextStyle: {
        ...styleguide.typography.paragraphSmall,
        color: styleguide.colors.labelSecondary,
      },
      containerStyle: {
        backgroundColor: styleguide.colors.gray5(),
      },
      destructiveColor: styleguide.colors.danger,
    },
    async (i?: number) => {
      if (isDefined(i) && i < cancelIndex) {
        await optionsWithActions[i].action();
      }
    }
  );
};
