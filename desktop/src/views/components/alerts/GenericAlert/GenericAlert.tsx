import { isDefined } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import styles from './GenericAlert.module.scss';

export enum AlertButtonPosition {
  TopRight = 'top-right',
  BottomCenter = 'bottom-center',
}

export interface AlertProps {
  title?: string;
  message?: string;
  onClose: () => void;
  onSubmit?: (inputValue: string | undefined) => void;
  submitTitle?: string;
  shouldCloseOnOverlayClick?: boolean;
  canDismiss?: boolean;
  showInput?: boolean;
  inputPlaceholder?: string;
  maxLength?: number;
  buttonPosition?: AlertButtonPosition;
  submitButtonClassName?: string;
  inputLabel?: string;
  messageClassName?: string;
  inputType?: string;
  disableInputAutoComplete?: boolean;
  buttonLoading?: boolean;
  buttonDisabled?: boolean;
  footerView?: React.ReactNode;
  hideSubmitButton?: boolean;
}

export const GenericAlert: React.FC<AlertProps> = ({
  title,
  message,
  onClose,
  onSubmit,
  submitTitle,
  shouldCloseOnOverlayClick = true,
  canDismiss = true,
  showInput = false,
  inputPlaceholder,
  maxLength,
  inputLabel,
  buttonLoading,
  buttonDisabled,
  buttonPosition = AlertButtonPosition.TopRight,
  submitButtonClassName,
  messageClassName,
  inputType,
  hideSubmitButton,
  footerView,
  disableInputAutoComplete = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const shouldHideSubmitButton =
    isDefined(hideSubmitButton) && hideSubmitButton;

  const updateInputValue = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const formatSubmitButtonTitle = () => {
    if (isDefined(submitTitle)) {
      return submitTitle;
    }

    if (showInput) {
      return 'Submit';
    }

    return 'Okay';
  };

  const renderSubmitButton = () => {
    if (shouldHideSubmitButton) {
      return;
    }

    let submitStyles = '';
    if (buttonPosition === AlertButtonPosition.BottomCenter) {
      submitStyles = styles.bottomSubmitStyles;
    }
    return (
      (<Button
        loading={buttonLoading}
        disabled={buttonDisabled}
        buttonClassName={cn(submitStyles, submitButtonClassName)}
        onClick={() => {
          onSubmit ? onSubmit(inputValue) : onClose();
        }}
      >
        {formatSubmitButtonTitle()}
      </Button>)
    );
  };

  return (
    <GenericModal
      onClose={onClose}
      title={title}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick && canDismiss}
      accessoryView={
        buttonPosition === AlertButtonPosition.TopRight
          ? renderSubmitButton()
          : undefined
      }
      showClose={canDismiss}
    >
      <>
        {isDefined(message) ? (
          <Text
            className={cn(
              styles.messageText,
              'selectable-text',
              messageClassName,
            )}
          >
            {message}
          </Text>
        ) : undefined}
        {showInput && (
          <div className={styles.inputContainer}>
            {isDefined(inputLabel) && (
              <Text className={styles.inputLabel}>{inputLabel}</Text>
            )}
            <Input
              autoComplete={
                disableInputAutoComplete ? 'new-password' : undefined
              }
              value={inputValue}
              onChange={updateInputValue}
              placeholder={inputPlaceholder}
              autoFocus={true}
              type={inputType}
              maxLength={maxLength}
            />
          </div>
        )}
        {isDefined(footerView) && footerView}
        {!shouldHideSubmitButton &&
          buttonPosition === AlertButtonPosition.BottomCenter && (
            <div className={styles.bottomSubmitContainer}>
              {renderSubmitButton()}
            </div>
          )}
      </>
    </GenericModal>
  );
};
