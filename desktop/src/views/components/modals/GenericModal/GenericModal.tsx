import React, { ReactElement } from 'react';
import Modal from 'react-modal';
import cn from 'classnames';
import { useCloseOnEsc } from '@hooks/useCloseOnEsc';
import { styleguide } from '@react-shared';
import { GenericModalHeader } from './GenericModalHeader/GenericModalHeader';
import styles from './GenericModal.module.scss';
import application from '@scss/application.module.scss';

type Props = {
  title?: string;
  onClose: () => void;
  onBack?: () => void;
  isBackChevron?: boolean;
  accessoryView?: ReactElement;
  shouldCloseOnOverlayClick?: boolean;
  showClose?: boolean;
  children: React.ReactNode;
  setModalContentRef?: (modalContentRef: HTMLDivElement) => void;
  contentOverrideStyles?: React.CSSProperties | undefined;
  overlayOverrideStyles?: React.CSSProperties | undefined;
};

const modalStyles = {
  content: {
    backgroundColor: styleguide.colors.gray5(),
    border: `1px solid ${styleguide.colors.gray9()}`,
    boxShadow: `3px 3px 5px 0px ${styleguide.colors.gray()}`,
    padding: 0,
    width: 520,
    maxHeight: 'calc(100% - 80px)',
    display: 'flex',
    flexDirection: 'column' as 'column',
    overflowX: 'hidden' as 'hidden',
    overflowY: 'hidden' as 'hidden',
    maxWidth: 'calc(100% - 40px)',
  },
  overlay: {
    background: styleguide.colors.gray(0.8),
    zIndex: application.zIndexModals,
  },
};

export const GenericModal: React.FC<Props> = ({
  title,
  onClose,
  onBack,
  isBackChevron,
  accessoryView,
  children,
  shouldCloseOnOverlayClick = true,
  showClose = true,
  setModalContentRef,
  contentOverrideStyles,
  overlayOverrideStyles,
}) => {
  Modal.setAppElement('#root');

  useCloseOnEsc(() => {
    if (shouldCloseOnOverlayClick) {
      onClose();
    }
  });

  const allModalStyles = {
    content: {
      ...modalStyles.content,
      ...contentOverrideStyles,
    },
    overlay: {
      ...modalStyles.overlay,
      ...overlayOverrideStyles,
    },
  };

  return (
    // @ts-expect-error ignore this
    <Modal
      isOpen
      className={cn(styles.genericModalContent, 'hide-scroll')}
      style={allModalStyles}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      onRequestClose={() => {
        shouldCloseOnOverlayClick && onClose();
      }}
      contentRef={setModalContentRef}
    >
      <>
        <GenericModalHeader
          onClose={() => onClose()}
          onBack={onBack}
          title={title}
          isBackChevron={isBackChevron}
          accessoryView={accessoryView}
          showClose={showClose}
          className={styles.header}
        />
        <div className={styles.content}>{children}</div>
      </>
    </Modal>
  );
};
