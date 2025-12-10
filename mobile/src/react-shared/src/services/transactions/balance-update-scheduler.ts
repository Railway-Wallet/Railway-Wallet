import { Network, isDefined, removeUndefineds } from '@railgun-community/shared-models';
import { JsonRpcProvider } from 'ethers';
import { AppDispatch } from '../../redux-store/store';
import { AvailableWallet } from '../../models/wallet';
import { ERC20Balance, ERC20Token } from '../../models/token';
import { ProviderService } from '../providers/provider-service';
import { multicallERC20BalanceOf } from '../providers/multicall';
import { updateERC20BalancesNetwork } from '../../redux-store/reducers/erc20-balance-reducer-network';
import { updateSingleERC20BalanceNetwork } from '../wallet/wallet-balance-service';

export type BalanceUpdateSchedulerOptions = {
  burstWindowMs?: number;
  tokenCooldownMs?: number;
  multicallThreshold?: number;
  maxBatchSize?: number;
};

export class BalanceUpdateScheduler {
  private dispatch: AppDispatch;
  private wallet: AvailableWallet;
  private network: Network;

  private pending: MapType<ERC20Token> = {};
  private lastRefreshedAt: MapType<number> = {};
  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;

  private opts: Required<BalanceUpdateSchedulerOptions> = {
    burstWindowMs: 500,
    tokenCooldownMs: 15000,
    multicallThreshold: 3,
    maxBatchSize: 25,
  };

  constructor(
    dispatch: AppDispatch,
    wallet: AvailableWallet,
    network: Network,
    options?: BalanceUpdateSchedulerOptions,
  ) {
    this.dispatch = dispatch;
    this.wallet = wallet;
    this.network = network;
    this.opts = { ...this.opts, ...(options ?? {}) };
  }

  enqueue(token: ERC20Token) {
    if (this.destroyed) return;
    if (token.isBaseToken === true) {
      return;
    }
    const addr = token.address.toLowerCase();
    this.pending[addr] = token;
    this.schedule();
  }

  private schedule() {
    if (this.destroyed) return;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.opts.burstWindowMs);
  }

  private async flush() {
    if (this.destroyed) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    const now = Date.now();
    const addrs = Object.keys(this.pending);
    if (!addrs.length) return;

    const eligible: string[] = [];
    for (const addr of addrs) {
      const last = this.lastRefreshedAt[addr] ?? 0;
      if (now - last < this.opts.tokenCooldownMs) continue;
      eligible.push(addr);
      if (eligible.length >= this.opts.maxBatchSize) break;
    }
    if (!eligible.length) return;

    const tokens: ERC20Token[] = removeUndefineds(
      eligible.map(a => this.pending[a]),
    );
    for (const addr of eligible) delete this.pending[addr];

    try {
      if (tokens.length >= this.opts.multicallThreshold) {
        await this.refreshViaMulticall(tokens);
      } else {
        await this.refreshIndividually(tokens);
      }
      const t = Date.now();
      for (const tok of tokens) {
        this.lastRefreshedAt[tok.address.toLowerCase()] = t;
      }
    } finally {
      if (Object.keys(this.pending).length > 0) this.schedule();
    }
  }

  private async refreshViaMulticall(tokens: ERC20Token[]) {
    const provider = (await ProviderService.getFirstProvider(
      this.network.name,
    )) as JsonRpcProvider;
    const tokenAddresses = tokens.map(t => t.address.toLowerCase());
    const balancesMap = await multicallERC20BalanceOf(
      provider,
      this.network.name,
      this.wallet.ethAddress,
      tokenAddresses,
    );
    if (!balancesMap) {
      await this.refreshIndividually(tokens);
      return;
    }
    const bm = balancesMap as MapType<bigint>;
    const updated: ERC20Balance[] = removeUndefineds(
      tokens.map(t => {
        const bal = bm[t.address.toLowerCase()];
        if (!isDefined(bal)) return undefined;
        return {
          isBaseToken: t.isBaseToken === true,
          tokenAddress: t.address,
          balanceString: bal.toString(),
        } as ERC20Balance;
      }),
    );
    if (updated.length > 0) {
      this.dispatch(
        updateERC20BalancesNetwork({
          networkName: this.network.name,
          walletID: this.wallet.id,
          updatedTokenBalances: updated,
        }),
      );
    }
  }

  private async refreshIndividually(tokens: ERC20Token[]) {
    for (const t of tokens) {
      // eslint-disable-next-line no-await-in-loop
      await updateSingleERC20BalanceNetwork(
        this.dispatch,
        this.wallet,
        this.network,
        t,
      );
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.pending = {};
  }
}

