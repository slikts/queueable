import Deferred from './Deferred'
import Queue from './Queue'

type Result<A> = IteratorResult<A>

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
    const result = {
      value,
      done,
    }
    this.pullOverflow.pull(resolve => resolve(result), () => void this.pushOverflow.push(result))
  }

  [Symbol.asyncIterator]() {
    return this
  }

  async *wrap(onReturn?: () => void) {
    try {
      yield* this
    } finally {
      if (onReturn) onReturn()
    }
  }
}
