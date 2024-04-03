import { BridgeEvent } from './services/bridge/model';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rnBridge = require('rn-bridge');

type PostUncaughtException = (
  event: `${BridgeEvent.UncaughtException}`,
  data?: any,
) => void;

process.on('unhandledRejection', (err: Error | string) => {
  console.error(err);
  (rnBridge.channel.post as PostUncaughtException)(
    'uncaughtException',
    typeof err === 'string' ? err : err.stack ?? err.message,
  );
});
process.on('uncaughtException', (err: Error | string) => {
  console.error(err);
  (rnBridge.channel.post as PostUncaughtException)(
    'uncaughtException',
    typeof err === 'string' ? err : err.stack ?? err.message,
  );
});

require('./main');
