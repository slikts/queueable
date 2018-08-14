import { memoize } from 'tuplerone'
import Deferred from './Deferred'

const getState = memoize(<A>(o: AsyncQueue<A>) => {
  const resolvers: Set<Array<(a: A) => void>> = new Set()
  // Value buffer
  const values: A[] = []
  return {
    resolvers,
    values,
    update() {
      if (values.length === 0) {
        return
      }
      for (const queue of resolvers) {
        if (queue.length === 0) {
          continue
        }
        ;(queue.shift() as any)(values.shift())
      }
    },
  }
})

export default class AsyncQueue<A> implements AsyncIterable<A> {
  push(a: A): this {
    const { values, update } = getState(this)
    values.push(a)
    update()
    return this
  }

  pushMany(as: A[]): this {
    as.forEach(this.push, this)
    return this
  }

  async *[Symbol.asyncIterator]() {
    const queue: Array<(a: A) => void> = []
    const { resolvers, update } = getState(this)
    resolvers.add(queue)
    try {
      while (true) {
        const { promise, resolve } = new Deferred() as Deferred<A>
        queue.push(resolve)
        update()
        yield promise
      }
    } finally {
      resolvers.delete(queue)
    }
  }
}
