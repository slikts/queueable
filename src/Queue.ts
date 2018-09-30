/**
 * First-in, first-out (FIFO) buffer (queue) with default item values.
 */
export default class Queue<A> extends Array<A> {
  /**
   * Add an item to the end of the queue.
   *
   * @param a Item to be enqueued
   */
  enqueue(a: A) {
    this.push(a)
  }

  /**
   * Either handles and returns the first item in the queue (if the queue isn't empty) or
   * makes and returns a default value.
   *
   * @param handle Callback for handling the first item in the queue
   * @param init Callback for making the default value
   */
  dequeueDefault<B>(handle: (a: A) => B, init: () => B): B {
    if (this.length) {
      return handle(this.shift() as A)
    }
    return init()
  }
}
