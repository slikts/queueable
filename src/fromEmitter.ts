import { PushAdapter } from './common';

// TODO implement strict-event-emitter-types support
/**
 * Convert node EventEmitter events to an async iterable iterator.
 */
const fromEmitter =
  <Event>(init: () => PushAdapter<Event>) =>
  (type: string | symbol, emitter: NodeJS.EventEmitter): AsyncIterableIterator<Event> => {
    const adapter = init();
    const listener = (event: Event) => void adapter.push(event);
    emitter.addListener(type, listener);
    return adapter.wrap(() => void emitter.removeListener(type, listener));
  };

export default fromEmitter;
