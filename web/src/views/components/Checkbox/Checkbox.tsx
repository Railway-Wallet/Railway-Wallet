import { isDefined } from '@railgun-community/shared-models';
import cn from 'classnames';
import { IconType, renderIcon } from '@services/util/icon-service';
import { Text } from '../Text/Text';
import styles from './Checkbox.module.scss';

interface Props {
  checked: boolean;
  className?: string;
  labelClassName?: string;
  medium?: boolean;
  big?: boolean;
  handleCheck?: () => void;
  label?: string;
  rightView?: React.ReactNode;
}

const getIconSize = (medium?: boolean, big?: boolean) => {
  switch (true) {
    case big:
      return 18;
    case medium:
      return 16;
    default:
      return 12;
  }
};

export function Checkbox({
  className,
  checked,
  medium,
  big,
  label,
  labelClassName,
  handleCheck,
  rightView,
}: Props) {
  const withLabel = isDefined(label);
  const iconSize = getIconSize(medium, big);

  return (
    <div
      onClick={handleCheck}
      className={cn(
        {
          [styles.checkboxContainerLabel]: withLabel,
        },
        className,
      )}
    >
      <div className={styles.checkboxContainer}>
        {checked && (
          <div className={styles.checkIcon}>
            {renderIcon(IconType.Check, iconSize)}
          </div>
        )}
        <input
          readOnly
          type="checkbox"
          checked={checked}
          onChange={handleCheck}
          className={cn(styles.checkbox, {
            [styles.medium]: medium,
            [styles.big]: big,
          })}
        />
      </div>
      {withLabel && (
        <Text className={cn(styles.label, labelClassName)}>{label}</Text>
      )}
      {isDefined(rightView) && rightView}
    </div>
  );
}
