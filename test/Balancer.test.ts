import Balancer from '../src/Balancer'

type AsyncIterator<A> = any
declare global {
  interface AsyncIterable<A> {}
}

const take = async <A>(a: AsyncIterator<A>, n: number) =>
  (await Promise.all(Array.from(Array(n), (_, i) => a.next()))).map(({ value }) => value)

describe('AsyncQueue', () => {
  it('constructs', () => {
    expect(new Balancer()).toBeInstanceOf(Balancer)
  })

  it('can balance pull after push', async () => {
    const b = new Balancer<number>()
    const ns = [1, 2, 3]
    ns.forEach(n => b.push(n))
    const ps = ns.map(() => b.next())
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns)
  })

  it('works with for-await-of', async () => {
    const b = new Balancer<number>()
    const ns = [1, 2, 3]
    ns.forEach(n => b.push(n))
    b.push(undefined, true)
    const r = []
    for await (const x of b) {
      r.push(x)
    }
    expect(r).toEqual(ns)
  })

  it('can balance push after pull', async () => {
    const b = new Balancer<number>()
    const ns = [1, 2, 3]
    const ps = ns.map(() => b.next())
    ns.forEach(n => b.push(n))
    expect((await Promise.all(ps)).map(({ value }) => value)).toEqual(ns)
  })

  it('can be wrapped', async () => {
    const b = new Balancer()
    const ns = [1, 2, 3]
    ns.forEach(n => b.push(n))
    expect(await take(b.wrap(), 3)).toEqual(ns)
  })

  it('wrapper return calls back', async () => {
    const b = new Balancer()
    const ns = [1, 2, 3]
    ns.forEach(n => b.push(n))
    let a = 0
    const it = b.wrap(() => {
      a = 1
    })
    it.next()
    await it.return()
    expect(a).toBe(1)
  })
})
