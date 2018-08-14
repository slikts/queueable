import AsyncQueue from '../src/AsyncQueue'

describe('AsyncQueue', () => {
  it('constructs', () => {
    expect(new AsyncQueue()).toBeInstanceOf(AsyncQueue)
  })

  it('pushes one', async () => {
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

  it('pushes many', async () => {
    const q = new AsyncQueue<number>()
  })
})
