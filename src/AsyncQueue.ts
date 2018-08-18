import { memoize } from 'tuplerone'
import Balancer from './Balancer'

const getSubs = memoize(<A>(o: AsyncQueue<A>): Set<Balancer<A>> => new Set())

export default class AsyncQueue<A> implements AsyncIterable<A> {
  push(value: A): this {
    getSubs(this).forEach(balancer => balancer.push(value))
    return this
  }

  pushMany(values: A[]): this {
    values.forEach(this.push, this)
    return this
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<A> {
    const subs = getSubs(this)
    const balancer = new Balancer<A>()
    subs.add(balancer)
    return balancer.wrap(() => void subs.delete(balancer))
  }
}
