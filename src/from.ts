import { PushAdapter, Returnable, donePromise } from './common';

type EventMap = GlobalEventHandlersEventMap;

// TODO add overloads for special event targets (Window, Document)
/**
 * Convert DOM events to an async iterable iterator.
 */
export const fromDom = <EventType extends keyof EventMap>(
  init: () => PushAdapter<EventMap[EventType]>,
) => (
  type: EventType,
  target: EventTarget,
  options?: boolean | AddEventListenerOptions,
): AsyncIterableIterator<EventMap[EventType]> => {
  const producer = init();
  const listener = (e: EventMap[EventType]) => void producer.push(e);
  target.addEventListener(type, listener, options);
  return producer.wrap(() => target.removeEventListener(type, listener, options));
};

// TODO implement strict-event-emitter-types support
/**
 * Convert node EventEmitter events to an async iterable iterator.
 */
export const fromEmitter = <Event>(init: () => PushAdapter<Event>) => (
  type: string | symbol,
  emitter: NodeJS.EventEmitter,
): AsyncIterableIterator<Event> => {
  const producer = init();
  const listener = (event: Event) => void producer.push(event);
  emitter.addListener(type, listener);
  return producer.wrap(() => void emitter.removeListener(type, listener));
};

/**
 * Convert a simple callback-taking function to an async stream.
 *
 * Example:
 * ```js
 * const animationFrames = wrapRequest(window.requestAnimationFrame);
 * ```
 *
 */
export const wrapRequest = <A>(
  request: (callback: (value: A) => void) => void,
  onReturn?: () => void,
): Returnable<A> => {
  const done = false;
  let promise: Promise<IteratorResult<A>> | null = null;
  let cancel: ((reason?: any) => void) | null = null;
  let closed = false;
  return {
    next() {
      if (closed) {
        return donePromise;
      }
      // istanbul ignore else
      if (promise === null) {
        promise = new Promise((resolve, reject) => {
          request((value: A) => {
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
        onReturn();
      }
      return { value: value!, done: true };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
};
