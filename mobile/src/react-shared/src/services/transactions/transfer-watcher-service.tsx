import {
  isDefined,
  Network,
  NFTAmount,
  NFTTokenType,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { EventFilter, Filter, id, JsonRpcProvider, Log } from 'ethers';
import { ReactConfig } from '../../config';
import { SharedConstants } from '../../config/shared-constants';
import { ToastType } from '../../models/toast';
import {
  ERC20Balance,
  ERC20Token,
  ERC20TokenAddressOnly,
} from '../../models/token';
import { AvailableWallet, FrontendWallet } from '../../models/wallet';
import { updateERC20BalancesNetwork } from '../../redux-store/reducers/erc20-balance-reducer-network';
import { enqueueAsyncToast } from '../../redux-store/reducers/toast-reducer';
import { AppDispatch, store } from '../../redux-store/store';
import { MerkletreeType } from '../../redux-store/reducers/merkletree-history-scan-reducer';
import { padAddressForTopicFilter } from '../../utils/address';
import { getNFTAmountDisplayName } from '../../utils/nft';
import {
  baseTokenForWallet,
  createNavigateToTokenInfoActionData,
  getTokenDisplayName,
  tokenAddressForBalances,
} from '../../utils/tokens';
import {
  getDecimalBalanceString,
  shortenWalletAddress,
} from '../../utils/util';
import { logDev } from '../../utils/logging';
import { ProviderService } from '../providers/provider-service';
import { getERC20Decimals } from '../token';
import { getWalletBaseTokenBalance } from '../token/base-token';
import { pullNFTBalancesNetwork, updateSingleERC20BalanceNetwork } from '../wallet/wallet-balance-service';
import { BalanceUpdateScheduler } from './balance-update-scheduler';

let watchedProvider: Optional<JsonRpcProvider>;
let baseTokenPollTimer: Optional<ReturnType<typeof setInterval>>;
let receiveWatcherEnabled = true;
let balanceUpdateScheduler: Optional<BalanceUpdateScheduler>;

const removeTokenWatchers = async () => {
  if (watchedProvider) {
    await watchedProvider.removeAllListeners();
    watchedProvider = undefined;
  }

  if (baseTokenPollTimer) {
    clearInterval(baseTokenPollTimer);
    baseTokenPollTimer = undefined;
  }
  if (balanceUpdateScheduler) {
    balanceUpdateScheduler.destroy();
    balanceUpdateScheduler = undefined;
  }
};

export const setReceiveTransferWatcherEnabled = async (
  enabled: boolean,
  wallet?: Optional<FrontendWallet>,
  network?: Optional<Network>,
  dispatch?: Optional<AppDispatch>,
) => {
  receiveWatcherEnabled = enabled;
  if (!enabled) {
    await removeTokenWatchers();
    return;
  }
  if (wallet && network && dispatch) {
    await refreshReceivedTransactionWatchers(wallet, network, dispatch);
  }
};

const txReceiveSuccess = async (
  dispatch: AppDispatch,
  token: ERC20Token,
  amount: string,
  wallet: AvailableWallet,
  network: Network,
  isRailgun: boolean,
  shouldUpdateAllBalances: boolean,
) => {
  dispatch(
    enqueueAsyncToast({
      message: `Received ${amount} ${getTokenDisplayName(
        token,
        undefined,
        network.name,
      )}`,
      subtext: `${network.publicName} | ${shortenWalletAddress(
        wallet.ethAddress,
      )}`,
      type: ToastType.Success,
      networkName: network.name,
      actionData: createNavigateToTokenInfoActionData(
        network.name,
        token,
        isRailgun,
        [RailgunWalletBalanceBucket.Spendable],
      ),
    }),
  );
  if (shouldUpdateAllBalances) {
    if (balanceUpdateScheduler) {
      balanceUpdateScheduler.enqueue(token);
    } else {
      await updateSingleERC20BalanceNetwork(dispatch, wallet, network, token);
    }
  }
};

const nftReceiveSuccess = async (
  dispatch: AppDispatch,
  nftAmount: NFTAmount,
  wallet: AvailableWallet,
  network: Network,
) => {
  const nftDisplayName = getNFTAmountDisplayName(nftAmount);
  dispatch(
    enqueueAsyncToast({
      message: `Received ${nftDisplayName}`,
      subtext: `${network.publicName} | ${shortenWalletAddress(
        wallet.ethAddress,
      )}`,
      type: ToastType.Success,
      networkName: network.name,
      actionData: undefined,
    }),
  );
};

const ADDRESS_CHUNK_SIZE = 20;

const setUpTransferWatcher = async (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network,
) => {
  const scanState =
    store.getState().merkletreeHistoryScan.forNetwork[network.name]?.forType[
      MerkletreeType.UTXO
    ];
  const progress = scanState?.progress ?? 0;
  if (progress < 0.9) {
    logDev(
      `Delaying transfer watcher start until UTXO scan >= 0.90 (current ${progress.toFixed(
        2,
      )})`,
    );
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setUpTransferWatcher(dispatch, wallet, network);
    }, 15_000);
    return;
  }

  const addedTokens = wallet.addedTokens[network.name] ?? [];
  const erc20Addresses = Array.from(
    new Set(
      addedTokens
        .filter(t => !(t.isBaseToken ?? false))
        .map(t => t.address.toLowerCase()),
    ),
  );
  if (!erc20Addresses.length) {
    return;
  }

  const topics = [
    id('Transfer(address,address,uint256)'),
    null,
    padAddressForTopicFilter(wallet.ethAddress),
  ];

  for (let i = 0; i < erc20Addresses.length; i += ADDRESS_CHUNK_SIZE) {
    const addrChunk = erc20Addresses.slice(i, i + ADDRESS_CHUNK_SIZE);
    const filter: EventFilter = {
      topics: topics as any,
      address: addrChunk,
    } as EventFilter;
    await watchedProvider?.on(filter, (log: Log) => {
      if (log.topics.length === 3) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        receivedERC20(dispatch, wallet, network, log);
      } else if (log.topics.length === 4 && log.data === '0x') {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        receivedNFT(dispatch, wallet, network, log);
      }
    });
  }
};

const receivedERC20 = async (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network,
  log: Log,
): Promise<void> => {
  const tokenAddress = log.address.toLowerCase();
  const amountHex = log.data;
  const addedTokens = wallet.addedTokens[network.name] ?? [];

  const foundToken = addedTokens.find(token => token.address === tokenAddress);
  if (!foundToken) {
    return receivedUnknownERC20(
      dispatch,
      wallet,
      network,
      tokenAddress,
      amountHex,
    );
  }

  const bigNumberAmount = BigInt(amountHex);
  const amountStr = getDecimalBalanceString(
    bigNumberAmount,
    foundToken.decimals,
  );
  const isRailgun = false;
  const shouldUpdateAllBalances = true;
  await txReceiveSuccess(
    dispatch,
    foundToken,
    amountStr,
    wallet,
    network,
    isRailgun,
    shouldUpdateAllBalances,
  );
};

const receivedUnknownERC20 = async (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network,
  tokenAddress: string,
  amountHex: string,
) => {
  const networkName = network.name;
  const decimals = Number(await getERC20Decimals(networkName, tokenAddress));
  const bigNumberAmount = BigInt(amountHex);
  const amountStr = getDecimalBalanceString(bigNumberAmount, decimals);
  const token: ERC20TokenAddressOnly = {
    isAddressOnly: true,
    address: tokenAddress,
    decimals,
  };
  const isRailgun = false;
  const shouldUpdateAllBalances = true;
  await txReceiveSuccess(
    dispatch,
    token,
    amountStr,
    wallet,
    network,
    isRailgun,
    shouldUpdateAllBalances,
  );
};

const receivedNFT = async (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network,
  log: Log,
) => {
  if (!ReactConfig.ENABLE_NFTS) {
    return;
  }
  const nftAmount: NFTAmount = {
    nftAddress: log.address.toLowerCase(),
    tokenSubID: log.topics[3],
    nftTokenType: NFTTokenType.ERC721,
    amountString: '1',
  };
  await nftReceiveSuccess(dispatch, nftAmount, wallet, network);
};

const updateBaseTokenBalance = async (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network,
  baseToken: ERC20Token,
) => {
  const networkName = network.name;
  const { erc20BalancesNetwork } = store.getState();
  const networkWalletBalancesMap = erc20BalancesNetwork.forNetwork[networkName];
  if (!isDefined(baseToken) || !isDefined(networkWalletBalancesMap)) {
    return;
  }

  const tokenBalances = networkWalletBalancesMap.forWallet[wallet.id];
  if (!isDefined(tokenBalances)) {
    return;
  }

  const tokenAddressBalances = tokenAddressForBalances(
    baseToken.address,
    baseToken.isBaseToken,
  );
  const balance = tokenBalances[tokenAddressBalances];
  if (!isDefined(balance)) {
    return;
  }
  const oldBaseTokenBalance = BigInt(balance);

  const newBaseTokenBalance = await getWalletBaseTokenBalance(
    networkName,
    wallet.ethAddress,
  );

  if (newBaseTokenBalance !== oldBaseTokenBalance) {
    const updatedBalances: ERC20Balance[] = [
      {
        isBaseToken: true,
        tokenAddress: baseToken.address,
        balanceString: newBaseTokenBalance.toString(),
      },
    ];
    dispatch(
      updateERC20BalancesNetwork({
        networkName,
        walletID: wallet.id,
        updatedTokenBalances: updatedBalances,
      }),
    );
  }

  if (newBaseTokenBalance > oldBaseTokenBalance) {
    const amountReceived = getDecimalBalanceString(
      newBaseTokenBalance - oldBaseTokenBalance,
      baseToken.decimals,
    );

    const isRailgun = false;

    const shouldUpdateAllBalances = false;

    await txReceiveSuccess(
      dispatch,
      baseToken,
      amountReceived,
      wallet,
      network,
      isRailgun,
      shouldUpdateAllBalances,
    );
  }
};

const pollBaseToken = (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network,
) => {
  const networkName = network.name;
  const baseToken = baseTokenForWallet(networkName, wallet);
  if (!baseToken) {
    return;
  }

  if (baseTokenPollTimer) {
    clearInterval(baseTokenPollTimer);
  }

  baseTokenPollTimer = setInterval(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateBaseTokenBalance(dispatch, wallet, network, baseToken);
  }, SharedConstants.POLL_MSEC_BASE_TOKEN_BALANCE);
};

export const refreshReceivedTransactionWatchers = async (
  wallet: Optional<FrontendWallet>,
  network: Network,
  dispatch: AppDispatch,
): Promise<void> => {
  await removeTokenWatchers();

  if (!receiveWatcherEnabled) {
    return;
  }
  if (wallet && !wallet.isViewOnlyWallet) {
    const pollingIntervalInMs = 10000;
    watchedProvider = await ProviderService.getPollingProvider(
      network.name,
      pollingIntervalInMs,
    );

    pollBaseToken(dispatch, wallet, network);

    balanceUpdateScheduler = new BalanceUpdateScheduler(
      dispatch,
      wallet,
      network,
      {
        burstWindowMs: 500,
        tokenCooldownMs: 15000,
        multicallThreshold: 3,
        maxBatchSize: 25,
      },
    );

    await setUpTransferWatcher(dispatch, wallet, network);
  }
};

export const scanUnknownTokenReceives = async (
  dispatch: AppDispatch,
  wallet: Optional<FrontendWallet>,
  network: Network,
): Promise<void> => {
  if (!wallet || wallet.isViewOnlyWallet) {
    return;
  }
  const provider = await ProviderService.getFirstProvider(network.name);
  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(
    latest - SharedConstants.UNKNOWN_TRANSFER_SCAN_BLOCKS,
    0,
  );
  const filter: Filter = {
    topics: [
      id('Transfer(address,address,uint256)'),
      null,
      padAddressForTopicFilter(wallet.ethAddress),
    ],
    fromBlock,
    toBlock: latest,
  } as Filter;

  const addedTokens = wallet.addedTokens[network.name] ?? [];
  const known = new Set(
    addedTokens
      .filter(t => !(t.isBaseToken ?? false))
      .map(t => t.address.toLowerCase()),
  );
  const processed = new Set<string>();

  const logs = await provider.getLogs(filter);
  for (const log of logs) {
    if (log.topics.length === 3) {
      const tokenAddress = log.address.toLowerCase();
      if (known.has(tokenAddress)) continue;
      if (processed.has(tokenAddress)) continue;
      processed.add(tokenAddress);
      // eslint-disable-next-line no-await-in-loop
      await receivedUnknownERC20(
        dispatch,
        wallet,
        network,
        tokenAddress,
        log.data,
      );
    } else if (log.topics.length === 4 && ReactConfig.ENABLE_NFTS) {
      // eslint-disable-next-line no-await-in-loop
      await receivedNFT(dispatch, wallet, network, log);
    }
  }
  logDev(
    `Unknown token scan ${network.shortPublicName}: scannedLogs=${logs.length} windowBlocks=${SharedConstants.UNKNOWN_TRANSFER_SCAN_BLOCKS}`,
  );
};
