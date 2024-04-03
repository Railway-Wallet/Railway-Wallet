import { SyntheticEvent, useState } from 'react';
import cn from 'classnames';
import { Text } from '@components/Text/Text';
import styles from './TextButton.module.scss';

type Action = (e: SyntheticEvent) => void;

export type TextActionButton = {
  text: string;
  action: Action;
};

type Props = {
  text: string;
  action: Optional<Action>;
  containerClassName?: string;
  textClassName?: string;
  disabled?: boolean;
};

export const TextButton = ({
  text,
  action,
  containerClassName,
  textClassName,
  disabled = false,
}: Props) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn(styles.container, containerClassName)}>
      <div
        className={styles.textContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={!disabled ? action : undefined}
      >
        <Text
          className={cn(styles.text, textClassName, {
            [styles.hovered]: !disabled && isHovered,
          })}
        >
          {text}
        </Text>
      </div>
    </div>
  );
};
