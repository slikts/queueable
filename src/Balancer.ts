import Deferred from './Deferred'

export default class Balancer<A> {
  readonly valueQueue: A[] = []
  readonly promiseQueue: Array<(a: A) => void> = []

  async pull(): Promise<A> {
    if (this.valueQueue.length) {
      return this.valueQueue.shift() as A
    }
    const { resolve, promise } = new Deferred<A>()
    this.promiseQueue.push(resolve)
    return promise
  }

  push(a: A): void {
    if (this.promiseQueue.length) {
      ;(this.promiseQueue.shift() as any).call(null, a)
      return
    }
    this.valueQueue.push(a)
  }
}
