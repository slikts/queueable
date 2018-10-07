import * as FastList from 'fast-list';

const fastList = FastList;

/**
 * First-in, first-out (FIFO) buffer (queue) with default item values.
 */
export default class Queue<A> {
  private list: FastList.List<A>;
  constructor() {
    this.list = fastList();
  }
  /**
   * Add an item to the end of the queue.
   *
   * @param value Item to be enqueued
   */
  enqueue(value: A): void {
    this.list.push(value);
  }
  /**
   * Either handles and returns the first item in the queue (if the queue isn't empty) or
   * makes and returns a default value.
   *
   * @param handle Callback for handling the first item in the queue
   * @param init Callback for making the default value
   */
  dequeueDefault<B>(handle: (a: A) => B, init: () => B): B {
    if (!this.list.length) {
      return init();
    }
    return handle(this.list.shift() as A);
  }

  clear(): void {
    this.list.drop();
  }

  forEach(f: (value: A) => void): void {
    this.list.forEach(f);
  }
}
