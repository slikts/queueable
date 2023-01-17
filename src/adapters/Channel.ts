import Deferred from '../Deferred';
import LinkedQueue from '../LinkedQueue';
import { PushAdapter, doneResult } from '../common';
import fromDom from '../fromDom';
import fromEmitter from '../fromEmitter';

/**
 * Async iterable iterator with a non-optional return method.
 */
export interface WrappedBalancer<A> extends AsyncIterableIterator<A> {
  // TODO the result can be undefined as well
  return(value?: A): Promise<IteratorResult<A>>;
  throw?: undefined;
}

export interface Unpushed<A> {
  result: IteratorResult<A>;
  defer: Deferred<IteratorResult<A>>;
}
/**
 * Balances a push queue with a pull queue, also known as a
 * dropping-buffer channel, since the queues are FIFO and
 * can be set to be bounded, i.e., to drop the oldest enqueued
 * values if the limit is exceeded. The channel is unbounded
 * by default.
 */
export default class Channel<A> implements PushAdapter<A> {
  /** Pushed results waiting for pulls to resolve */
  readonly pushBuffer: LinkedQueue<Unpushed<A>>;
  /** Unresolved pulls waiting for results to be pushed */
  readonly pullBuffer: LinkedQueue<Deferred<IteratorResult<A>>>;
  /** Determines whether new values can be pushed or pulled */
  private closed = false;

  static fromDom = fromDom(() => new Channel());
  static fromEmitter = fromEmitter(() => new Channel());

  constructor(
    /** Limit (bounds) after which the oldest buffered value is dropped. */
    limit = 0,
  ) {
    this.pushBuffer = new LinkedQueue(limit);
    this.pullBuffer = new LinkedQueue(limit);
  }

  /**
   * Pull a promise of the next result.
   */
  next(): Promise<IteratorResult<A>> {
    if (this.closed) {
      return Promise.resolve(doneResult);
    }
    if (this.pushBuffer.length === 0) {
      const defer = new Deferred<IteratorResult<A>>();
      // Buffer the pull to be resolved later
      this.pullBuffer.enqueue(defer);
      // Return the buffered promise that will be resolved and dequeued when a value is pushed
      return defer.promise;
    }
    const { result, defer } = this.pushBuffer.dequeue();
    defer.resolve(result);
    if (result.done) {
      this.close();
    }
    return defer.promise;
  }

  /**
   * Push the next result value.
   *
   * @param value - Result
   * @param done - If true, closes the balancer when this result is resolved
   * @throws Throws if the balancer is already closed
   */
  push(value: A, done = false): Promise<IteratorResult<A>> {
    if (this.closed) {
      return Promise.resolve(doneResult);
    }
    const result = {
      value,
      done,
    };
    if (this.pullBuffer.length > 0) {
      return this.pullBuffer.dequeue().resolve(result);
    }
    const defer = new Deferred<IteratorResult<A>>();
    this.pushBuffer.enqueue({ result, defer });
    return defer.promise;
  }

  /**
   * Returns itself, since {@link Channel} already implements the iterator protocol.
   */
  [Symbol.asyncIterator]() {
    return this;
  }

  /**
   * Closes the balancer; clears the queues and makes {@link Channel#next} only
   * return `doneResult`.
   *
   * @param value - The result value to be returned
   */
  async return(value?: A): Promise<IteratorResult<A>> {
    this.close();
    return {
      done: true,
      // TODO: fix assertion
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: value!, // asserting as non-undefined because the TS lib types are incorrect
    };
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    // Clear the queues
    this.pushBuffer.forEach(({ defer: { resolve } }) => void resolve(doneResult));
    this.pushBuffer.clear();
    this.pullBuffer.forEach(({ resolve }) => void resolve(doneResult));
    this.pullBuffer.clear();
  }

  /**
   * Convert {@link Channel} to a generic async iterable iterator to hide implementation details.
   *
   * @param onReturn - Optional callback for when the iterator is closed with {@link Channel#return}
   * @throws Throws if called when closed
   */
  wrap(onReturn?: () => void): WrappedBalancer<A> {
    if (this.closed) {
      throw Error('Balancer is closed');
    }
    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      next: () => this.next(),
      return: async (value?: A) => {
        if (onReturn) {
          onReturn();
        }
        return this.return(value);
      },
    };
  }
}
