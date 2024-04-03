import { isDefined } from '@railgun-community/shared-models';
import { CSSProperties } from 'react';
import cn from 'classnames';
import styles from './Text.module.scss';

export type TextProps = {
  fontSize?: string | number;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  color?: string;
  children: React.ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export const Text = ({
  fontSize,
  color,
  fontWeight,
  children,
  style,
  onClick,
  onMouseLeave,
  onMouseEnter,
  className,
}: TextProps) => {
  const textStyles = {
    color,
    fontSize,
    fontWeight,
  };

  return (
    <div
      className={cn(
        styles.text,
        'text-item no-text-select',
        { [styles.clickable]: isDefined(onClick) },
        className,
      )}
      style={Object.assign({}, textStyles, style)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};
