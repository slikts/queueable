import { Returnable, donePromise } from './common';

/**
 * Convert a simple callback-taking function to an async stream.
 *
 * Example:
 * ```js
 * const animationFrames = wrapRequest(window.requestAnimationFrame);
 * ```
 *
 */
const wrapRequest = <A, B>(
  request: (callback: (value: A) => void) => B,
  onReturn?: (request?: B) => void,
): Returnable<A> => {
  const done = false;
  let promise: Promise<IteratorResult<A>> | null = null;
  let cancel: ((reason?: unknown) => void) | null = null;
  let closed = false;
  let result: B;
  return {
    next() {
      if (closed) {
        return donePromise;
      }
      if (promise === null) {
        promise = new Promise((resolve, reject) => {
          result = request((value: A) => {
            resolve({ value, done });
            promise = null;
          });
          cancel = reject;
        });
      }
      return promise;
    },
    async return(value?: A) {
      closed = true;
      if (cancel) {
        cancel(new Error('Canceled'));
        cancel = null;
      }
      if (onReturn) {
        onReturn(result);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return { value: value!, done: true };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
};

export default wrapRequest;
