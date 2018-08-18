export default class Queue<A> extends Array<A> {
  pull<B>(f: (a: A) => B, init: () => B): B {
    if (this.length) {
      return f(this.shift() as A)
    }
    return init()
  }
}
