import { isDefined } from '@railgun-community/shared-models';
import React, { LegacyRef, useState } from 'react';
import cn from 'classnames';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Text } from '@components/Text/Text';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './Button.module.scss';

enum ButtonTypes {
  Submit = 'submit',
  Button = 'button',
  Reset = 'reset',
}

export interface ButtonProps {
  buttonActiveClassName?: string;
  buttonClassName?: string;
  textClassName?: string;
  type?: ButtonTypes;
  alt?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onSubmit?: () => void;
  ref?: LegacyRef<HTMLButtonElement>;
  disabled?: boolean;
  iconSize?: number;
  startIcon?: IconType;
  endIcon?: IconType | string;
  iconOnly?: boolean;
  subText?: string;
  spreadIconsEvenly?: boolean;
  testId?: string;
  loading?: boolean;
  spinnerSize?: number;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      buttonClassName,
      buttonActiveClassName,
      textClassName,
      alt,
      children,
      disabled,
      iconSize,
      startIcon,
      endIcon,
      iconOnly = false,
      subText,
      loading = false,
      spinnerSize,
      onClick,
      spreadIconsEvenly,
      testId,
      ...rest
    },
    ref,
  ) => {
    const [active, setActive] = useState(false);

    const getButtonStyles = () => {
      return cn(
        styles.button,
        buttonClassName,
        {
          [styles.buttonIconOnly]: iconOnly,
          [styles.buttonActive]: active,
          [styles.disabled]: disabled,
        },
        active && buttonActiveClassName,
      );
    };

    return (
      <button
        {...rest}
        onClick={onClick}
        className={getButtonStyles()}
        onMouseDown={() => setActive(true)}
        onMouseUp={() => setActive(false)}
        ref={ref}
        disabled={disabled}
        data-testid={testId}
      >
        <div
          className={cn(styles.rowContainer, {
            [styles.rowContainerSpreadEvenly]: spreadIconsEvenly,
          })}
        >
          {loading ? (
            <Spinner size={spinnerSize ?? 24} />
          ) : (
            <>
              {startIcon && (
                <div
                  className={cn(styles.icon, { [styles.iconLeft]: !iconOnly })}
                >
                  {renderIcon(startIcon, iconSize)}
                </div>
              )}
              <div className={styles.columnContainer}>
                <Text className={cn(styles.text, textClassName)}>
                  {children ?? ''}
                </Text>
                {isDefined(subText) && (
                  <Text className={styles.subText}>{subText}</Text>
                )}
              </div>
              {isDefined(endIcon) && (
                <div
                  className={cn(styles.icon, { [styles.iconRight]: !iconOnly })}
                >
                  {renderIcon(endIcon, iconSize)}
                </div>
              )}
            </>
          )}
        </div>
      </button>
    );
  },
);
