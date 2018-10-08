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

interface Unpushed<A> {
  result: Result<A>;
  defer: Deferred<Result<A>>;
}

/**
 * Balances a push queue with a pull queue.
 */
export default class Balancer<A> implements AsyncIterableIterator<A> {
  /** Pushed results waiting for pulls to resolve */
  readonly pushBuffer: Queue<Unpushed<A>>;
  /** Unresolved pulls waiting for results to be pushed */
  readonly pullBuffer: Queue<Deferred<Result<A>>>;
  /** Determines whether new values can be pushed or pulled */
  private closed = false;

  constructor(pushLimit = 0, pullLimit = 0) {
    this.pushBuffer = new Queue(pushLimit);
    this.pullBuffer = new Queue(pullLimit);
  }

  /**
   * Pull a promise of the next [[Result]].
   */
  next(): Promise<Result<A>> {
    if (this.closed) {
      return Promise.resolve(closedResult);
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
      throw Error('Iterator is closed');
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
      value: value as any, // cast as any because the TS lib types are incorrect
    };
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    // Clear the queues
    // TODO reject with an Error instance?
    this.pushBuffer.forEach(({ defer: { reject } }) => void reject());
    this.pushBuffer.clear();
    this.pullBuffer.forEach(({ reject }) => void reject());
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
