export default interface PushAdapter<A> extends AsyncIterableIterator<A> {
  push(value: A): Promise<IteratorResult<A>>;
  wrap(onReturn?: () => void): AsyncIterableIterator<A>;
}
