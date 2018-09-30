import Deferred from './Deferred'
import Queue from './Queue'

type Result<A> = IteratorResult<A>

/**
 * Balances a push queue with a pull queue; pushing queues a pull, and pulling queues a push.
 */
export default class Balancer<A> implements AsyncIterableIterator<A> {
  readonly pushOverflow = new Queue<Result<A>>()
  readonly pullOverflow = new Queue<(a: Result<A>) => void>()

  next(): Promise<Result<A>> {
    return this.pushOverflow.pull(
      (value: Result<A>) => Promise.resolve(value),
      () => {
        const { resolve, promise } = new Deferred<Result<A>>()
        this.pullOverflow.push(resolve)
        return promise
      },
    )
  }

  push(value: A, done = false): void {
    const result: IteratorResult<A> = {
      value,
      done,
    }
    this.pullOverflow.pull(resolve => resolve(result), () => void this.pushOverflow.push(result))
  }

  [Symbol.asyncIterator]() {
    return this
  }

  /**
   * Convert the balancer to a generic async iterable iterator to hide the balancer implementation.
   */
  async *wrap(onReturn?: () => void): AsyncIterableIterator<A> {
    try {
      yield* this
    } finally {
      /* istanbul ignore next */
      if (onReturn) {
        onReturn()
      }
    }
  }
}
