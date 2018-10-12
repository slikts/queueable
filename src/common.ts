export interface Returnable<A> extends AsyncIterableIterator<A> {
  return(value?: A): Promise<IteratorResult<A>>;
}

export interface PushAdapter<A> extends AsyncIterableIterator<A> {
  push(value: A): Promise<IteratorResult<A>>;
  wrap(onReturn?: () => void): AsyncIterableIterator<A>;
}

/** The result returned from closed iterators. */
export const doneResult = Object.freeze({
  value: undefined!,
  done: true,
});

export const donePromise = Promise.resolve(doneResult);
