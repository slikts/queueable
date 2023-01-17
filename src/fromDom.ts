import { PushAdapter } from './common';

export type EventMap = GlobalEventHandlersEventMap;

// TODO add overloads for special event targets (Window, Document)
/**
 * Convert DOM events to an async iterable iterator.
 */
const fromDom =
  <T extends keyof EventMap>(init: () => PushAdapter<EventMap[T]>) =>
  (
    type: T,
    target: Target<T>,
    options?: boolean | AddEventListenerOptions,
  ): AsyncIterableIterator<EventMap[T]> => {
    const adapter = init();
    const listener = (event: EventMap[T]) => void adapter.push(event);
    target.addEventListener(type, listener, options);
    return adapter.wrap(() => target.removeEventListener(type, listener, options));
  };

export type Listener<T extends keyof EventMap> = (e: EventMap[T]) => void;

export type Target<
  T extends keyof EventMap,
  L = Listener<T>,
  O = boolean | AddEventListenerOptions,
> = EventTarget & {
  addEventListener(type: T, listener: L, options?: O): void;
  removeEventListener(type: T, listener: L, options?: O): void;
};

export default fromDom;
