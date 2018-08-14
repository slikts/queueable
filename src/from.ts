import { EventEmitter } from 'events'
import AsyncQueue from './asyncqueue'

export const fromDom = <A extends Event>(
  name: string,
  source: EventTarget,
  options?: boolean | AddEventListenerOptions,
): AsyncQueue<A> => {
  const queue = new AsyncQueue()
  source.addEventListener(
    name,
    (e: Event) => {
      queue.push(e)
    },
    options,
  )
  return queue as AsyncQueue<A>
}

export const fromEmitter = <A>(name: string, emitter: EventEmitter): AsyncQueue<A> => {
  const queue: AsyncQueue<A> = new AsyncQueue()
  emitter.on(name, (a: A) => {
    queue.push(a)
  })
  return queue
}
