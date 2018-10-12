import Deferred from '../Deferred';
import { PushAdapter, doneResult } from '../common';
import { fromDom, fromEmitter } from '../from';

export default class LastResult<A> implements PushAdapter<A> {
  private buffer: Deferred<IteratorResult<A>> = new Deferred();
  private closed = false;
  private resolved = false;
  private requested = false;

  static fromDom = fromDom(() => new LastResult());
  static fromEmitter = fromEmitter(() => new LastResult());

  push(value: A, done = false): Promise<IteratorResult<A>> {
    if (this.closed) {
      throw Error('Iterator closed');
    }
    const result = {
      value,
      done,
    };
    if (this.resolved === false) {
      this.resolved = true;
    } else {
      this.buffer = new Deferred();
      this.resolved = false;
    }
    this.requested = false;
    this.buffer.resolve(result);
    return this.buffer.promise;
  }

  async next(): Promise<IteratorResult<A>> {
    if (this.closed) {
      return doneResult;
    }
    this.requested = true;
    return this.buffer.promise;
  }

  async return(value?: A): Promise<IteratorResult<A>> {
    this.closed = true;
    if (!this.resolved && this.requested) {
      this.buffer.reject(new Error('Closing'));
    }
    return Promise.resolve({
      value: value!,
      done: true,
    });
  }

  wrap(onReturn?: () => void) {
    const wrapped = {
      next: () => this.next(),
      [Symbol.asyncIterator]() {
        return this;
      },
      return: (value?: A) => {
        if (onReturn) {
          onReturn();
        }
        return this.return(value);
      },
    };
    return wrapped;
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
