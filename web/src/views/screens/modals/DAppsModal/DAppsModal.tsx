import { useNavigate } from 'react-router-dom';
import DEXLogo from '@assets/img/DApps/0x.png';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { DApp } from '@models/dApps';
import { useShouldEnableSwaps } from '@react-shared';
import { TabRoute } from '@root/App/TabNavigator/TabContainer/TabContainer';
import { IconType, renderIcon } from '@services/util/icon-service';
import { Constants } from '@utils/constants';
import { ListItem } from '@views/components/ListItem/ListItem';
import styles from './DAppsModal.module.scss';

type Props = {
  onClose: () => void;
};

export const DAppsModal: React.FC<Props> = ({ onClose }) => {
  const { shouldEnableSwaps } = useShouldEnableSwaps();
  const navigate = useNavigate();

  const dApps: DApp[] = [
    {
      name: 'Railway DEX',
      href: TabRoute.Swap,
      description: 'Private and public swaps',
      icon: DEXLogo,
      enabled: shouldEnableSwaps,
    },
    {
      name: 'Farm',
      href: TabRoute.Farm,
      icon: IconType.TractorIcon,
      description: 'Earn yield',
      enabled: Constants.SHOW_FARM_FEATURE,
    },
    {
      name: 'Liquidity',
      href: TabRoute.Liquidity,
      icon: IconType.Pool,
      description: 'Manage DEX liquidity',
      enabled: true,
    },
  ];
  const enabledDapps = dApps.filter(dapp => dapp.enabled);

  const handleGoToDApp = (href: TabRoute) => () => {
    navigate(href);
    onClose();
  };

  const renderDApp = (
    { name, icon, description, href }: DApp,
    index: number,
  ) => {
    return (
      <ListItem
        key={index}
        title={name}
        className={styles.dApp}
        titleClassName={styles.dAppTitle}
        description={description}
        onPress={handleGoToDApp(href)}
        descriptionClassName={styles.dAppDescription}
        left={() => (
          <div className={styles.iconContainer}>
            {renderIcon(icon, 32, styles.icon)}
          </div>
        )}
      />
    );
  };

  return (
    <>
      <GenericModal onClose={onClose} title="dApps">
        <div className="hide-scroll">{enabledDapps.map(renderDApp)}</div>
      </GenericModal>
    </>
  );
};
