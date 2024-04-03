import cn from 'classnames';
import { Text } from '@components/Text/Text';
import ActionSheet, {
  ActionSheetRef,
} from '@railway-developer/actionsheet-react';
import { styleguide } from '@react-shared';
import styles from './StyledActionSheet.module.scss';

export type ActionSheetOption = {
  name: string;
  action: () => void;
  disabled?: boolean;
};

type Props = {
  title: string;
  actionSheetOptions: ActionSheetOption[];
  onSelectOption: (option: ActionSheetOption) => void;
  actionSheetRef: React.MutableRefObject<ActionSheetRef | undefined>;
};

export const StyledActionSheet: React.FC<Props> = ({
  title,
  actionSheetOptions,
  onSelectOption,
  actionSheetRef,
}: Props) => {
  return (
    <ActionSheet
      ref={actionSheetRef}
      sheetStyle={{
        backgroundColor: styleguide.colors.gray5(),
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingBottom: 20,
      }}
      bgStyle={{ backgroundColor: styleguide.colors.gray(0.75) }}
      bgTransition="transform 0.1s linear"
      sheetTransition="transform 0.1s linear"
    >
      <div className={styles.actionSheetBar} />
      <div className={styles.titleContainer}>
        <Text className={styles.title}>{title}</Text>
      </div>
      <div className={styles.optionsContainer}>
        {actionSheetOptions.map((option, i) => (
          <div
            key={i}
            onClick={() => onSelectOption(option)}
            className={cn(styles.actionSheetLabel, {
              [styles.labelDisabled]: option.disabled,
              [styles.labelClickable]: !(option.disabled ?? false),
            })}
          >
            {option.name}
          </div>
        ))}
      </div>
    </ActionSheet>
  );
};
