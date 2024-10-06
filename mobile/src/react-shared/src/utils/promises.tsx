export const delay = (delayInMS: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
};

export function promiseTimeout<T>(
  promise: Promise<T>,
  ms: number,
  customTimeoutError?: Error
): Promise<T> {
  const timeout = new Promise((_resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out in ${ms} ms.`));
    }, ms);
  });

  return Promise.race([promise, timeout])
    .then((result) => result as T)
    .catch((err) => {
      if (!(err instanceof Error)) {
        throw err;
      }
      if (err.message.startsWith("Timed out")) {
        throw customTimeoutError ?? err;
      }
      throw err;
    });
}

export async function poll<T>(
  fn: () => Promise<T>,
  passCondition: (result: T) => boolean,
  delayInMS: number,
  allowedAttempts: number = 1
): Promise<Optional<T>> {
  let result = await fn();
  let attempts = 1;
  while (attempts <= allowedAttempts) {
    if (passCondition(result)) {
      return result;
    }
    await delay(delayInMS);
    result = await fn();
    attempts++;
  }
  return undefined;
}
