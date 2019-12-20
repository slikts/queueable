import { PushAdapter } from './common';

type EventMap = GlobalEventHandlersEventMap;

// TODO add overloads for special event targets (Window, Document)
/**
 * Convert DOM events to an async iterable iterator.
 */
const fromDom = <EventType extends keyof EventMap>(
  init: () => PushAdapter<EventMap[EventType]>,
) => (
  type: EventType,
  target: EventTarget,
  options?: boolean | AddEventListenerOptions,
): AsyncIterableIterator<EventMap[EventType]> => {
  const adapter = init();
  const listener = (event: EventMap[EventType]) => void adapter.push(event);
  target.addEventListener(type, listener, options);
  return adapter.wrap(() => target.removeEventListener(type, listener, options));
};

export default fromDom;
