import { isDefined } from '@railgun-community/shared-models';
import { createRef, useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import cn from 'classnames';
import { useFocus } from '@hooks/useFocus';
import { styleguide } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './Input.module.scss';

export type InputProps = {
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onFocus?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onBlur?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onPress?: () => void;
  value?: string;
  alt?: string;
  startIcon?: IconType;
  endIcon?: IconType;
  iconSize?: number;
  placeholder?: string;
  height?: string | number;
  type?: string;
  maxWidth?: number;
  overrideInputContainerClassName?: string;
  overrideInputClassName?: string;
  iconClassName?: string;
  hasError?: boolean;
  maxLength?: number;
  rightView?: React.ReactElement;
  isTextArea?: boolean;
  disabled?: boolean;
  autoCapitalize?: string;
  autoFocus?: boolean;
  onKeyDown?: (event: any) => void;
  testId?: string;
  autoComplete?: string;
};

export const Input = ({
  onChange,
  onFocus,
  onBlur,
  onPress,
  value,
  startIcon,
  endIcon,
  iconSize = 24,
  placeholder,
  height,
  type,
  overrideInputContainerClassName,
  overrideInputClassName,
  iconClassName,
  hasError,
  maxLength,
  maxWidth,
  rightView,
  isTextArea = false,
  disabled = false,
  autoCapitalize,
  autoFocus,
  onKeyDown,
  testId,
  autoComplete = 'on',
}: InputProps) => {
  const [selected, setSelected] = useState(false);

  const inputContainerRef = createRef<HTMLDivElement>();
  const [inputRef, setInputFocus, setInputBlur] = useFocus<HTMLInputElement>();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        (inputContainerRef?.current?.contains(event.target as Node) ?? false) &&
        !disabled
      ) {
        return setSelected(true);
      }

      return setSelected(false);
    };
    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [disabled, inputContainerRef]);

  const inputProps = {
    onChange,
    value,
    placeholder,
    type,
    onFocus,
    onBlur,
    maxLength,
    disabled,
    spellCheck: false,
    autoCapitalize,
    autoFocus,
    autoComplete,
  };

  const createIcon = (icon: IconType) => {
    return (
      <div className={cn(styles.icon, iconClassName)}>
        {renderIcon(icon, iconSize, styleguide.colors.lighterLabelSecondary)}
      </div>
    );
  };

  const handleOnClick = () => {
    if (onPress) {
      setInputBlur();
      onPress?.();
    } else {
      setInputFocus();
    }
  };

  return (
    <div
      className={cn(styles.inputContainer, overrideInputContainerClassName, {
        [styles.inputError]: hasError,
        [styles.selectedContainer]: selected && !disabled,
        [styles.startIconInputContainer]: startIcon,
        [styles.clickableInput]: isDefined(onPress),
        [styles.disabledContainer]: disabled,
      })}
      style={{
        height: isDefined(height) ? height : undefined,
        maxWidth: isDefined(maxWidth) ? maxWidth : undefined,
      }}
      ref={inputContainerRef}
      onClick={handleOnClick}
    >
      {startIcon && createIcon(startIcon)}
      {!isTextArea && (
        <input
          data-testid={testId}
          {...inputProps}
          ref={inputRef}
          onKeyDown={onKeyDown}
          className={cn(
            styles.input,
            {
              [styles.selectedInput]: selected,
              [styles.clickableInput]: isDefined(onPress),
              [styles.disabledInput]: disabled,
            },
            overrideInputClassName,
          )}
        />
      )}
      {isTextArea && (
        <TextareaAutosize
          {...inputProps}
          data-testid={testId}
          onKeyDown={onKeyDown}
          className={cn(styles.input, styles.textarea, {
            [styles.selectedInput]: selected,
          })}
        />
      )}
      {endIcon && createIcon(endIcon)}
      {rightView && <div className={styles.rightView}>{rightView}</div>}
    </div>
  );
};
