import Multicast from './producers/Multicast';
import Mono from './producers/Mono';
import Balancer from './producers/Balancer';
import Deferred from './Deferred';
import AsyncProducer from './AsyncProducer';

type EventMap = GlobalEventHandlersEventMap;

// TODO add overloads for special event targets (Window, Document)
/**
 * Convert DOM events to an async iterable iterator.
 */
export const fromDom = <EventType extends keyof EventMap>(
  init: () => AsyncProducer<EventMap[EventType]>,
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
export const fromEmitter = <Event>(init: () => AsyncProducer<Event>) => (
  type: string | symbol,
  emitter: NodeJS.EventEmitter,
): AsyncIterableIterator<Event> => {
  const producer = init();
  const listener = (event: Event) => void producer.push(event);
  emitter.addListener(type, listener);
  return producer.wrap(() => void emitter.removeListener(type, listener));
};

/**
 * Convert frame repaints
 */
export const wrapRequest = <A>(
  request: (callback: (value: A) => void) => void,
): AsyncIterableIterator<A> => {
  let defer: Deferred<IteratorResult<A>> | null = null;
  const next = () => {
    // istanbul ignore else
    if (defer === null) {
      defer = new Deferred<IteratorResult<A>>();
      const { resolve } = defer;
      request((value: A) => {
        resolve({
          value,
          done: false,
        });
        defer = null;
      });
    }
    return defer.promise;
  };
  return {
    next,
    [Symbol.asyncIterator]() {
      return this;
    },
  };
};

// export const animationFrames = wrapRequest(window.requestAnimationFrame);
