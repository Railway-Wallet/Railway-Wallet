import {
  ERC20Token,
  getTokenDisplayName,
  imageForToken,
  ImageTokenPlaceholder,
  useReduxSelector,
} from '@react-shared';
import { parseTokenIcon } from '@utils/images';

type Props = {
  token: ERC20Token;
  className: string;
};

export const TokenIcon: React.FC<Props> = ({ token, className }) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const availableWallets = wallets.available;

  return (
    <img
      src={parseTokenIcon(imageForToken(token))}
      className={className}
      alt={getTokenDisplayName(token, availableWallets, network.current.name)}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null;
        currentTarget.src = ImageTokenPlaceholder();
      }}
    />
  );
};
