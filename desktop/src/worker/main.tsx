import { setLoggers } from '@railgun-community/wallet';
import { sendError, sendMessage } from './loggers';

import './artifacts';
import './crypto';
import './engine';
import './ethers';
import './providers';
import './transactions/cross-contract-calls';
import './transactions/proofs';
import './transactions/shield-base-token';
import './transactions/shield-erc20';
import './transactions/transfer';
import './transactions/unshield';
import './util';
import './waku-broadcaster-client';
import './poi';
import './wallets';

setLoggers(sendMessage, sendError);
