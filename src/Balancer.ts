import Deferred from './Deferred'

export default class Balancer<A> implements AsyncIterableIterator<A> {
  private readonly unpulled: A[] = []
  private readonly unpushed: Array<any> = []

  async next(): Promise<IteratorResult<A>> {
    if (this.unpulled.length) {
      return {
        done: false,
        value: this.unpulled.shift() as A,
      }
    }
    const { resolve, promise } = new Deferred<IteratorResult<A>>()
    this.unpushed.push(resolve)
    return promise
  }

  push(value: A): void {
    if (this.unpushed.length) {
      ;(this.unpushed.shift() as any).call(null, value)
      return
    }
    this.unpulled.push(value)
  }

  [Symbol.asyncIterator]() {
    return this
  }
}
