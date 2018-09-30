import Balancer from './Balancer'

/**
 * Multicasts pushed values to a variable number of async iterable iterators
 * as receivers or subscribers.
 *
 * Does not buffer pushed values; if no receivers are registered, pushed
 * values are silently discarded.
 */
export default class Multicast<A> implements AsyncIterable<A> {
  readonly receivers: Set<Balancer<A>> = new Set()

  /**
   * Pushes a value to all registered receivers.
   */
  push(value: A): this {
    this.receivers.forEach(balancer => balancer.push(value))
    return this
  }

  /**
   * Pushes multiple values.
   */
  pushMany(values: A[]): this {
    values.forEach(this.push, this)
    return this
  }

  /**
   * Creates and registers a receiver.
   */
  [Symbol.asyncIterator](): AsyncIterableIterator<A> {
    const balancer = new Balancer<A>()
    this.receivers.add(balancer)
    return balancer.wrap(() => void this.receivers.delete(balancer))
  }
}
