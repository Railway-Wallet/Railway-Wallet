import React, { ReactNode } from 'react';
import { ListRow } from '@components/ListRow/ListRow';

type Props = {
  title: string;
  description: string;
  selected?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  rightView: () => ReactNode;
};

export const NetworkFeeOption: React.FC<Props> = ({
  title,
  description,
  selected,
  onSelect,
  onDoubleClick,
  rightView,
}) => {
  return (
    <ListRow
      title={title}
      description={description}
      selected={selected}
      rightView={rightView}
      onSelect={onSelect}
      onDoubleClick={onDoubleClick}
      defaultNoBorder
    />
  );
};
