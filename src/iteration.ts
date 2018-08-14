import AsyncQueue from './AsyncQueue'

type AI<A> = AsyncIterable<A>

export const map = async function*<A, B>(as: AI<A>, f: (a: A) => B): AsyncIterableIterator<B> {
  for await (const a of as) {
    yield f(a)
  }
}

export const filter = async function*<A>(
  as: AI<A>,
  p: (a: A) => boolean,
): AsyncIterableIterator<A> {
  for await (const a of as) {
    if (p(a)) {
      yield a
    }
  }
}

export const forward = async <A>(source: AI<A>, destination: AsyncQueue<A>): Promise<void> => {
  await map(source, (a: A) => {
    destination.push(a)
  })
}

export const merge = <A>(a1: AI<A>, a2: AI<A>): AI<A> => {
  const queue: AsyncQueue<A> = new AsyncQueue()
  forward(a1, queue)
  forward(a2, queue)
  return queue
}
