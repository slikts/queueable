import Deferred from '../Deferred';
import LinkedQueue from '../LinkedQueue';
import { PushAdapter, doneResult } from '../common';
import fromDom from '../fromDom';
import fromEmitter from '../fromEmitter';

type Result<A> = IteratorResult<A>;

/**
 * Async iterable iterator with a non-optional [[return]] method.
 */
interface WrappedBalancer<A> extends AsyncIterableIterator<A> {
  // TODO the result can be undefined as well
  return(value?: A): Promise<Result<A>>;
  throw?: undefined;
}

interface Unpushed<A> {
  result: Result<A>;
  defer: Deferred<Result<A>>;
}

/**
 * Balances a push queue with a pull queue.
 */
export default class Channel<A> implements PushAdapter<A> {
  /** Pushed results waiting for pulls to resolve */
  readonly pushBuffer: LinkedQueue<Unpushed<A>>;
  /** Unresolved pulls waiting for results to be pushed */
  readonly pullBuffer: LinkedQueue<Deferred<Result<A>>>;
  /** Determines whether new values can be pushed or pulled */
  private closed = false;

  static fromDom = fromDom(() => new Channel());
  static fromEmitter = fromEmitter(() => new Channel());

  constructor(pushLimit = 0, pullLimit = 0) {
    this.pushBuffer = new LinkedQueue(pushLimit);
    this.pullBuffer = new LinkedQueue(pullLimit);
  }

  /**
   * Pull a promise of the next [[Result]].
   */
  next(): Promise<Result<A>> {
    if (this.closed) {
      return Promise.resolve(doneResult);
    }
    if (this.pushBuffer.length === 0) {
      const defer = new Deferred<Result<A>>();
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
   * Push the next [[Result]] value.
   *
   * @param value
   * @param done If true, closes the balancer when this result is resolved
   * @throws Throws if the balancer is already closed
   */
  push(value: A, done = false): Promise<Result<A>> {
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
    const defer = new Deferred<Result<A>>();
    this.pushBuffer.enqueue({ result, defer });
    return defer.promise;
  }

  /**
   * Returns itself, since [[Balancer]] already implements the iterator protocol.
   */
  [Symbol.asyncIterator]() {
    return this;
  }

  /**
   * Closes the balancer; clears the queues and makes [[Balancer.next]] only
   * return [[closedResult]].
   *
   * @param value The result value to be returned
   */
  async return(value?: A): Promise<Result<A>> {
    this.close();
    return {
      done: true,
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
   * Convert [[Balancer]] to a generic async iterable iterator to hide implementation details.
   *
   * @param onReturn Optional callback for when the iterator is closed with [[Balancer.return]]
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
