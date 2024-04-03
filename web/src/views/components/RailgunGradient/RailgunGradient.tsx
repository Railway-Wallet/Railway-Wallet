import React, { ReactNode } from 'react';
import { styleguide } from '@react-shared';

export type GradientStyle = {
  colors: string[];
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
  locations: number[];
  useAngle: boolean;
  angle: number;
  angleCenter: {
    x: number;
    y: number;
  };
};

type Props = {
  className?: string;
  gradient?: GradientStyle;
  children: ReactNode;
  onClick?: () => void;
};

export const RailgunGradient: React.FC<Props> = ({
  className,
  children,
  gradient = styleguide.colors.gradients.railgun,
  onClick,
}) => {
  const linearGradient = `linear-gradient(to bottom left, ${gradient.colors})`;

  return (
    <div
      className={className}
      style={{
        background: linearGradient,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
