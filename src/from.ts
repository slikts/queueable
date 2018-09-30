import AsyncQueue from './AsyncQueue'

type EventMap = GlobalEventHandlersEventMap

// TODO add overloads for special event targets (Window, Document)
/**
 * Convert DOM events to an async iterable iterator.
 */
export const fromDom = <Event extends keyof EventMap>(
  type: Event,
  target: EventTarget,
  options?: boolean | AddEventListenerOptions,
): AsyncIterableIterator<EventMap[Event]> => {
  const queue = new AsyncQueue<EventMap[Event]>()
  target.addEventListener(
    type,
    (e: EventMap[Event]) => {
      queue.push(e)
    },
    options,
  )
  return queue[Symbol.asyncIterator]()
}

// TODO implement strict-event-emitter-types support
/**
 * Convert node EventEmitter events to an async iterable iterator.
 */
export const fromEmitter = <Event>(
  type: string | symbol,
  emitter: NodeJS.EventEmitter,
): AsyncIterableIterator<Event> => {
  const queue = new AsyncQueue<Event>()
  emitter.on(type, (event: Event) => {
    queue.push(event)
  })
  return queue[Symbol.asyncIterator]()
}
