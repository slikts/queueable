export default class Deferred<A> {
  promise: Promise<A>
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export default interface Deferred<A> {
  resolve: (a?: A | PromiseLike<A>) => void
  reject: (reason?: string) => void
}
