import fastList from 'fast-list';

/**
 * First-in, first-out (FIFO) buffer (queue) with default item values.
 * Optionally circular based on {@link LinkedQueue.limit}.
 */
export default class LinkedQueue<A> {
  #list: fastList.List<A>;
  length = 0;

  constructor(
    /** The length after which the queue becomes circular, i.e., discards oldest items. */
    readonly limit = Infinity,
  ) {
    this.#list = new fastList();
  }
  /**
   * Add an item to the end of the queue.
   */
  enqueue(value: A): void {
    const list = this.#list;
    if (list.length === this.limit) {
      // Discard oldest item
      list.shift();
    } else {
      this.length += 1;
    }
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.#list.shift()!;
  }

  clear(): void {
    this.length = 0;
    this.#list.drop();
  }

  forEach(f: (value: A) => void): void {
    this.#list.forEach(f);
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        return this.length > 0
          ? {
              value: this.dequeue(),
              done: false,
            }
          : {
              done: true,
            };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }
}
