import Deferred from './Deferred'
import Queue from './Queue'

export default class Balancer<A> implements AsyncIterableIterator<A> {
  readonly unpulled = new Queue<IteratorResult<A>>()
  readonly unpushed = new Queue<(a: IteratorResult<A>) => void>()

  next(): Promise<IteratorResult<A>> {
    return this.unpulled.pull(
      (value: IteratorResult<A>) => Promise.resolve(value),
      () => {
        const { resolve, promise } = new Deferred<IteratorResult<A>>()
        this.unpushed.push(resolve)
        return promise
      },
    )
  }

  push(value: A): void {
    const result = {
      done: false,
      value,
    }
    this.unpushed.pull(resolve => resolve(result), () => void this.unpulled.push(result))
  }

  [Symbol.asyncIterator]() {
    return this
  }
}
