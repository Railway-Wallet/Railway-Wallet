import { isDefined, removeUndefineds } from "@railgun-community/shared-models";
import React, { MutableRefObject, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardTypeOptions,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { useClickOutside } from "react-native-click-outside";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { styleguide } from "@react-shared";
import { Icon, IconSource } from "@views/components/icons/Icon";
import { styles } from "./styles";

type TextInputIconButton = {
  icon: string;
  onTap: () => void;
  disabled?: boolean;
};

export type TextEntryProps = TextInputProps & {
  label?: string;
  labelIcon?: IconSource;
  labelIconColor?: string;
  labelIconSize?: number;
  useNumberPad?: boolean;
  useSecureEntry?: boolean;
  iconButtons?: Optional<TextInputIconButton>[];
  viewStyles?: (ViewStyle | undefined)[];
  reference?: MutableRefObject<TextInput | null>;
};

export const TextEntry: React.FC<TextEntryProps> = ({
  label,
  labelIcon,
  labelIconColor,
  labelIconSize,
  viewStyles = [],
  useNumberPad = false,
  useSecureEntry = false,
  iconButtons,
  returnKeyType,
  blurOnSubmit,
  reference,
  ...props
}) => {
  const [secureTextEntry, setSecureTextEntry] = useState(useSecureEntry);

  const textInputRef = useRef<TextInput | null>(null);
  const clickOutsideRef = useClickOutside<View>(() => {
    const ref = reference ?? textInputRef;
    if (ref.current?.isFocused() ?? false) {
      Keyboard.dismiss();
    }
  });

  const onTapPasswordIcon = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const keyboardType: KeyboardTypeOptions = useNumberPad
    ? "number-pad"
    : "default";

  const labelText = () => {
    return (
      isDefined(label) && (
        <Text style={styles.label} testID="TextEntry-Text-Label">
          {label}
          {isDefined(labelIcon) && (
            <View style={styles.labelIcon}>
              <Icon
                source={labelIcon}
                size={labelIconSize ?? 16}
                color={labelIconColor ?? styleguide.colors.labelSecondary}
              />
            </View>
          )}
        </Text>
      )
    );
  };

  const iconButtonsWithSecureEntry: TextInputIconButton[] = [];
  if (iconButtons) {
    iconButtonsWithSecureEntry.push(...removeUndefineds(iconButtons));
  }
  if (useSecureEntry) {
    iconButtonsWithSecureEntry.push({
      icon: secureTextEntry ? "eye-off-outline" : "eye-outline",
      onTap: onTapPasswordIcon,
    });
  }

  const rightIconButtons = () => {
    return (
      <View style={styles.icons}>
        {iconButtonsWithSecureEntry?.map((iconButton, index) => {
          return (
            <ButtonIconOnly
              onTap={iconButton.onTap}
              icon={iconButton.icon}
              key={index}
              size={20}
              color={
                iconButton.disabled ?? false
                  ? styleguide.colors.inputBorder
                  : styleguide.colors.labelSecondary
              }
              disabled={iconButton.disabled}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View ref={clickOutsideRef} style={[styles.wrapper, ...viewStyles]}>
      <View style={styles.topWrapper}>
        {labelText()}
        {rightIconButtons()}
      </View>
      <TextInput
        ref={reference ?? textInputRef}
        style={[
          styles.textInput,
          iconButtonsWithSecureEntry.length ? styles.textInputWithIcon : null,
          isDefined(label) ? styles.textInputTopPadding : null,
        ]}
        keyboardType={keyboardType}
        secureTextEntry={useSecureEntry}
        keyboardAppearance="dark"
        placeholderTextColor={styleguide.colors.textSecondary}
        autoCorrect={false}
        spellCheck={false}
        returnKeyType={returnKeyType ?? "done"}
        blurOnSubmit={blurOnSubmit ?? true}
        {...props}
        pointerEvents={props.editable === false ? "none" : "auto"}
      />
    </View>
  );
};
