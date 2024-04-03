import { styleguide } from '@react-shared';
import application from '@scss/application.module.scss';

export const defaultModalStyle = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: styleguide.colors.gray5(),
    border: `1px solid ${styleguide.colors.gray9()}`,
    padding: 0,
  },
  overlay: {
    background: styleguide.colors.gray(0.8),
    zIndex: application.zIndexModals,
  },
};
