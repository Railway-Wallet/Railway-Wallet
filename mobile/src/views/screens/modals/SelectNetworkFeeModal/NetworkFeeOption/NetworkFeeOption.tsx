import React, { ReactNode } from "react";
import { ListRow } from "@components/list/ListRow/ListRow";

type Props = {
  title: string;
  description: string;
  selected?: boolean;
  onSelect?: () => void;
  rightView: () => ReactNode;
};

export const NetworkFeeOption: React.FC<Props> = ({
  title,
  description,
  selected,
  onSelect,
  rightView,
}) => {
  return (
    <ListRow
      title={title}
      description={description}
      selected={selected}
      rightView={rightView}
      onSelect={onSelect}
      defaultNoBorder
    />
  );
};
