import AsyncQueue from '../src/AsyncQueue'

describe('AsyncQueue', () => {
  it('constructs', () => {
    expect(new AsyncQueue()).toBeInstanceOf(AsyncQueue)
  })

  it('pushes one fater pulling', async () => {
    const q = new AsyncQueue<number>()
    const it = q[Symbol.asyncIterator]()
    const z = it.next()
    q.push(1)
    expect((await z).value).toBe(1)
  })

  it('pushes many', async () => {
    const q = new AsyncQueue<number>()
    const it = q[Symbol.asyncIterator]()
    const zs = Promise.all([it.next(), it.next(), it.next()])
    q.pushMany([1, 2, 3])
    expect((await zs).map(({ value }) => value)).toEqual([1, 2, 3])
  })

  it('pushes one before pulling', async () => {
    const q = new AsyncQueue<number>()
    const it = q[Symbol.asyncIterator]()
    q.push(1)
    const z = it.next()
    it.next()
    expect((await z).value).toBe(1)
  })

  it('can be closed', async () => {
    const q = new AsyncQueue<number>()
    const it = q[Symbol.asyncIterator]()
    it.return && it.return()
    expect(await it.next()).toEqual({ done: true, value: undefined })
  })

  it('can be pushed and then closed', async () => {
    const q = new AsyncQueue<number>()
    const it = q[Symbol.asyncIterator]()
    q.push(1)
    expect(await it.next()).toEqual({ done: false, value: 1 })
    expect(await (it.return && it.return())).toEqual({ done: true, value: undefined })
    expect(await it.next()).toEqual({ done: true, value: undefined })
  })
})
