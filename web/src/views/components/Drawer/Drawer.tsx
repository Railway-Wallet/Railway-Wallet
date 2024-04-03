import { useCloseOnEsc } from '@hooks/useCloseOnEsc';
import { Backdrop } from '../Backdrop/Backdrop';
import { DrawerContent, SlideDirection } from './DrawerContent/DrawerContent';

type ModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  headerText?: string;
  variant?: SlideDirection;
  drawerWidth?: number;
  drawerHeight?: number | string;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  iconSize?: number;
  borderGradient?: string;
  isRailgun?: boolean;
  showWalletAddress?: boolean;
};

export const Drawer = ({
  isOpen,
  onRequestClose,
  children,
  headerText,
  variant,
  drawerWidth,
  drawerHeight,
  contentClassName,
  headerClassName,
  className,
  iconSize,
  isRailgun,
  showWalletAddress,
}: ModalProps) => {
  useCloseOnEsc(onRequestClose);

  return (
    <>
      <DrawerContent
        show={isOpen}
        onRequestClose={onRequestClose}
        headerText={headerText}
        variant={variant}
        drawerWidth={drawerWidth}
        drawerHeight={drawerHeight}
        contentClassName={contentClassName}
        headerClassName={headerClassName}
        className={className}
        iconSize={iconSize}
        isRailgun={isRailgun}
        showWalletAddress={showWalletAddress}
      >
        {isOpen && children}
      </DrawerContent>
      {isOpen && <Backdrop onClick={onRequestClose} />}
    </>
  );
};
