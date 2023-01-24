import fastList from 'fast-list';

/**
 * First-in, first-out (FIFO) buffer (queue) with default item values.
 * Optionally circular based on {@link Buffer.limit}.
 * Can be switched to LIFO with {@link Buffer#reverse}.
 */
export default class Buffer<A> {
  #list: fastList.List<A>;
  #reversed = false;
  length = 0;

  constructor(
    /** The length after which the buffer becomes circular, i.e., discards oldest items. */
    readonly limit = Infinity,
  ) {
    this.#list = new fastList();
  }
  /**
   * Add an item to the end of the buffer.
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
   * Return the oldest item from the buffer.
   */
  dequeue(): A {
    if (this.length === 0) {
      throw Error('Buffer is empty');
    }
    this.length -= 1;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.#reversed ? this.#list.pop()! : this.#list.shift()!;
  }

  clear(): void {
    this.length = 0;
    this.#list.drop();
  }

  forEach(f: (value: A) => void): void {
    this.#list.forEach(f);
  }

  reverse() {
    this.#reversed = true;
    return this;
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        return this.length > 0
          ? {
              value: this.dequeue(),
              done: false as const,
            }
          : {
              done: true as const,
              value: undefined,
            };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  static from<A>(iterable: Iterable<A>, limit: number) {
    const buffer = new Buffer<A>(limit);
    for (const value of iterable) {
      buffer.enqueue(value);
    }
    return buffer;
  }
}
