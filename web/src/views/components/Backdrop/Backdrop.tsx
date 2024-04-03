import styles from './Backdrop.module.scss';

type Props = {
  onClick?: () => void;
};

export const Backdrop = ({ onClick }: Props) => {
  return <div className={styles.container} onClick={onClick} />;
};
