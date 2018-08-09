import AsyncQueue from '../src/asyncqueue'

describe('AsyncQueue', () => {
  it('constructs', () => {
    expect(new AsyncQueue()).toBeInstanceOf(AsyncQueue)
  })

  it('iterates', async () => {
    const q: any = new AsyncQueue()
    q.push(1)
    q.push(2)
    q.push(3)
    let n = 0
    try {
      for await (const x of q) {
        n += x
        if (n === 6) {
          break
        }
      }
    } finally {
      expect(n).toBe(6)
    }
  })
})
