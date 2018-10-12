import Balancer from './Balancer';
import PushAdapter from '../PushAdapter';

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

  readonly receivers: Set<PushAdapter<A>> = new Set();

  constructor(private readonly init: () => PushAdapter<A> = () => new Balancer()) {}

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
    const producer = this.init();
    const { receivers } = this;
    receivers.add(producer);
    if (this.onStart && receivers.size === 1) {
      this.onStart();
    }
    return producer.wrap(() => {
      receivers.delete(producer);
      if (this.onStop && receivers.size === 0) {
        this.onStop();
      }
    });
  }
}
