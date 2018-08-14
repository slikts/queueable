import { memoize } from 'tuplerone'
import Deferred from './Deferred'
import CallQueue from './CallQueue'

const getState = memoize(<A>(o: AsyncQueue<A>) => {
  const resolvers = new Set<CallQueue<A>>()
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
        queue.callNext(values.shift() as A)
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
    const queue = new CallQueue<A>()
    const { resolvers, update } = getState(this)
    resolvers.add(queue)
    try {
      while (true) {
        const { promise, resolve } = new Deferred<A>()
        queue.push(resolve)
        yield promise
      }
    } finally {
      resolvers.delete(queue)
    }
  }
}
