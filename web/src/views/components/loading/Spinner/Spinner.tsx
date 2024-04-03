import { SpinnerDiamond } from 'spinners-react';

type Props = {
  size?: number;
  color?: string;
  secondaryColor?: string;
  className?: string;
};

export const Spinner: React.FC<Props> = ({
  color = 'white',
  secondaryColor = 'gray',
  size = 64,
  className,
}) => {
  return (
    <SpinnerDiamond
      color={color}
      secondaryColor={secondaryColor}
      size={size}
      className={className}
      speed={169}
    />
  );
};
