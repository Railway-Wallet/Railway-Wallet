import React from 'react';
import { styleguide } from '@react-shared';

type Props = {
  barColor?: string;
  bgColor?: string;
  borderColor?: string;
  progress: number;
  height?: number;
  className?: string;
};

export const ProgressBar: React.FC<Props> = ({
  barColor = styleguide.colors.txGreen(),
  bgColor = '#000',
  borderColor = '#fff',
  progress,
  height = 6,
  className,
}) => {
  const containerStyles = {
    height,
    width: '100%',
    backgroundColor: bgColor,
    borderRadius: 50,
    borderWidth: 1,
    borderColor,
    borderStyle: 'solid',
  };

  const barStyles = {
    height: '100%',
    width: `${progress}%`,
    backgroundColor: barColor,
    borderRadius: 'inherit',
    transition: 'width 180ms ease-in-out',
  };

  return (
    <div style={containerStyles} className={className}>
      <div style={barStyles} />
    </div>
  );
};
