/* eslint-disable no-restricted-globals */
import { BridgeEvent } from '@react-shared';

self.addEventListener('unhandledrejection', event => {
  const err: Error | string = event.reason;
  self.postMessage({
    event: 'ipc:event',
    result: {
      event: BridgeEvent.UncaughtException,
      args: [typeof err === 'string' ? err : err.stack ?? err.message],
    },
  });
});

self.addEventListener('error', event => {
  const err: Error | string = event.error;
  self.postMessage({
    event: 'ipc:event',
    result: {
      event: BridgeEvent.UncaughtException,
      args: [typeof err === 'string' ? err : err.stack ?? err.message],
    },
  });
  event.preventDefault();
});

require('./main');
