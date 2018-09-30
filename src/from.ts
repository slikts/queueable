import AsyncQueue from './AsyncQueue'

export const fromDom = <A extends Event>(
  type: string,
  target: EventTarget,
  options?: boolean | AddEventListenerOptions,
): AsyncQueue<A> => {
  const queue = new AsyncQueue()
  target.addEventListener(
    type,
    (e: Event) => {
      queue.push(e)
    },
    options,
  )
  return queue as AsyncQueue<A>
}

export const fromEmitter = <A>(
  type: string | symbol,
  emitter: NodeJS.EventEmitter,
): AsyncQueue<A> => {
  const queue: AsyncQueue<A> = new AsyncQueue()
  emitter.on(type, (a: A) => {
    queue.push(a)
  })
  return queue
}
