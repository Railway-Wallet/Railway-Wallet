import '@ethersproject/shims';

import { sendErrorMessage, setLoggers } from '@railgun-community/wallet';
import './services/bridge/node-ipc-service';
import './services/core/railgun/node-railgun-engine';
import './services/core/railgun/node-railgun-poi';
import './services/core/railgun/node-railgun-artifacts';
import './services/core/railgun/node-railgun-wallets';
import './services/core/railgun/node-railgun-providers';
import './services/core/railgun/node-railgun-crypto';
import './services/core/railgun/transactions/node-railgun-shield-erc20';
import './services/core/railgun/transactions/node-railgun-shield-base-token';
import './services/core/railgun/transactions/node-railgun-transfer';
import './services/core/railgun/transactions/node-railgun-unshield';
import './services/core/railgun/transactions/node-railgun-proofs';
import './services/core/railgun/transactions/node-railgun-cross-contract-calls';
import './services/core/railgun/node-railgun-util';
import './services/core/node-ethers';
import './services/broadcaster/node-waku-broadcaster-client';

import { sendError, sendMessage } from './services/bridge/loggers';

setLoggers(sendMessage, sendError);

// @ts-ignore
global.crypto.getRandomValues = () => {
  sendErrorMessage(
    'Tried to generate insecure random value - blocked in Node 12 environment.',
  );
};

setTimeout(() => {
  sendMessage('Node runtime initialized.');
});
