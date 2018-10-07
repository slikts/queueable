import Multicast from './Multicast';
import Balancer from './Balancer';
import Deferred from './Deferred';

type EventMap = GlobalEventHandlersEventMap;

// TODO add overloads for special event targets (Window, Document)
/**
 * Convert DOM events to an async iterable iterator.
 */
export const fromDom = <EventType extends keyof EventMap>(
  type: EventType,
  target: EventTarget,
  options?: boolean | AddEventListenerOptions,
): AsyncIterableIterator<EventMap[EventType]> => {
  const balancer = new Balancer<EventMap[EventType]>();
  const listener = (e: EventMap[EventType]) => void balancer.push(e);
  target.addEventListener(type, listener, options);
  return balancer.wrap(() => target.removeEventListener(type, listener, options));
};

// TODO implement strict-event-emitter-types support
/**
 * Convert node EventEmitter events to an async iterable iterator.
 */
export const fromEmitter = <Event>(
  type: string | symbol,
  emitter: NodeJS.EventEmitter,
): AsyncIterableIterator<Event> => {
  const balancer = new Balancer<Event>();
  const listener = (event: Event) => void balancer.push(event);
  emitter.addListener(type, listener);
  return balancer.wrap(() => void emitter.removeListener(type, listener));
};

/**
 * Convert frame repaints
 */
export const wrapRequest = <A>(
  request: (callback: (value: A) => void) => void,
): AsyncIterableIterator<A> => {
  let defer: Deferred<IteratorResult<A>> | null = null;
  const next = () => {
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
