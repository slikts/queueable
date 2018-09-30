type AI<A> = AsyncIterable<A>

export const map = async function*<A, B>(as: AI<A>, f: (a: A) => B): AsyncIterableIterator<B> {
  for await (const a of as) {
    yield f(a)
  }
}

export const filter = async function*<A>(
  p: (a: A) => boolean,
  as: AI<A>,
): AsyncIterableIterator<A> {
  for await (const a of as) {
    if (p(a)) {
      yield a
    }
  }
}

export const reduce = async <A, B>(f: (a: A, b: B) => A, init: A, bs: AI<B>): Promise<A> => {
  let a: A = init
  for await (const b of bs) {
    a = f(a, b)
  }
  return a
}
