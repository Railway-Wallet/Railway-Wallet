import { RecipeOutput } from '@railgun-community/cookbook';
import {
  isDefined,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { ContractTransaction, Interface } from 'ethers';
import { EphemeralReclaimData, EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  findMatchingAddedToken,
  getWrappedTokenForNetwork,
  SavedTransactionService,
  SharedConstants,
  TransactionType,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { CrossContractReviewTransactionView } from '@screens/drawer/review-transaction/CrossContractReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';

type Props = EphemeralReclaimData & {
  authKey: string;
};

const WRAPPED_TOKEN_INTERFACE = new Interface(['function deposit() payable']);

export const EphemeralReclaimConfirm = ({
  authKey,
  ephemeralAddress,
  erc20Tokens,
  nativeWeiString,
  ephemeralIndex,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const dispatch = useAppDispatch();

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const railgunAddress = activeWallet.railAddress;
  const baseToken = network.current.baseToken;

  const hasNative = isDefined(nativeWeiString) && BigInt(nativeWeiString) > 0n;

  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] = [
    ...erc20Tokens.map(token => ({
      tokenAddress: token.address,
      recipientAddress: railgunAddress,
    })),
    ...(hasNative
      ? [
          {
            tokenAddress: baseToken.wrappedAddress,
            recipientAddress: railgunAddress,
          },
        ]
      : []),
  ];

  const crossContractCalls: ContractTransaction[] = hasNative
    ? [
        {
          to: baseToken.wrappedAddress,
          data: WRAPPED_TOKEN_INTERFACE.encodeFunctionData('deposit'),
          value: BigInt(nativeWeiString ?? '0'),
        } as ContractTransaction,
      ]
    : [];

  const recipeOutput: RecipeOutput = {
    name: 'Reclaim Ephemeral Account',
    stepOutputs: [],
    crossContractCalls,
    erc20AmountRecipients: [],
    nftRecipients: [],
    feeERC20AmountRecipients: [],
    outputPositions: [],
    minGasLimit: SharedConstants.MIN_GAS_LIMIT_EPHEMERAL_RECLAIM,
  };

  const wrappedBaseToken: ERC20Token = getWrappedTokenForNetwork(
    activeWallet,
    network.current,
  ) ?? {
    isAddressOnly: true,
    address: baseToken.wrappedAddress,
    decimals: baseToken.decimals,
    isBaseToken: false,
  };
  const shieldERC20AmountRecipients: ERC20AmountRecipient[] = [
    ...erc20Tokens.map(token => ({
      token:
        findMatchingAddedToken(
          { address: token.address, isAddressOnly: true, decimals: token.decimals },
          wallets.available,
          network.current.name,
        ) ?? {
          address: token.address,
          name: token.symbol,
          symbol: token.symbol,
          decimals: token.decimals,
          isBaseToken: false,
        },
      amountString: token.amountString,
      recipientAddress: railgunAddress,
      externalUnresolvedToWalletAddress: undefined,
    })),
    ...(hasNative
      ? [
          {
            token: wrappedBaseToken,
            amountString: nativeWeiString ?? '0',
            recipientAddress: railgunAddress,
            externalUnresolvedToWalletAddress: undefined,
          },
        ]
      : []),
  ];

  const displayERC20Amounts: ERC20Amount[] = shieldERC20AmountRecipients.map(
    ({ token, amountString }) => ({
      token,
      amountString,
    }),
  );

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const saveTransaction = async (
    txHash: string,
    sendWithPublicWallet: boolean,
    _publicExecutionWalletAddress: Optional<string>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>,
  ) => {
    const transactionService = new SavedTransactionService(dispatch);
    await transactionService.saveEphemeralReclaimTransaction(
      txidVersion.current,
      txHash,
      railgunAddress,
      ephemeralAddress,
      shieldERC20AmountRecipients,
      network.current,
      !sendWithPublicWallet, broadcasterFeeERC20Amount,
      broadcasterRailgunAddress,
      nonce,
    );
  };

  return (
    <CrossContractReviewTransactionView
      authKey={authKey}
      crossContractCalls={crossContractCalls}
      saveTransaction={saveTransaction}
      onSuccess={onSuccess}
      transactionType={TransactionType.Ephemeral}
      relayAdaptUnshieldERC20Amounts={[]}
      relayAdaptUnshieldNFTAmounts={[]}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptShieldNFTRecipients={[]}
      infoCalloutText="Reclaiming stranded funds from your ephemeral account back into your RAILGUN (private) balance."
      processingText="Reclaiming funds into RAILGUN..."
      confirmButtonText="Reclaim to RAILGUN"
      backButtonText={undefined}
      goBack={undefined}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={false}
      ephemeralIndex={ephemeralIndex}
      displayERC20Amounts={displayERC20Amounts}
      sourceAddress={ephemeralAddress}
    />
  );
};
