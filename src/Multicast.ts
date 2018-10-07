import Balancer from './Balancer';

/**
 * Multicasts pushed values to a variable number of async iterable iterators
 * as receivers or subscribers.
 *
 * Does not buffer pushed values; if no receivers are registered, pushed
 * values are silently discarded.
 */
export default class Multicast<A> implements AsyncIterable<A> {
  onStart?(): void;
  onStop?(): void;

  readonly receivers: Set<Balancer<A>> = new Set();

  /**
   * Pushes a value to all registered receivers.
   */
  push(value: A): this {
    this.receivers.forEach(balancer => balancer.push(value));
    return this;
  }

  /**
   * Creates and registers a receiver.
   */
  [Symbol.asyncIterator](): AsyncIterableIterator<A> {
    const balancer = new Balancer<A>();
    const { receivers } = this;
    receivers.add(balancer);
    if (this.onStart && receivers.size === 1) {
      this.onStart();
    }
    return balancer.wrap(() => {
      receivers.delete(balancer);
      if (this.onStop && receivers.size === 0) {
        this.onStop();
      }
    });
  }
}
