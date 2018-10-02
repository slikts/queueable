import Deferred from './Deferred';
import Queue from './Queue';

type Result<A> = IteratorResult<A>;

/** The result returned from closed iterators. */
const closedResult = Object.freeze({
  value: undefined as any,
  done: true,
});

/**
 * Async iterable iterator with a non-optional [[return]] method.
 */
interface WrappedBalancer<A> extends AsyncIterableIterator<A> {
  // TODO the result can be undefined as well
  return(value?: A): Promise<Result<A>>;
  throw?: undefined;
}

/**
 * Balances a push queue with a pull queue.
 */
export default class Balancer<A> implements AsyncIterableIterator<A> {
  /** Pushed results waiting for pulls to resolve */
  readonly resultQueue = new Queue<Result<A>>();
  /** Unresolved pulls waiting for results to be pushed */
  readonly resolverQueue = new Queue<(a: Result<A>) => void>();
  closed = false;

  /**
   * Pull a promise of the next [[Result]].
   */
  next(): Promise<Result<A>> {
    if (this.closed) {
      return Promise.resolve(closedResult);
    }
    return this.resultQueue.dequeueDefault(
      (result: Result<A>) => (result.done ? this.return(result.value) : Promise.resolve(result)),
      () => {
        const { resolve, promise } = new Deferred<Result<A>>();
        this.resolverQueue.enqueue(resolve);
        return promise;
      },
    );
  }

  /**
   * Push the next [[Result]] value.
   *
   * @param value
   * @param done If true, closes the balancer when this result is resolved
   * @throws Throws if the balancer is already closed
   */
  push(value: A, done = false): void {
    if (this.closed) {
      throw Error('Iterator is closed');
    }
    const result: Result<A> = {
      value,
      done,
    };
    this.resolverQueue.dequeueDefault(
      resolve => resolve(result),
      () => void this.resultQueue.push(result),
    );
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
    if (!this.closed) {
      this.closed = true;
      // Clear the queues
      this.resultQueue.length = 0;
      this.resolverQueue.length = 0;
    }
    return {
      done: true,
      value: value as any, // cast as any because the TS lib types are incorrect
    };
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
        // TODO why is this ignore necessary? the else path is covered by tests
        // istanbul ignore next
        if (onReturn) {
          onReturn();
        }
        return this.return(value);
      },
    };
  }
}
