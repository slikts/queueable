import * as FastList from 'fast-list';

const fastList = FastList;

/**
 * First-in, first-out (FIFO) buffer (queue) with default item values.
 * Optionally circular based on [[Queue.limit]].
 */
export default class Queue<A> {
  private list: FastList.List<A>;
  length = 0;

  constructor(
    /** The length after which the queue becomes circular, i.e., discards oldest items. */
    private limit = 0,
  ) {
    this.list = fastList();
  }
  /**
   * Add an item to the end of the queue.
   */
  enqueue(value: A): void {
    const { list } = this;
    if (this.limit > 0 && list.length === this.limit) {
      // Discard oldest item
      list.shift();
    }
    this.length += 1;
    list.push(value);
  }
  /**
   * Return the oldest item from the queue.
   */
  dequeue(): A {
    if (this.length === 0) {
      throw Error('Queue is empty');
    }
    this.length -= 1;
    return this.list.shift() as A;
  }

  clear(): void {
    this.length = 0;
    this.list.drop();
  }

  forEach(f: (value: A) => void): void {
    this.list.forEach(f);
  }
}
