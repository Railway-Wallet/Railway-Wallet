import { Network } from '@railgun-community/shared-models';
import {
  SavedTransaction,
  TransactionStatus,
} from '../../models/transaction';
import * as PromiseUtils from '../../utils/promises';
import { PendingTransactionWatcher } from './pending-transaction-watcher';

type WatcherInternals = {
  isStarted: boolean;
  watchingTransactionHashes: Record<string, Record<string, string>>;
  ongoingPollIds: Record<string, Record<string, string>>;
  pollForPendingTransaction: () => Promise<unknown>;
};

const watcher = PendingTransactionWatcher as unknown as WatcherInternals;

jest.mock('../../bridge/bridge-poi', () => ({
  getPOIRequiredForNetwork: jest.fn(),
}));
jest.mock('../../redux-store', () => ({
  openShieldPOICountdownToast: jest.fn(),
}));
jest.mock('../../redux-store/reducers/saved-transactions-reducer', () => ({
  setTransactions: jest.fn(),
}));
jest.mock('../../redux-store/reducers/toast-reducer', () => ({
  enqueueAsyncToast: jest.fn(),
}));
jest.mock('../../redux-store/store', () => ({
  store: { getState: jest.fn(() => ({ wallets: {} })) },
}));
jest.mock('../../utils/saved-transactions', () => ({
  getSavedTransactionTXIDVersion: jest.fn(),
  transactionShouldNavigateToPrivateBalance: jest.fn(),
}));
jest.mock('../../utils/tokens', () => ({
  createNavigateToTokenInfoActionData: jest.fn(),
}));
jest.mock('../../utils/tx-receipt-parser', () => ({
  findTokenTransferAmountFromReceipt: jest.fn(),
}));
jest.mock('../history/saved-transaction-store', () => ({
  SavedTransactionStore: jest.fn(),
}));
jest.mock('../history/transaction-receipt-details-service', () => ({
  TransactionReceiptDetailsService: jest.fn(),
}));
jest.mock('../providers/provider-service', () => ({
  ProviderService: {},
}));
jest.mock('../wallet/wallet-balance-service', () => ({
  getBaseTokenForNetwork: jest.fn(),
  pullActiveWalletBalancesForNetwork: jest.fn(),
  updateSingleERC20BalanceNetwork: jest.fn(),
}));
jest.mock('./poi-shield-countdown', () => ({
  storeShieldCountdownTx: jest.fn(),
}));

describe('PendingTransactionWatcher', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    watcher.isStarted = false;
    watcher.watchingTransactionHashes = {};
    watcher.ongoingPollIds = {};
  });

  it('waits before retrying when the receipt provider rejects immediately', async () => {
    let resolveDelay!: () => void;
    const pendingDelay = new Promise<void>(resolve => {
      resolveDelay = resolve;
    });

    let markDelayCalled!: () => void;
    const delayCalled = new Promise<void>(resolve => {
      markDelayCalled = resolve;
    });
    const delaySpy = jest
      .spyOn(PromiseUtils, 'delay')
      .mockImplementation(() => {
        markDelayCalled();
        return pendingDelay;
      });

    let markSecondPollStarted!: () => void;
    const secondPollStarted = new Promise<void>(resolve => {
      markSecondPollStarted = resolve;
    });
    const neverResolves = new Promise<never>(() => undefined);
    const pollSpy = jest
      .spyOn(watcher, 'pollForPendingTransaction')
      .mockRejectedValueOnce(new Error('RPC rejected immediately'))
      .mockImplementationOnce(() => {
        markSecondPollStarted();
        return neverResolves;
      });

    const startArgs = [
      jest.fn(),
      jest.fn(),
      jest.fn(),
    ] as unknown as Parameters<typeof PendingTransactionWatcher.start>;
    PendingTransactionWatcher.start(...startArgs);

    const network = { name: 'Ethereum' } as Network;
    const transaction = {
      id: '0xpending',
      status: TransactionStatus.timedOut,
    } as SavedTransaction;

    void PendingTransactionWatcher.watchPendingTransaction(
      network,
      transaction,
    );

    const firstRetryStep = await Promise.race([
      delayCalled.then(() => 'delay'),
      secondPollStarted.then(() => 'poll'),
    ]);
    expect(firstRetryStep).toBe('delay');
    expect(delaySpy).toHaveBeenCalledWith(15000);
    expect(pollSpy).toHaveBeenCalledTimes(1);

    resolveDelay();
    await secondPollStarted;

    expect(pollSpy).toHaveBeenCalledTimes(2);
  });
});
