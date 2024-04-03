import { isDefined } from '@railgun-community/shared-models';
import React, { ReactNode, useState } from 'react';
import { Text, View } from 'react-native';
import { formatNumberToLocale } from '@react-shared';
import { PasteTooltip } from '@views/components/animations/PasteTooltip/PasteTooltip';
import { styles } from './styles';

type Props = {
  numEntryString: string;
  errorText?: string;
  focused: boolean;
  placeholder: string;
  leftView: () => ReactNode;
  rightView: () => ReactNode;
  updateAmount?: (value: string) => void;
};

export const ERC20EntryAmountButtonRow: React.FC<Props> = ({
  numEntryString,
  errorText,
  focused,
  placeholder,
  leftView,
  updateAmount,
  rightView,
}) => {
  const enablePasteFeature = isDefined(updateAmount);
  const [visibilityPasteTooltip, setVisibilityPasteTooltip] = useState(false);

  return (
    <View style={styles.wrapper}>
      {isDefined(leftView) && leftView()}
      <View
        style={[
          styles.titleWrapper,
          focused ? styles.focusedBorder : undefined,
          isDefined(errorText) ? styles.errorTitleBorder : undefined,
        ]}
      >
        <Text
          onPress={
            enablePasteFeature
              ? () => {
                  setVisibilityPasteTooltip(true);
                }
              : undefined
          }
          style={[
            styles.title,
            numEntryString === '' ? styles.placeholderTitle : undefined,
            numEntryString === '' && focused
              ? styles.placeholderTitleFocused
              : undefined,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {numEntryString === ''
            ? placeholder
            : formatNumberToLocale(numEntryString)}
        </Text>
        {enablePasteFeature && (
          <PasteTooltip
            onPaste={updateAmount}
            customStyle={styles.toastStyle}
            visibilityPasteTooltip={visibilityPasteTooltip}
            setVisibilityPasteTooltip={setVisibilityPasteTooltip}
          />
        )}
      </View>
      {rightView()}
    </View>
  );
};
