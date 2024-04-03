import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import {
  AddTokensData,
  ApproveSpenderData,
  CancelTransactionData,
  DrawerEventData,
  DrawerName,
  ERC20InfoData,
  EVENT_CLOSE_DRAWER,
  EVENT_OPEN_DRAWER_WITH_DATA,
  FarmVaultData,
  LiquidityData,
  MintERC20sData,
  ReceiveTokensData,
  SwapPrivateData,
  SwapPublicData,
  TransferERC20Data,
  TransferNFTData,
  UnshieldToOriginData,
} from '@models/drawer-types';
import {
  getFarmActionTitle,
  getTokenDisplayHeader,
  showImmediateToast,
  ToastType,
  TransactionType,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { AddTokens } from '@screens/drawer/add-tokens/AddTokens';
import { ApproveERC20Confirm } from '@screens/drawer/approve/ApproveERC20Confirm/ApproveERC20Confirm';
import { CancelTransactionConfirm } from '@screens/drawer/cancel/CancelTransaction/CancelTransactionConfirm/CancelTransactionConfirm';
import { ExportTransactions } from '@screens/drawer/export-transactions/ExportTransactions';
import { MintERC20sConfirm } from '@screens/drawer/mint/MintERC20s/MintERC20sConfirm/MintERC20sConfirm';
import { ReceiveTokens } from '@screens/drawer/receive/ReceiveTokens/ReceiveTokens';
import { SendERC20s } from '@screens/drawer/send/SendTokens/SendERC20s';
import { SendNFTs } from '@screens/drawer/send/SendTokens/SendNFTs';
import { ShieldERC20s } from '@screens/drawer/shield/ShieldTokens/ShieldERC20s';
import { ShieldNFTs } from '@screens/drawer/shield/ShieldTokens/ShieldNFTs';
import { SwapPrivateFlow } from '@screens/drawer/swap/SwapPrivateFlow/SwapPrivateFlow';
import { SwapPublicConfirm } from '@screens/drawer/swap/SwapPublicConfirm/SwapPublicConfirm';
import { ERC20Info } from '@screens/drawer/token-info/ERC20Info';
import { UnshieldERC20s } from '@screens/drawer/unshield/UnshieldTokens/UnshieldERC20s';
import { UnshieldNFTs } from '@screens/drawer/unshield/UnshieldTokens/UnshieldNFTs';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { FarmVaultFlow } from '@views/screens/drawer/farm/FarmVaultFlow/FarmVaultFlow';
import { LiquidityFlow } from '@views/screens/drawer/liquidity/LiquidityFlow/LiquidityFlow';
import { UnshieldToOrigin } from '../../../screens/drawer/unshield/UnshieldTokens/UnshieldToOrigin';
import { Drawer } from '../Drawer';

type Props = {
  isRailgun: boolean;
};

export const DrawerManager = ({ isRailgun }: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [openDrawer, setOpenDrawer] = useState<Optional<DrawerName>>();
  const [tokenInfoData, setERC20InfoData] = useState<Optional<ERC20InfoData>>();
  const [hasValidProof, setHasValidProof] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [transferERC20Data, setTransferERC20Data] =
    useState<Optional<TransferERC20Data>>();
  const [farmERC20Data, setFarmVaultData] = useState<Optional<FarmVaultData>>();
  const [transferNFTData, setTransferNFTData] =
    useState<Optional<TransferNFTData>>();
  const [receiveTokensData, setReceiveTokensData] =
    useState<Optional<ReceiveTokensData>>();
  const [mintTokensData, setMintERC20sData] =
    useState<Optional<MintERC20sData>>();
  const [unshieldToOriginData, setUnshieldToOriginData] =
    useState<Optional<UnshieldToOriginData>>();
  const [cancelTransactionData, setCancelTransactionData] =
    useState<Optional<CancelTransactionData>>();
  const [approveSpenderData, setApproveSpenderData] =
    useState<Optional<ApproveSpenderData>>();
  const [swapPrivateData, setSwapPrivateData] =
    useState<Optional<SwapPrivateData>>();
  const [swapPublicData, setSwapPublicData] =
    useState<Optional<SwapPublicData>>();
  const [addTokensData, setAddTokensData] = useState<Optional<AddTokensData>>();
  const [liquidityERC20Data, setLiquidityERC20Data] =
    useState<Optional<LiquidityData>>();

  const dispatch = useAppDispatch();

  const drawerDataError = (drawerName: DrawerName) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${drawerName}`,
      }),
    );
  };

  const openDrawerWithData = (data: DrawerEventData) => {
    switch (data.drawerName) {
      case DrawerName.ERC20Info: {
        const extraData = data.extraData as ERC20InfoData;
        if (!isDefined(extraData.erc20)) {
          drawerDataError(data.drawerName);
          return;
        }
        if (!isDefined(extraData.balanceBucketFilter)) {
          drawerDataError(data.drawerName);
          return;
        }
        setERC20InfoData(extraData);
        break;
      }
      case DrawerName.FarmVault: {
        const extraData = data.extraData as FarmVaultData;
        setFarmVaultData(extraData);
        break;
      }
      case DrawerName.Liquidity: {
        const extraData = data.extraData as LiquidityData;
        setLiquidityERC20Data(extraData);
        break;
      }
      case DrawerName.SendERC20s:
      case DrawerName.UnshieldERC20s:
      case DrawerName.ShieldERC20s: {
        const extraData = data.extraData as TransferERC20Data;
        setTransferERC20Data(extraData);
        break;
      }
      case DrawerName.SendNFTs:
      case DrawerName.ShieldNFTs:
      case DrawerName.UnshieldNFTs: {
        const extraData = data.extraData as TransferNFTData;
        setTransferNFTData(extraData);
        break;
      }
      case DrawerName.ReceiveTokens: {
        const extraData = data.extraData as ReceiveTokensData;
        setReceiveTokensData(extraData);
        break;
      }
      case DrawerName.AddTokens: {
        const extraData = data.extraData as AddTokensData;
        setAddTokensData(extraData);
        break;
      }
      case DrawerName.MintERC20s: {
        const extraData = data.extraData as MintERC20sData;
        setMintERC20sData(extraData);
        break;
      }
      case DrawerName.UnshieldToOrigin: {
        const extraData = data.extraData as UnshieldToOriginData;
        setUnshieldToOriginData(extraData);
        break;
      }
      case DrawerName.CancelTransaction: {
        const extraData = data.extraData as CancelTransactionData;
        setCancelTransactionData(extraData);
        break;
      }
      case DrawerName.ApproveSpender: {
        const extraData = data.extraData as ApproveSpenderData;
        setApproveSpenderData(extraData);
        break;
      }
      case DrawerName.SwapPrivate: {
        const extraData = data.extraData as SwapPrivateData;
        setSwapPrivateData(extraData);
        break;
      }
      case DrawerName.SwapPublic: {
        const extraData = data.extraData as SwapPublicData;
        setSwapPublicData(extraData);
        break;
      }
      case DrawerName.ExportTransactions: {
        break;
      }
    }

    setOpenDrawer(data.drawerName);
  };
  const closeDrawer = () => {
    setOpenDrawer(undefined);
  };

  const closeDrawerWarnIfValidProof = () => {
    if (isRailgun && hasValidProof) {
      setAlert({
        title: 'Warning',
        message: 'You will lose your current proof if you navigate away.',
        onClose: () => setAlert(undefined),
        submitTitle: 'Confirm',
        onSubmit: () => {
          setAlert(undefined);
          closeDrawer();
        },
      });
      return;
    }
    closeDrawer();
  };

  const getLiquidityHeaderTitle = () => {
    return isDefined(liquidityERC20Data?.pool)
      ? `Add liquidity: ${liquidityERC20Data?.pool.tokenA.symbol}-${liquidityERC20Data?.pool.tokenB.symbol}`
      : `Remove liquidity: ${liquidityERC20Data?.tokenName}`;
  };

  useEffect(() => {
    drawerEventsBus.on(EVENT_OPEN_DRAWER_WITH_DATA, openDrawerWithData);
    drawerEventsBus.on(EVENT_CLOSE_DRAWER, closeDrawer);
    return () => {
      drawerEventsBus.remove(EVENT_OPEN_DRAWER_WITH_DATA, openDrawerWithData);
      drawerEventsBus.remove(EVENT_CLOSE_DRAWER, closeDrawer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Drawer
        isOpen={openDrawer === DrawerName.AddTokens}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Add tokens"
        isRailgun={undefined}
        showWalletAddress={false}
      >
        <AddTokens initialAddTokensData={addTokensData} />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.ReceiveTokens}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Receive tokens"
        isRailgun={isRailgun}
      >
        <ReceiveTokens
          isRailgun={receiveTokensData?.isRailgun ?? isRailgun}
          titleOverride={receiveTokensData?.titleOverride}
        />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.SendERC20s}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText={isRailgun ? `Send private tokens` : `Send public tokens`}
        isRailgun={isRailgun}
      >
        <SendERC20s token={transferERC20Data?.erc20} isRailgun={isRailgun} />
      </Drawer>
      <Drawer
        isRailgun
        isOpen={openDrawer === DrawerName.FarmVault}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText={getFarmActionTitle(
          network.current.name,
          farmERC20Data?.cookbookFarmRecipeType,
          wallets.available,
          farmERC20Data?.vault,
          farmERC20Data?.currentToken,
        )}
      >
        {isDefined(farmERC20Data) ? (
          <FarmVaultFlow
            cookbookFarmRecipeType={farmERC20Data.cookbookFarmRecipeType}
            token={farmERC20Data.currentToken}
          />
        ) : null}
      </Drawer>
      <Drawer
        isRailgun
        isOpen={openDrawer === DrawerName.Liquidity}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText={getLiquidityHeaderTitle()}
      >
        {isDefined(liquidityERC20Data) ? (
          <LiquidityFlow
            pool={liquidityERC20Data?.pool}
            tokenAddress={liquidityERC20Data?.tokenAddress}
            cookbookLiquidityRecipeType={
              liquidityERC20Data.cookbookLiquidityRecipeType
            }
          />
        ) : null}
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.ExportTransactions}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Export transactions"
        isRailgun={undefined}
      >
        <ExportTransactions />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.ShieldERC20s}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Shield tokens"
        isRailgun={isRailgun}
      >
        <ShieldERC20s token={transferERC20Data?.erc20} />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.SendNFTs}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Send NFTs"
        isRailgun={isRailgun}
      >
        <SendNFTs
          nftAmount={transferNFTData?.nftAmount}
          isRailgun={isRailgun}
        />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.ShieldNFTs}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Shield NFTs"
        isRailgun={isRailgun}
      >
        <ShieldNFTs nftAmount={transferNFTData?.nftAmount} />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.UnshieldNFTs}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Unshield NFTs"
        isRailgun={isRailgun}
      >
        <UnshieldNFTs
          nftAmount={transferNFTData?.nftAmount}
          setHasValidProof={setHasValidProof}
        />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.UnshieldERC20s}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Unshield tokens"
        isRailgun={isRailgun}
      >
        <UnshieldERC20s
          token={transferERC20Data?.erc20}
          setHasValidProof={setHasValidProof}
        />
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.UnshieldToOrigin}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Unshield to origin"
        isRailgun={isRailgun}
      >
        {unshieldToOriginData && (
          <UnshieldToOrigin
            unshieldToOriginData={unshieldToOriginData}
            setHasValidProof={setHasValidProof}
            closeDrawer={closeDrawer}
          />
        )}
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.MintERC20s}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Mint tokens"
        isRailgun={isRailgun}
      >
        {mintTokensData && (
          <MintERC20sConfirm tokenAmount={mintTokensData.erc20Amount} />
        )}
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.CancelTransaction}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Cancel transaction"
        isRailgun={false}
      >
        {cancelTransactionData && (
          <CancelTransactionConfirm
            transaction={cancelTransactionData.transaction}
            txResponse={cancelTransactionData.txResponse}
          />
        )}
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.ApproveSpender}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Approve"
        isRailgun={isRailgun}
      >
        {approveSpenderData && (
          <ApproveERC20Confirm
            approveERC20Amount={approveSpenderData.erc20Amount}
            spender={approveSpenderData.spender}
            spenderName={approveSpenderData.spenderName}
            transactionType={TransactionType.ApproveShield}
            goBack={() => drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER)}
            backButtonText="Cancel"
            infoCalloutText={approveSpenderData.infoCalloutText}
          />
        )}
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.SwapPrivate}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Private swap"
        isRailgun={true}
      >
        {swapPrivateData && <SwapPrivateFlow {...swapPrivateData} />}
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.SwapPublic}
        onRequestClose={closeDrawerWarnIfValidProof}
        headerText="Public swap"
        isRailgun={false}
      >
        {swapPublicData && <SwapPublicConfirm {...swapPublicData} />}
      </Drawer>
      <Drawer
        isOpen={openDrawer === DrawerName.ERC20Info}
        onRequestClose={() => {
          closeDrawerWarnIfValidProof();
          setERC20InfoData(undefined);
        }}
        headerText={
          tokenInfoData
            ? getTokenDisplayHeader(
                tokenInfoData.erc20,
                wallets.available,
                network.current.name,
              )
            : ''
        }
        isRailgun={isRailgun}
      >
        {tokenInfoData?.erc20 && (
          <ERC20Info
            token={tokenInfoData.erc20}
            isRailgun={isRailgun}
            balanceBucketFilter={tokenInfoData.balanceBucketFilter}
          />
        )}
      </Drawer>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
